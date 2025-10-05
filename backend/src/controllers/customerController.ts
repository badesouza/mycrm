import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { processExcelFile } from '../services/excelService';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export const customerController = {
  // Get all customers with search and pagination
  async getAllCustomers(req: Request, res: Response) {
    try {
      const search = (req.query.search as string) || '';
      const page = parseInt((req.query.page as string) || '1', 10);
      const pageSize = parseInt((req.query.pageSize as string) || '10', 10);
      const skip = (page - 1) * pageSize;

      const where = search
        ? {
            OR: [
              { name: { contains: search } },
              { email: { contains: search } },
              { phone: { contains: search } },
              { district: { contains: search } },
              { manager: { contains: search } }
            ]
          }
        : {};

      const [data, total] = await Promise.all([
        prisma.customer.findMany({
          where,
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: pageSize,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            district: true,
            manager: true,
            due_date: true,
            amount: true,
            status: true,
            paymentMethod: true,
            imageLogo: true,
            createdAt: true,
            updatedAt: true
          }
        }),
        prisma.customer.count({ where })
      ]);

      res.json({ data, total, page, pageSize });
    } catch (error) {
      console.error('Error fetching customers:', error);
      res.status(500).json({ 
        message: 'Error fetching customers',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Get a single customer
  async getCustomer(req: Request, res: Response) {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: req.params.id }
      });
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      res.json(customer);
    } catch (error) {
      console.error('Error fetching customer:', error);
      res.status(500).json({ message: 'Error fetching customer' });
    }
  },

  // Create new customer
  async createCustomer(req: Request, res: Response) {
    try {
      const { name, email, phone, district, manager, due_date, amount, status, paymentMethod } = req.body;
      const imageLogo = req.file ? req.file.filename : null;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      // Validate required fields
      if (!name || !email || !phone || !district || !manager || !due_date || !amount || !paymentMethod) {
        return res.status(400).json({ 
          message: 'Missing required fields',
          details: { name, email, phone, district, manager, due_date, amount, paymentMethod }
        });
      }

      // Create the customer
      const customer = await prisma.customer.create({
        data: {
          name,
          email,
          phone,
          district,
          manager,
          due_date: new Date(due_date),
          amount: parseFloat(amount),
          status: status || 'active',
          paymentMethod,
          imageLogo,
        },
      });

      // Get the user details for the payment record
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        // If user not found, delete the created customer and return error
        await prisma.customer.delete({
          where: { id: customer.id }
        });
        return res.status(500).json({ message: 'User not found' });
      }

      // Create the initial payment record automatically
      const payment = await prisma.payment.create({
        data: {
          customerId: customer.id,
          userId: userId,
          amount: parseFloat(amount),
          status: 'unpaid',
          due_date: new Date(due_date),
          userName: user.name,
          paymentMethod: paymentMethod
        }
      });

      // Calculate next invoice date (same day next month)
      const dueDate = new Date(due_date);
      const nextInvoiceDate = new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, dueDate.getDate());

      // Update customer with next invoice date
      await prisma.customer.update({
        where: { id: customer.id },
        data: { next_invoice_at: nextInvoiceDate }
      });

      console.log('Payment created automatically for customer:', {
        customerId: customer.id,
        customerName: customer.name,
        paymentId: payment.id,
        amount: payment.amount,
        due_date: payment.due_date,
        paymentMethod: payment.paymentMethod,
        next_invoice_at: nextInvoiceDate
      });

      res.status(201).json(customer);
    } catch (error: any) {
      console.error('Error creating customer:', error);
      
      if (error.code === 'P2002') {
        return res.status(400).json({ 
          message: 'A customer with this email already exists',
          error: error.message 
        });
      }

      res.status(500).json({ 
        message: 'Error creating customer',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Update a customer
  async updateCustomer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      // Ensure imageLogo is included in the update
      if (updateData.imageLogo === null || updateData.imageLogo === undefined) {
        const existingCustomer = await prisma.customer.findUnique({
          where: { id },
          select: { imageLogo: true }
        });
        if (existingCustomer) {
          updateData.imageLogo = existingCustomer.imageLogo;
        }
      }

      const customer = await prisma.customer.update({
        where: { id },
        data: updateData
      });
      res.json(customer);
    } catch (error) {
      console.error('Error updating customer:', error);
      res.status(500).json({ message: 'Error updating customer' });
    }
  },

  // Delete a customer
  async deleteCustomer(req: Request, res: Response) {
    try {
      await prisma.customer.delete({
        where: { id: req.params.id }
      });
      res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
      console.error('Error deleting customer:', error);
      res.status(500).json({ message: 'Error deleting customer' });
    }
  },

  // Upload Excel file and process customers
  async uploadExcel(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Nenhum arquivo enviado' });
      }

      const filePath = req.file.path;
      const result = await processExcelFile(filePath);

      res.json({
        message: `Processamento concluído. ${result.success} clientes importados com sucesso.`,
        success: result.success,
        errors: result.errors
      });
    } catch (error) {
      console.error('Error processing Excel file:', error);
      res.status(500).json({
        message: 'Erro ao processar arquivo Excel',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
}; 