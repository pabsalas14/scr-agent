import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkData() {
  const analyses = await prisma.analysis.findMany({
    include: { findings: true }
  });
  console.log('--- ANALYSES ---');
  console.log(JSON.stringify(analyses, null, 2));
  await prisma.$disconnect();
}

checkData();
