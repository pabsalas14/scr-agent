/**
 * ============================================================================
 * SEED SCRIPT - Populate database with realistic test data
 * ============================================================================
 */

import { prisma } from '../src/services/prisma.service';
import bcrypt from 'bcryptjs';
import { Severity, RiskType, GitAction } from '@prisma/client';

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seed...');

    // ===== CREATE USERS =====
    console.log('📝 Creating users...');

    const hashedPassword = await bcrypt.hash('password123', 10);

    const users = await Promise.all([
      prisma.user.upsert({
        where: { email: 'admin@scr.local' },
        update: {},
        create: {
          email: 'admin@scr.local',
          name: 'Admin User',
          passwordHash: hashedPassword,
        },
      }),
      prisma.user.upsert({
        where: { email: 'analyst@scr.local' },
        update: {},
        create: {
          email: 'analyst@scr.local',
          name: 'Security Analyst',
          passwordHash: hashedPassword,
        },
      }),
      prisma.user.upsert({
        where: { email: 'developer@scr.local' },
        update: {},
        create: {
          email: 'developer@scr.local',
          name: 'Developer User',
          passwordHash: hashedPassword,
        },
      }),
    ]);

    console.log(`✅ Created ${users.length} users`);

    // ===== CREATE PROJECTS =====
    console.log('📝 Creating projects...');

    const projects = await Promise.all([
      prisma.project.upsert({
        where: { repositoryUrl: 'https://github.com/acme/backend' },
        update: {},
        create: {
          name: 'ACME Backend',
          description: 'Main backend API service',
          repositoryUrl: 'https://github.com/acme/backend',
          userId: users[0].id,
        },
      }),
      prisma.project.upsert({
        where: { repositoryUrl: 'https://github.com/acme/frontend' },
        update: {},
        create: {
          name: 'ACME Frontend',
          description: 'React frontend application',
          repositoryUrl: 'https://github.com/acme/frontend',
          userId: users[0].id,
        },
      }),
      prisma.project.upsert({
        where: { repositoryUrl: 'https://github.com/acme/auth-service' },
        update: {},
        create: {
          name: 'Auth Service',
          description: 'OAuth2 authentication service',
          repositoryUrl: 'https://github.com/acme/auth-service',
          userId: users[1].id,
        },
      }),
    ]);

    console.log(`✅ Created ${projects.length} projects`);

    // ===== CREATE ANALYSES =====
    console.log('📝 Creating analyses...');

    const analyses = [];
    for (let i = 0; i < 3; i++) {
      for (const project of projects) {
        const daysAgo = Math.floor(Math.random() * 30) + 1;
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - daysAgo);

        analyses.push(
          await prisma.analysis.create({
            data: {
              projectId: project.id,
              status: 'COMPLETED',
              progress: 100,
              createdAt,
              completedAt: new Date(createdAt.getTime() + Math.random() * 3600000),
            },
          })
        );
      }
    }

    console.log(`✅ Created ${analyses.length} analyses`);

    // ===== CREATE FINDINGS =====
    console.log('📝 Creating findings...');

    const severityValues: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    const riskTypeValues: RiskType[] = ['INJECTION', 'BACKDOOR', 'OBFUSCATION', 'LOGIC_BOMB', 'SUSPICIOUS'];
    const findings = [];

    for (const analysis of analyses) {
      const count = Math.floor(Math.random() * 20) + 5;
      for (let i = 0; i < count; i++) {
        const severity = severityValues[Math.floor(Math.random() * severityValues.length)];
        const riskType = riskTypeValues[Math.floor(Math.random() * riskTypeValues.length)];

        findings.push(
          await prisma.finding.create({
            data: {
              analysisId: analysis.id,
              file: `/src/components/Component${i}.tsx`,
              lineRange: `${Math.floor(Math.random() * 500) + 1}-${Math.floor(Math.random() * 500) + 510}`,
              severity,
              riskType,
              confidence: Math.random() * 0.5 + 0.5,
              codeSnippet: 'const vulnerable = someFunction();',
              whySuspicious: 'This code pattern is vulnerable to security attacks.',
              remediationSteps: ['Use parameterized queries', 'Validate user input'],
            },
          })
        );
      }
    }

    console.log(`✅ Created ${findings.length} findings`);

    // ===== CREATE FINDINGS ASSIGNMENTS =====
    console.log('📝 Creating finding assignments...');

    const assignments = [];
    for (let i = 0; i < Math.min(Math.floor(findings.length / 2), 10); i++) {
      assignments.push(
        await prisma.findingAssignment.create({
          data: {
            findingId: findings[i].id,
            assignedTo: users[i % users.length].id,
          },
        })
      );
    }

    console.log(`✅ Created ${assignments.length} assignments`);

    // ===== CREATE FORENSIC EVENTS =====
    console.log('📝 Creating forensic events...');

    const gitActions: GitAction[] = ['ADDED', 'MODIFIED', 'DELETED'];
    const forensicEvents = [];
    for (const analysis of analyses) {
      for (let i = 0; i < Math.floor(Math.random() * 20) + 5; i++) {
        forensicEvents.push(
          await prisma.forensicEvent.create({
            data: {
              analysisId: analysis.id,
              author: users[Math.floor(Math.random() * users.length)].email,
              commitHash: Math.random().toString(36).substring(2, 40),
              commitMessage: 'Code commit with changes',
              action: gitActions[Math.floor(Math.random() * gitActions.length)],
              file: `/src/file${i}.ts`,
              riskLevel: 'LOW',
              timestamp: new Date(analysis.createdAt!.getTime() + Math.random() * 3600000),
            },
          })
        );
      }
    }

    console.log(`✅ Created ${forensicEvents.length} forensic events`);

    // ===== CREATE COMMENTS =====
    console.log('📝 Creating comments...');

    const comments = [];
    for (let i = 0; i < Math.min(Math.floor(findings.length / 3), 10); i++) {
      const finding = findings[i];
      const user = users[Math.floor(Math.random() * users.length)];

      comments.push(
        await prisma.comment.create({
          data: {
            findingId: finding.id,
            userId: user.id,
            content: `This vulnerability needs immediate attention. Priority: high.`,
          },
        })
      );
    }

    console.log(`✅ Created ${comments.length} comments`);

    // ===== CREATE WEBHOOKS =====
    console.log('📝 Creating webhooks...');

    const webhooks = await Promise.all([
      prisma.webhook.create({
        data: {
          url: 'https://webhook.example.com/findings',
          events: ['finding.created', 'finding.updated'],
          status: 'active',
        },
      }),
      prisma.webhook.create({
        data: {
          url: 'https://webhook.example.com/analysis',
          events: ['analysis.completed'],
          status: 'active',
        },
      }),
    ]);

    console.log(`✅ Created ${webhooks.length} webhooks`);

    console.log('\n✨ Database seed completed successfully!');
    console.log(`
    📊 Summary:
    - Users: ${users.length}
    - Projects: ${projects.length}
    - Analyses: ${analyses.length}
    - Findings: ${findings.length}
    - Assignments: ${assignments.length}
    - Forensic Events: ${forensicEvents.length}
    - Comments: ${comments.length}
    - Webhooks: ${webhooks.length}

    🔐 Login credentials:
    - Email: admin@scr.local
    - Password: password123
    `);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase();
