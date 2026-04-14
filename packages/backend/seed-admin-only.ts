/**
 * SEED - Admin User Only
 *
 * Creates a single admin user for fresh start
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creating admin user...\n');

  const admin = await prisma.user.create({
    data: {
      email: 'admin@scr.com',
      name: 'Admin',
      passwordHash: await bcrypt.hash('admin123', 10),
    },
  });

  console.log('✅ Admin User Created:');
  console.log(`   Email: ${admin.email}`);
  console.log(`   Password: admin123`);
  console.log('');
  console.log('Ready to create your first project! 🚀');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error:', e.message);
    await prisma.$disconnect();
    process.exit(1);
  });
