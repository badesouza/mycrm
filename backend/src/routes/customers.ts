import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import Customer from '../models/customer';

const router = express.Router();
const prisma = new PrismaClient();

// Extend Express Request type to include user
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: function (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
    cb(null, uploadsDir);
  },
  filename: function (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
    // Create unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to only allow images
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Get all customers with search and pagination
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    console.log('Fetching customers with query:', req.query);
    console.log('User from token:', req.user);

    const search = (req.query.search as string) || '';
    const page = parseInt((req.query.page as string) || '1', 10);
    const pageSize = parseInt((req.query.pageSize as string) || '10', 10);
    const skip = (page - 1) * pageSize;

    console.log('Search params:', { search, page, pageSize, skip });

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

    console.log('Where clause:', where);

    try {
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

      console.log('Found customers:', data.length);
      console.log('First customer:', data[0]);

      res.json({ 
        data, 
        total, 
        page, 
        pageSize 
      });
    } catch (prismaError) {
      console.error('Prisma error:', prismaError);
      res.status(500).json({ 
        message: 'Database error',
        error: prismaError instanceof Error ? prismaError.message : 'Unknown database error'
      });
    }
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ 
      message: 'Error fetching customers',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get a single customer
router.get('/:id', authenticateToken, async (req, res) => {
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
});

// Create new customer
router.post('/', authenticateToken, upload.single('imageLogo'), async (req: AuthRequest, res) => {
  try {
    const { name, email, phone, district, manager, due_date, amount, status, paymentMethod } = req.body;
    const imageLogo = req.file ? req.file.filename : null;

    // Get the logged-in user from the token
    const userId = req.user?.id;
    console.log('User ID from token:', userId);

    if (!userId) {
      console.log('User object:', req.user);
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

    // Create the initial payment record
    await prisma.payment.create({
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

    res.status(201).json(customer);
  } catch (error: any) {
    console.error('Error creating customer:', error);
    
    // Handle specific Prisma errors
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
});

// Update a customer
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Ensure imageLogo is included in the update
    if (updateData.imageLogo === null || updateData.imageLogo === undefined) {
      // If imageLogo is not provided, keep the existing value
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
});

// Delete a customer
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.customer.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ message: 'Error deleting customer' });
  }
});

export default router; 