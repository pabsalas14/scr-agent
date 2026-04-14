import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../packages/backend/.env') });

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function inspect() {
  console.log('Database URL:', process.env.DATABASE_URL);
  
  const models = ['user', 'userSettings', 'project', 'analysis', 'finding'];
  
  for (const model of models) {
    try {
      const count = await (prisma as any)[model].count();
      console.log(`Model ${model}: ${count} records`);
    } catch (err: any) {
      console.log(`Model ${model}: Error - ${err.message}`);
    }
  }
}

inspect().finally(() => prisma.$disconnect());
