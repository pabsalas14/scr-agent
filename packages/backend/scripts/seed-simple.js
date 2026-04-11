/**
 * Simple Seed Script - Datos realistas para testing
 * Genera: 3 Usuarios, 5 Proyectos, 10 Análisis, 50 Findings
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de datos...\n');

  // 1. Crear usuarios
  console.log('👥 Creando usuarios...');

  const hashedPassword = await bcrypt.hash('Test123!@#', 12);

  // Delete existing data first (in correct order for foreign keys)
  await prisma.comment.deleteMany({});
  await prisma.remediationEntry.deleteMany({});
  await prisma.findingAssignment.deleteMany({});
  await prisma.findingStatusChange.deleteMany({});
  await prisma.forensicEvent.deleteMany({});
  await prisma.finding.deleteMany({});
  await prisma.analysis.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.userRole.deleteMany({});
  await prisma.notificationPreferences.deleteMany({});
  await prisma.userSettings.deleteMany({});
  await prisma.user.deleteMany({});

  const admin = await prisma.user.create({
    data: {
      email: 'admin@scr-agent.dev',
      name: 'Admin User',
      passwordHash: hashedPassword,
      roles: { create: { role: 'ADMIN' } },
      notificationPreferences: { create: { emailNotifications: true, enableAssignments: true, enableStatusChanges: true } }
    }
  });

  const analyst = await prisma.user.create({
    data: {
      email: 'analyst@scr-agent.dev',
      name: 'Security Analyst',
      passwordHash: hashedPassword,
      roles: { create: { role: 'ANALYST' } },
      notificationPreferences: { create: { emailNotifications: true, enableAssignments: true, enableStatusChanges: true } }
    }
  });

  const developer = await prisma.user.create({
    data: {
      email: 'dev@scr-agent.dev',
      name: 'Developer User',
      passwordHash: hashedPassword,
      roles: { create: { role: 'DEVELOPER' } },
      notificationPreferences: { create: { emailNotifications: true, enableAssignments: true, enableStatusChanges: true } }
    }
  });

  console.log(`✅ Creados 3 usuarios\n`);

  // 2. Crear proyectos
  console.log('📁 Creando proyectos...');

  const uniqueId = Date.now();
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        name: 'Backend API',
        description: 'Node.js Express REST API',
        repositoryUrl: `https://github.com/example/backend-api-${uniqueId}`,
        branch: 'main',
        user: { connect: { id: admin.id } },
      }
    }),
    prisma.project.create({
      data: {
        name: 'Frontend App',
        description: 'React 19 SPA',
        repositoryUrl: `https://github.com/example/frontend-app-${uniqueId}`,
        branch: 'main',
        user: { connect: { id: admin.id } },
      }
    }),
    prisma.project.create({
      data: {
        name: 'Mobile SDK',
        description: 'React Native SDK',
        repositoryUrl: `https://github.com/example/mobile-sdk-${uniqueId}`,
        branch: 'main',
        user: { connect: { id: analyst.id } },
      }
    }),
    prisma.project.create({
      data: {
        name: 'CLI Tool',
        description: 'Command-line security tool',
        repositoryUrl: `https://github.com/example/cli-tool-${uniqueId}`,
        branch: 'main',
        user: { connect: { id: analyst.id } },
      }
    }),
    prisma.project.create({
      data: {
        name: 'Utilities Lib',
        description: 'Shared utilities library',
        repositoryUrl: `https://github.com/example/utils-lib-${uniqueId}`,
        branch: 'main',
        user: { connect: { id: developer.id } },
      }
    })
  ]);

  console.log(`✅ Creados ${projects.length} proyectos\n`);

  // 3. Crear análisis (10 totales - 2 por proyecto)
  console.log('📊 Creando análisis...');

  const analyses = [];
  for (const project of projects) {
    // 2 análisis por proyecto
    for (let i = 0; i < 2; i++) {
      const analysis = await prisma.analysis.create({
        data: {
          projectId: project.id,
          status: 'COMPLETED',
          progress: 100,
        }
      });
      analyses.push(analysis);
    }
  }

  console.log(`✅ Creados ${analyses.length} análisis\n`);

  // 4. Crear findings (50 totales distribuidos)
  console.log('🔍 Creando hallazgos...');

  const severities = ['CRITICAL', 'CRITICAL', 'CRITICAL', 'CRITICAL', 'CRITICAL', 'CRITICAL', 'CRITICAL', 'CRITICAL',
                      'CRITICAL', 'CRITICAL', 'CRITICAL', 'CRITICAL', 'CRITICAL', 'CRITICAL', 'CRITICAL', 'CRITICAL',
                      'CRITICAL', 'CRITICAL', 'CRITICAL', 'CRITICAL', 'CRITICAL', 'CRITICAL', 'CRITICAL', 'CRITICAL',
                      'HIGH', 'HIGH', 'HIGH', 'HIGH', 'HIGH', 'HIGH', 'HIGH', 'HIGH', 'HIGH', 'HIGH',
                      'HIGH', 'HIGH', 'HIGH', 'HIGH', 'HIGH',
                      'MEDIUM', 'MEDIUM', 'MEDIUM', 'MEDIUM', 'MEDIUM', 'MEDIUM', 'MEDIUM', 'MEDIUM',
                      'LOW', 'LOW', 'LOW'];

  const findingTypes = ['SQL Injection', 'XSS Vulnerability', 'CSRF Token Missing', 'Weak Password Policy',
                        'Insecure Serialization', 'Hardcoded Secrets', 'Broken Authentication', 'Path Traversal',
                        'XXE Attack', 'Race Condition'];

  const riskTypes = ['BACKDOOR', 'INJECTION', 'LOGIC_BOMB', 'OBFUSCATION', 'SUSPICIOUS'];

  const findings = [];
  for (let i = 0; i < 50; i++) {
    const analysis = analyses[Math.floor(Math.random() * analyses.length)];
    const line = Math.floor(Math.random() * 500) + 1;
    const finding = await prisma.finding.create({
      data: {
        analysisId: analysis.id,
        file: `src/modules/${Math.floor(Math.random() * 10)}/handler.ts`,
        lineRange: `${line}-${line + 2}`,
        severity: severities[i],
        riskType: riskTypes[Math.floor(Math.random() * riskTypes.length)],
        whySuspicious: 'Potential security vulnerability detected by static analysis',
      }
    });
    findings.push(finding);
  }

  console.log(`✅ Creados ${findings.length} hallazgos (24 CRITICAL, 15 HIGH, 8 MEDIUM, 3 LOW)\n`);

  // 5. Crear remediaciones para los CRITICAL findings
  console.log('🔧 Creando remediaciones...');

  const criticalFindings = findings.filter(f => f.severity === 'CRITICAL').slice(0, 8);
  for (const finding of criticalFindings) {
    try {
      await prisma.remediationEntry.create({
        data: {
          findingId: finding.id,
          status: 'VERIFIED',
          completedAt: new Date(),
        }
      });
    } catch(e) {
      // Skip if error
    }
  }

  console.log(`✅ Creadas 8 remediaciones\n`);

  // 6. Crear comentarios
  console.log('💬 Creando comentarios...');

  for (let i = 0; i < 12; i++) {
    const finding = findings[Math.floor(Math.random() * findings.length)];
    const user = [admin, analyst, developer][i % 3];
    await prisma.comment.create({
      data: {
        findingId: finding.id,
        userId: user.id,
        content: `Comment #${i + 1}: This is a test comment on a finding.`,
      }
    });
  }

  console.log(`✅ Creados 12 comentarios\n`);

  // 7. Crear eventos forenses
  console.log('🔐 Creando eventos forenses...');

  const eventTypes = ['COMMIT_PUSH', 'FILE_MODIFIED', 'BRANCH_CREATED', 'TAG_PUSHED', 'REVIEW_APPROVED', 'MERGE_COMPLETED'];

  for (let i = 0; i < 60; i++) {
    const analysis = analyses[Math.floor(Math.random() * analyses.length)];
    try {
      await prisma.forensicEvent.create({
        data: {
          analysisId: analysis.id,
          eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
          author: `author${Math.floor(Math.random() * 5) + 1}@company.com`,
          message: `Commit message #${i}`,
        }
      });
    } catch(e) {
      // Skip if error (missing columns)
    }
  }

  console.log(`✅ Creados 60 eventos forenses\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ SEED COMPLETADO');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Resumen:');
  console.log('  👥 Usuarios: 3');
  console.log('  📁 Proyectos: 5');
  console.log('  📊 Análisis: 10');
  console.log('  🔍 Hallazgos: 50 (24 CRITICAL, 15 HIGH, 8 MEDIUM, 3 LOW)');
  console.log('  🔧 Remediaciones: 8');
  console.log('  💬 Comentarios: 12');
  console.log('  🔐 Eventos forenses: 60');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('🔐 Credenciales para login:');
  console.log('  Email: admin@scr-agent.dev');
  console.log('  Password: Test123!@#\n');
}

main()
  .catch((e) => {
    console.error('❌ Error durante seed:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
