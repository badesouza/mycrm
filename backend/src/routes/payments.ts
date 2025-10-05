import express, { Request } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

// Get all payments with search and pagination
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    console.log('Fetching payments with query:', req.query); // Debug log
    console.log('User from token:', req.user); // Debug log

    const search = (req.query.search as string) || '';
    const page = parseInt((req.query.page as string) || '1', 10);
    const pageSize = parseInt((req.query.pageSize as string) || '10', 10);
    const skip = (page - 1) * pageSize;

    console.log('Search params:', { search, page, pageSize, skip }); // Debug log

    const where = search
      ? {
          OR: [
            { customer: { name: { contains: search } } },
            { userName: { contains: search } },
            { status: { contains: search } },
            { paymentMethod: { contains: search } }
          ]
        }
      : {};

    console.log('Where clause:', where); // Debug log

    try {
      const [data, total] = await Promise.all([
        prisma.payment.findMany({
          where,
          include: {
            customer: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: pageSize,
        }),
        prisma.payment.count({ where })
      ]);

      console.log('Found payments:', data.length); // Debug log
      console.log('First payment:', data[0]); // Debug log

      // Transform the data to match the frontend interface
      const transformedPayments = data.map(payment => {
        console.log('Original payment:', payment); // Log the original payment data
        const transformed = {
          id: payment.id,
          customerId: payment.customerId,
          customerName: payment.customer.name,
          customerPhone: payment.customer.phone,
          amount: payment.amount,
          paymentDate: payment.due_date.toISOString(), // Mantido para compatibilidade
          due_date: payment.due_date.toISOString(),
          payment_date: payment.payment_date ? payment.payment_date.toISOString() : null,
          paymentMethod: payment.paymentMethod,
          status: payment.status,
          userName: payment.userName,
        };
        
        // Debug log para verificar se o telefone está sendo incluído
        console.log('🔍 Payment transformation debug:', {
          id: payment.id,
          customerName: payment.customer.name,
          customerPhone: payment.customer.phone,
          customerPhoneType: typeof payment.customer.phone
        });
        console.log('Transformed payment:', transformed); // Log the transformed payment
        return transformed;
      });

      console.log('Transformed payments:', transformedPayments[0]); // Debug log

      res.json({ 
        data: transformedPayments, 
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
    console.error('Error fetching payments:', error);
    res.status(500).json({ 
      message: 'Error fetching payments',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get a single payment
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    console.log('Fetching payment with ID:', req.params.id);
    console.log('User from token:', req.user);

    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    if (!payment) {
      console.log('Payment not found');
      return res.status(404).json({ message: 'Payment not found' });
    }

    console.log('Found payment:', payment);

    // Transform the payment to match the frontend interface
    const transformedPayment = {
      id: payment.id,
      customerId: payment.customerId,
      customerName: payment.customer.name,
      customerPhone: payment.customer.phone,
      amount: payment.amount,
      paymentDate: payment.due_date.toISOString(), // Mantido para compatibilidade
      due_date: payment.due_date.toISOString(),
      payment_date: payment.payment_date ? payment.payment_date.toISOString() : null,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      userName: payment.userName,
    };

    console.log('Transformed payment:', transformedPayment);
    res.json(transformedPayment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ 
      message: 'Error fetching payment',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create a new payment
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    console.log('Creating payment with user:', req.user);
    console.log('Request body:', req.body);

    if (!req.user || !req.user.id) {
      console.error('No user ID in request');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { customerId, amount, due_date, paymentMethod, status } = req.body;

    // Validate required fields
    if (!customerId || !amount || !due_date || !paymentMethod) {
      console.error('Missing required fields:', { customerId, amount, due_date, paymentMethod });
      return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
      // Get user details for the payment record
      const user = await prisma.user.findUnique({
        where: { id: req.user.id }
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const payment = await prisma.payment.create({
        data: {
          amount: parseFloat(amount),
          due_date: new Date(due_date),
          paymentMethod,
          status: status || 'unpaid',
          userId: req.user.id,
          userName: user.name,
          customerId: customerId
        }
      });

      // Calculate next invoice date (same day next month)
      const dueDate = new Date(due_date);
      const nextInvoiceDate = new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, dueDate.getDate());

      // Update customer with next invoice date
      await prisma.customer.update({
        where: { id: customerId },
        data: { next_invoice_at: nextInvoiceDate }
      });

      console.log('Payment created:', payment);
      console.log('Next invoice date updated for customer:', {
        customerId,
        next_invoice_at: nextInvoiceDate
      });
      
      res.status(201).json(payment);
    } catch (prismaError) {
      console.error('Prisma error:', prismaError);
      res.status(500).json({ 
        message: 'Database error',
        error: prismaError instanceof Error ? prismaError.message : 'Unknown database error'
      });
    }
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ 
      message: 'Error creating payment',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete a payment
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Deleting payment:', id);

    await prisma.payment.delete({
      where: { id }
    });

    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ 
      message: 'Error deleting payment',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update a payment
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { amount, due_date, paymentMethod, status } = req.body;
    console.log('Updating payment:', { id, amount, due_date, paymentMethod, status });

    const payment = await prisma.payment.update({
      where: { id },
      data: {
        amount: parseFloat(amount),
        due_date: new Date(due_date),
        paymentMethod,
        status
      }
    });

    res.json(payment);
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ 
      message: 'Error updating payment',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 