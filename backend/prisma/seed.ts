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
  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      status: 'active',
      createdAt: getBrazilTime(),
    },
  });

  // Create sample customers
  const customer1 = await prisma.customer.upsert({
    where: { email: 'customer1@example.com' },
    update: {},
    create: {
      name: 'Customer One',
      email: 'customer1@example.com',
      phone: '(11) 99999-9999',
      district: 'São Paulo',
      manager: 'John Doe',
      due_date: new Date(new Date().setHours(new Date().getHours() + 24 - 3)), // Tomorrow - 3 hours
      amount: 1000.00,
      status: 'active',
      paymentMethod: 'credit_card',
      createdAt: getBrazilTime(),
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { email: 'customer2@example.com' },
    update: {},
    create: {
      name: 'Customer Two',
      email: 'customer2@example.com',
      phone: '(11) 98888-8888',
      district: 'Rio de Janeiro',
      manager: 'Jane Smith',
      due_date: new Date(new Date().setHours(new Date().getHours() + 48 - 3)), // Day after tomorrow - 3 hours
      amount: 2000.00,
      status: 'active',
      paymentMethod: 'bank_transfer',
      createdAt: getBrazilTime(),
    },
  });

  // Create sample payments
  await prisma.payment.createMany({
    data: [
      {
        customerId: customer1.id,
        userName: admin.name,
        amount: 500.00,
        interest: 0.00,
        status: 'paid',
        createdAt: getBrazilTime(),
      },
      {
        customerId: customer2.id,
        userName: admin.name,
        amount: 1000.00,
        interest: 50.00,
        status: 'unpaid',
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