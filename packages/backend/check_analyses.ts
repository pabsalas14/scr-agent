import { prisma } from './src/services/prisma.service';

async function checkAnalyses() {
  const analyses = await prisma.analysis.findMany({
    include: {
      project: true,
      findings: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  console.log('=== RECENT ANALYSES ===\n');
  for (const analysis of analyses) {
    console.log(`Project: ${analysis.project.name}`);
    console.log(`Status: ${analysis.status}`);
    console.log(`Progress: ${analysis.progress}%`);
    console.log(`Findings: ${analysis.findings.length}`);
    console.log(`Started: ${analysis.startedAt}`);
    console.log(`Completed: ${analysis.completedAt}`);
    console.log(`Error: ${analysis.errorMessage || 'None'}`);
    console.log('---');
  }
  
  process.exit(0);
}

checkAnalyses().catch(console.error);
