import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const initializeScheduler = () => {
  console.log('Initializing scheduler...');
  
  // Test scheduler - runs every minute
  cron.schedule('* * * * *', async () => {
    try {
      const today = new Date();
      console.log('Scheduler running at:', today.toISOString());
      console.log('Current date:', today.getDate());
      
      // Check if it's the 14th day of the month
      if (today.getDate() === 14) {
        console.log('14th day of the month detected. Creating monthly payments...');
        
        // Get admin user
        const adminUser = await prisma.user.findUnique({
          where: { email: 'admin@example.com' }
        });

        if (!adminUser) {
          console.error('Admin user not found');
          return;
        }
        console.log('Admin user found:', adminUser.email);

        // Get all active customers
        const activeCustomers = await prisma.customer.findMany({
          where: { status: 'active' }
        });
        console.log('Found active customers:', activeCustomers.length);

        if (activeCustomers.length === 0) {
          console.log('No active customers found');
          return;
        }

        // Create payment records for each active customer
        for (const customer of activeCustomers) {
          try {
            console.log('Creating payment for customer:', customer.name);
            const payment = await prisma.payment.create({
              data: {
                customerId: customer.id,
                userId: adminUser.id,
                amount: customer.amount,
                status: 'unpaid',
                due_date: customer.due_date,
                userName: 'IA',
                paymentMethod: customer.paymentMethod
              }
            });
            console.log('Successfully created payment:', payment.id);
          } catch (paymentError) {
            console.error('Error creating payment for customer:', customer.name, paymentError);
          }
        }

        console.log(`Created payments for ${activeCustomers.length} active customers`);
      } else {
        console.log('Not the 14th day of the month, skipping payment creation');
      }
    } catch (error) {
      console.error('Error in monthly payment scheduler:', error);
    }
  });

  console.log('Scheduler initialized successfully');
}; 