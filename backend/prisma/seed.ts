import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('@#arroz10', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@gesfood.com' },
    update: {},
    create: {
      email: 'admin@gesfood.com',
      name: 'Admin',
      password: adminPassword,
      status: 'active'
    },
  });

  console.log('Admin user created:', adminUser);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 