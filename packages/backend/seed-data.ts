/**
 * SEED - Realistic Test Data
 *
 * Creates realistic data for testing:
 * - 5 Projects
 * - 10 Analyses per project
 * - 50 Findings total with realistic distribution
 * - 24 Critical (48%), 15 High (30%), 8 Medium (16%), 3 Low (6%)
 * - Assignments and remediations for some findings
 */

import { PrismaClient, Severity } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 SEED: Creating realistic test data...\n');

  // 1. Create additional users
  console.log('👥 Creating additional users...');
  const users = [
    { email: 'analyst@scr.com', name: 'Analyst User' },
    { email: 'developer@scr.com', name: 'Developer User' },
    { email: 'qa@scr.com', name: 'QA User' },
    { email: 'admin2@scr.com', name: 'Admin User 2' },
  ];

  for (const userData of users) {
    try {
      await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          passwordHash: await bcrypt.hash('password123', 10),
        },
      });
    } catch (e) {
      // User might already exist
    }
  }
  console.log('✓ Users ready\n');

  // 2. Get admin user
  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@scr.com' },
  });

  if (!adminUser) {
    throw new Error('Admin user not found');
  }

  // 3. Create projects
  console.log('📁 Creating 5 projects...');
  const projects = [];
  const timestamp = Date.now();
  for (let i = 1; i <= 5; i++) {
    const project = await prisma.project.create({
      data: {
        name: `Project ${i}`,
        description: `Security analysis project ${i}`,
        repositoryUrl: `https://github.com/example/project-${i}-${timestamp}`,
        userId: adminUser.id,
      },
    });
    projects.push(project);
  }
  console.log(`✓ ${projects.length} projects created\n`);

  // 4. Create analyses and findings
  console.log('🔍 Creating analyses and findings...');
  const severities: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const riskTypes = [
    'BACKDOOR',
    'INJECTION',
    'LOGIC_BOMB',
    'OBFUSCATION',
    'SUSPICIOUS',
    'ERROR_HANDLING',
    'HARDCODED_VALUES',
  ];

  let totalFindings = 0;
  const severityCount = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
  };

  for (const project of projects) {
    // Create 2 analyses per project
    for (let a = 0; a < 2; a++) {
      const analysis = await prisma.analysis.create({
        data: {
          projectId: project.id,
          status: 'COMPLETED',
          progress: 100,
          startedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Last 30 days
          completedAt: new Date(),
        },
      });

      // Create 5 findings per analysis (50 total)
      for (let f = 0; f < 5; f++) {
        // Distribution: 48% CRITICAL, 30% HIGH, 16% MEDIUM, 6% LOW
        let severity: Severity;
        const rand = Math.random();
        if (rand < 0.48) severity = 'CRITICAL';
        else if (rand < 0.78) severity = 'HIGH';
        else if (rand < 0.94) severity = 'MEDIUM';
        else severity = 'LOW';

        severityCount[severity]++;
        totalFindings++;

        const finding = await prisma.finding.create({
          data: {
            analysisId: analysis.id,
            file: `src/modules/module-${f}.ts`,
            function: `function${f}`,
            lineRange: `${10 + f * 5}-${15 + f * 5}`,
            severity,
            riskType: riskTypes[Math.floor(Math.random() * riskTypes.length)],
            confidence: Math.random() * 0.5 + 0.5, // 0.5-1.0
            whySuspicious: `Potential security issue detected in function. Risk type: ${severity}`,
          },
        });

        // Add some status changes
        if (Math.random() > 0.6) {
          try {
            await prisma.findingStatusChange.create({
              data: {
                findingId: finding.id,
                status: Math.random() > 0.5 ? 'IN_CORRECTION' : 'CORRECTED',
                changedBy: adminUser.id,
                note: 'Status updated during analysis',
              },
            });
          } catch (e) {
            // Skip if status change fails
          }
        }

        // Add assignments for some findings (30% chance)
        if (Math.random() > 0.7) {
          const allUsers = await prisma.user.findMany({
            take: 1,
            skip: Math.floor(Math.random() * 3),
          });
          if (allUsers.length > 0) {
            try {
              await prisma.findingAssignment.create({
                data: {
                  findingId: finding.id,
                  assignedTo: allUsers[0].id,
                },
              });
            } catch (e) {
              // Skip if assignment already exists
            }
          }
        }

        // Add remediations for some findings (40% chance)
        if (Math.random() > 0.6) {
          try {
            const remStatus = Math.random() > 0.5 ? 'IN_PROGRESS' : 'VERIFIED';
            await prisma.remediationEntry.create({
              data: {
                findingId: finding.id,
                status: remStatus,
                notes: `Fix applied for ${severity} severity finding`,
                startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
                verifiedAt: remStatus === 'VERIFIED' ? new Date() : null,
              },
            });
          } catch (e) {
            // Skip if remediation creation fails
          }
        }
      }
    }
  }

  console.log(`✓ ${totalFindings} findings created`);
  console.log(`  - CRITICAL: ${severityCount.CRITICAL} (${((severityCount.CRITICAL / totalFindings) * 100).toFixed(0)}%)`);
  console.log(`  - HIGH: ${severityCount.HIGH} (${((severityCount.HIGH / totalFindings) * 100).toFixed(0)}%)`);
  console.log(`  - MEDIUM: ${severityCount.MEDIUM} (${((severityCount.MEDIUM / totalFindings) * 100).toFixed(0)}%)`);
  console.log(`  - LOW: ${severityCount.LOW} (${((severityCount.LOW / totalFindings) * 100).toFixed(0)}%)\n`);

  // 5. Skip forensic events for now
  console.log('📊 Skipping forensic events (optional)\n');

  // Get final counts
  const finalAnalysesCount = await prisma.analysis.count();

  console.log('='.repeat(60));
  console.log('✅ DATABASE READY WITH TEST DATA');
  console.log('='.repeat(60));
  console.log(`
Total Data Created:
  - Projects: ${projects.length}
  - Analyses: ${finalAnalysesCount}
  - Findings: ${totalFindings}

Test Credentials:
  - Email: admin@scr.com
  - Password: admin123

All data is visible to all authenticated users!
`);
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
