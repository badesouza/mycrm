import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Function to get current time in Brazil timezone
function getBrazilTime() {
  const now = new Date();
  // Subtract 3 hours to convert from UTC to Brazil time
  now.setHours(now.getHours() - 3);
  return now;
}

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin',
      password: adminPassword,
      status: 'active'
    },
  });

  console.log('Admin user created:', adminUser);

  // Create sample customers
  const customer1 = await prisma.customer.upsert({
    where: { email: 'customer1@example.com' },
    update: {},
    create: {
      name: 'Customer One',
      email: 'customer1@example.com',
      phone: '(11) 99999-9999',
      district: 'Downtown',
      manager: 'John Doe',
      due_date: new Date(),
      amount: 500.00,
      status: 'active',
      paymentMethod: 'credit_card'
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { email: 'customer2@example.com' },
    update: {},
    create: {
      name: 'Customer Two',
      email: 'customer2@example.com',
      phone: '(11) 88888-8888',
      district: 'Uptown',
      manager: 'Jane Smith',
      due_date: new Date(),
      amount: 1000.00,
      status: 'active',
      paymentMethod: 'bank_transfer'
    },
  });

  console.log('Sample customers created:', { customer1, customer2 });

  // Create sample payments
  await prisma.payment.createMany({
    data: [
      {
        customerId: customer1.id,
        userId: adminUser.id,
        userName: adminUser.name,
        amount: 500.00,
        status: 'paid',
        due_date: new Date(),
        paymentMethod: customer1.paymentMethod,
        createdAt: getBrazilTime(),
      },
      {
        customerId: customer2.id,
        userId: adminUser.id,
        userName: adminUser.name,
        amount: 1000.00,
        status: 'unpaid',
        due_date: new Date(),
        paymentMethod: customer2.paymentMethod,
        createdAt: getBrazilTime(),
      },
    ],
  });

  console.log('Database has been seeded. 🌱');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 