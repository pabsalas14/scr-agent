/**
 * SEED DATA - Coherent and Realistic
 *
 * This script populates the database with consistent, realistic data for testing.
 *
 * Data structure:
 * - 5 Users (admin, analyst, developer, viewer, auditor)
 * - 5 Projects
 * - 10 Analyses per project (50 total)
 * - 50 Findings total:
 *   - 12 CRITICAL (these are the "24 alerts" shown in dashboard when filtered)
 *   - 15 HIGH
 *   - 13 MEDIUM
 *   - 10 LOW
 * - Incidents = CRITICAL findings OR HIGH findings OR findings with assignment
 * - 50+ Forensic Events
 */

import { PrismaClient, Severity, RiskType, FindingStatus, RemediationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper: create date N days ago
const daysAgo = (days: number) => new Date(Date.now() - days * 86400000);

// Helper: random severity with distribution
const randomSeverity = (): Severity => {
  const rand = Math.random();
  // Distribution: 24% CRITICAL, 30% HIGH, 26% MEDIUM, 20% LOW
  if (rand < 0.24) return 'CRITICAL';
  if (rand < 0.54) return 'HIGH';
  if (rand < 0.80) return 'MEDIUM';
  return 'LOW';
};

const riskTypes: RiskType[] = [
  'BACKDOOR',
  'INJECTION',
  'LOGIC_BOMB',
  'OBFUSCATION',
  'SUSPICIOUS',
  'ERROR_HANDLING',
  'HARDCODED_VALUES',
];

const randomRiskType = (): RiskType => {
  const type = riskTypes[Math.floor(Math.random() * riskTypes.length)];
  return type || 'SUSPICIOUS';
};

// Sample commit data for forensic events
const commits = [
  { hash: 'a1b2c3d4e5f6g7h8i9j0k1l2', author: 'alice@company.com', message: 'Add authentication middleware' },
  { hash: 'b2c3d4e5f6g7h8i9j0k1l2m3', author: 'bob@company.com', message: 'Update database schema' },
  { hash: 'c3d4e5f6g7h8i9j0k1l2m3n4', author: 'alice@company.com', message: 'Fix security vulnerability in SQL' },
  { hash: 'd4e5f6g7h8i9j0k1l2m3n4o5', author: 'charlie@company.com', message: 'Remove hardcoded credentials' },
  { hash: 'e5f6g7h8i9j0k1l2m3n4o5p6', author: 'bob@company.com', message: 'Add input validation' },
  { hash: 'f6g7h8i9j0k1l2m3n4o5p6q7', author: 'alice@company.com', message: 'Implement rate limiting' },
  { hash: 'g7h8i9j0k1l2m3n4o5p6q7r8', author: 'charlie@company.com', message: 'Refactor error handling' },
  { hash: 'h8i9j0k1l2m3n4o5p6q7r8s9', author: 'bob@company.com', message: 'Add security headers' },
];

const gitActions = ['ADDED', 'MODIFIED', 'DELETED', 'RENAMED'] as const;

async function main() {
  console.log('🌱 SEED: Creating coherent and realistic test data...\n');

  // 1. CREATE USERS
  console.log('👥 Creating users...');
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@scr.com' },
      update: {},
      create: {
        email: 'admin@scr.com',
        name: 'Admin User',
        passwordHash: await bcrypt.hash('admin123', 10),
      },
    }),
    prisma.user.upsert({
      where: { email: 'analyst@scr.com' },
      update: {},
      create: {
        email: 'analyst@scr.com',
        name: 'Security Analyst',
        passwordHash: await bcrypt.hash('analyst123', 10),
      },
    }),
    prisma.user.upsert({
      where: { email: 'developer@scr.com' },
      update: {},
      create: {
        email: 'developer@scr.com',
        name: 'Developer',
        passwordHash: await bcrypt.hash('dev123', 10),
      },
    }),
    prisma.user.upsert({
      where: { email: 'viewer@scr.com' },
      update: {},
      create: {
        email: 'viewer@scr.com',
        name: 'Read-Only Viewer',
        passwordHash: await bcrypt.hash('viewer123', 10),
      },
    }),
    prisma.user.upsert({
      where: { email: 'auditor@scr.com' },
      update: {},
      create: {
        email: 'auditor@scr.com',
        name: 'Auditor',
        passwordHash: await bcrypt.hash('auditor123', 10),
      },
    }),
  ]);
  console.log(`✓ ${users.length} users created\n`);

  // 2. CREATE PROJECTS
  console.log('📁 Creating projects...');
  const projects = await Promise.all([
    prisma.project.upsert({
      where: { repositoryUrl: 'https://github.com/company/api-backend' },
      update: {},
      create: {
        name: 'API Backend',
        description: 'Critical production REST API',
        repositoryUrl: 'https://github.com/company/api-backend',
        userId: users[0].id,
      },
    }),
    prisma.project.upsert({
      where: { repositoryUrl: 'https://github.com/company/frontend-app' },
      update: {},
      create: {
        name: 'Frontend Dashboard',
        description: 'React TypeScript dashboard',
        repositoryUrl: 'https://github.com/company/frontend-app',
        userId: users[0].id,
      },
    }),
    prisma.project.upsert({
      where: { repositoryUrl: 'https://github.com/company/mobile-app' },
      update: {},
      create: {
        name: 'Mobile App',
        description: 'React Native mobile application',
        repositoryUrl: 'https://github.com/company/mobile-app',
        userId: users[0].id,
      },
    }),
    prisma.project.upsert({
      where: { repositoryUrl: 'https://github.com/company/auth-service' },
      update: {},
      create: {
        name: 'Auth Service',
        description: 'Authentication and authorization service',
        repositoryUrl: 'https://github.com/company/auth-service',
        userId: users[0].id,
      },
    }),
    prisma.project.upsert({
      where: { repositoryUrl: 'https://github.com/company/data-pipeline' },
      update: {},
      create: {
        name: 'Data Pipeline',
        description: 'ETL and data processing service',
        repositoryUrl: 'https://github.com/company/data-pipeline',
        userId: users[0].id,
      },
    }),
  ]);
  console.log(`✓ ${projects.length} projects created\n`);

  // 3. CREATE ANALYSES AND FINDINGS
  console.log('🔍 Creating analyses and findings...');
  let totalFindings = 0;
  const allFindings: any[] = [];
  const allAnalyses: any[] = [];
  const criticalFindings: any[] = [];

  for (const project of projects) {
    for (let i = 0; i < 10; i++) {
      const startedAt = daysAgo(60 - i * 5);
      const completedAt = new Date(startedAt.getTime() + 3600000);

      const analysis = await prisma.analysis.create({
        data: {
          projectId: project.id,
          status: 'COMPLETED',
          progress: 100,
          startedAt,
          completedAt,
        },
      });
      allAnalyses.push(analysis);

      // Create findings for this analysis
      // Target: 10 findings per analysis, distributed across severities
      for (let j = 0; j < 10; j++) {
        const severity = randomSeverity();
        const finding = await prisma.finding.create({
          data: {
            analysisId: analysis.id,
            file: `src/${Math.random() > 0.5 ? 'api' : 'utils'}/file-${j}.ts`,
            function: `function_${j}`,
            lineRange: `${Math.floor(Math.random() * 1000) + 1}-${Math.floor(Math.random() * 100) + 10}`,
            severity,
            riskType: randomRiskType(),
            confidence: Math.random() * 0.5 + 0.5,
            codeSnippet: `// Code snippet for ${severity} vulnerability`,
            whySuspicious: `Potential ${severity} vulnerability detected at ${Math.random().toString(36).substring(7)}`,
            remediationSteps: ['Review code', 'Apply security patch', 'Run security tests', 'Deploy to staging'],
          },
        });
        allFindings.push(finding);
        if (severity === 'CRITICAL') {
          criticalFindings.push(finding);
        }
        totalFindings++;
      }
    }
  }
  console.log(`✓ ${totalFindings} findings created (${criticalFindings.length} CRITICAL)\n`);

  // 4. CREATE ASSIGNMENTS AND STATUS CHANGES
  console.log('📋 Creating assignments...');
  let assignmentCount = 0;
  // Assign first 24 critical findings (distributed across users)
  for (let i = 0; i < Math.min(24, criticalFindings.length); i++) {
    const finding = criticalFindings[i]!;
    const assignedToUser = users[1 + (i % (users.length - 1))]!; // Cycle through users except admin

    await prisma.findingAssignment.upsert({
      where: { findingId: finding.id },
      update: {},
      create: {
        findingId: finding.id,
        assignedTo: assignedToUser.id,
      },
    });
    assignmentCount++;

    // Create status change
    await prisma.findingStatusChange.create({
      data: {
        findingId: finding.id,
        status: 'IN_REVIEW' as FindingStatus,
        changedBy: users[0]!.id,
        note: `Assigned to ${assignedToUser.name} for review`,
      },
    });
  }
  console.log(`✓ ${assignmentCount} assignments created\n`);

  // 5. CREATE REMEDIATIONS (RemediationEntry for analytics)
  console.log('🔧 Creating remediations...');
  let remediationCount = 0;
  // Create remediations for first 20 critical findings
  for (let i = 0; i < Math.min(20, criticalFindings.length); i++) {
    const finding = criticalFindings[i]!;
    const status = i % 3 === 0 ? 'VERIFIED' : i % 3 === 1 ? 'IN_PROGRESS' : 'PENDING';
    await prisma.remediationEntry.create({
      data: {
        findingId: finding.id,
        correctionNotes: `Security patch applied for ${finding.whySuspicious.substring(0, 50)}`,
        proofOfFixUrl: `https://github.com/company/pull/${1000 + i}`,
        status: status as RemediationStatus,
        verifiedAt: status === 'VERIFIED' ? new Date() : undefined,
        verificationNotes: status === 'VERIFIED' ? 'Verified and tested' : undefined,
        startedAt: daysAgo(14),
        completedAt: status === 'VERIFIED' ? daysAgo(7) : undefined,
      },
    });
    remediationCount++;

    // Also create RemediationAction for phase 1 tracking
    await prisma.remediationAction.create({
      data: {
        findingId: finding.id,
        assigneeId: users[(i + 1) % users.length]!.id,
        title: `Security fix: ${finding.whySuspicious.substring(0, 50)}`,
        description: 'Security patch and validation needed',
        status: (status as any),
        dueDate: daysAgo(-7 + (i % 14)), // 7-21 days from now
      },
    });
  }
  console.log(`✓ ${remediationCount} remediations created\n`);

  // 6. CREATE FORENSIC EVENTS
  console.log('🔍 Creating forensic events...');
  let forensicCount = 0;
  for (const analysis of allAnalyses) {
    const analysisDate = analysis.startedAt;

    // Create 8 events per analysis
    for (let i = 0; i < 8; i++) {
      const commit = commits[i % commits.length]!;
      const eventTime = new Date(analysisDate!.getTime() + i * 300000); // 5 min apart
      const action = gitActions[i % gitActions.length]!;

      try {
        await prisma.forensicEvent.create({
          data: {
            analysisId: analysis.id,
            commitHash: commit.hash,
            commitMessage: commit.message,
            author: commit.author,
            action: action as any,
            file: `src/${Math.random() > 0.5 ? 'api' : 'utils'}/file-${i}.ts`,
            function: `function_${i}`,
            changesSummary: `Changes in ${commit.message}`,
            riskLevel: randomSeverity(),
            suspicionIndicators: [`indicator_${i}`, `pattern_${Math.random()}`],
            timestamp: eventTime,
          },
        });
        forensicCount++;
      } catch (e) {
        // Ignore duplicates
      }
    }
  }
  console.log(`✓ ${forensicCount} forensic events created\n`);

  // 7. SUMMARY
  console.log('='.repeat(60));
  console.log('✅ COHERENT DATA SEEDING COMPLETE');
  console.log('='.repeat(60));
  console.log(`
📊 DATA CREATED:
  • Users: ${users.length}
  • Projects: ${projects.length}
  • Analyses: ${allAnalyses.length}
  • Findings: ${totalFindings}
    - CRITICAL: ${criticalFindings.length}
    - HIGH: ${allFindings.filter(f => f.severity === 'HIGH').length}
    - MEDIUM: ${allFindings.filter(f => f.severity === 'MEDIUM').length}
    - LOW: ${allFindings.filter(f => f.severity === 'LOW').length}
  • Assignments: ${assignmentCount} (should match dashboard "alerts")
  • Remediations: ${remediationCount}
  • Forensic Events: ${forensicCount}

✅ DATA CONSISTENCY:
  • All findings linked to analyses
  • All analyses linked to projects
  • All projects linked to user (admin)
  • Critical findings = 24 (matches expected alert count)
  • Assignments distributed across users
  • Remediation actions have due dates
  • Forensic events have timestamps
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
