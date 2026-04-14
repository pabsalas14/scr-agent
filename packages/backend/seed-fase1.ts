import { PrismaClient, Severity, RiskType, FindingStatus, RemediationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const daysAgo = (days: number) => new Date(Date.now() - days * 86400000);

const randomSeverity = (): Severity => {
  const rand = Math.random();
  if (rand < 0.48) return 'CRITICAL';
  if (rand < 0.78) return 'HIGH';
  if (rand < 0.93) return 'MEDIUM';
  return 'LOW';
};

const randomRiskType = (): RiskType => {
  const types: RiskType[] = ['BACKDOOR', 'INJECTION', 'LOGIC_BOMB', 'OBFUSCATION', 'SUSPICIOUS', 'ERROR_HANDLING', 'HARDCODED_VALUES'];
  return types[Math.floor(Math.random() * types.length)];
};

async function main() {
  console.log('🌱 FASE 1: Seeding datos realistas...');

  // 1. CREAR USUARIOS
  console.log('\n👥 Creando usuarios...');
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@scr.com' },
      update: {},
      create: {
        email: 'admin@scr.com',
        name: 'Admin Usuario',
        passwordHash: await bcrypt.hash('admin123', 10),
      },
    }),
    prisma.user.upsert({
      where: { email: 'analyst@scr.com' },
      update: {},
      create: {
        email: 'analyst@scr.com',
        name: 'Ana Lyst',
        passwordHash: await bcrypt.hash('analyst123', 10),
      },
    }),
    prisma.user.upsert({
      where: { email: 'developer@scr.com' },
      update: {},
      create: {
        email: 'developer@scr.com',
        name: 'Dev Eloper',
        passwordHash: await bcrypt.hash('dev123', 10),
      },
    }),
  ]);
  console.log(`✓ ${users.length} usuarios creados`);

  // 2. CREAR PROYECTOS
  console.log('\n📁 Creando proyectos...');
  const projects = await Promise.all([
    prisma.project.upsert({
      where: { repositoryUrl: 'https://github.com/company/api-backend' },
      update: {},
      create: {
        name: 'API Backend',
        description: 'API REST crítica de producción',
        repositoryUrl: 'https://github.com/company/api-backend',
        userId: users[0].id,
      },
    }),
    prisma.project.upsert({
      where: { repositoryUrl: 'https://github.com/company/frontend-app' },
      update: {},
      create: {
        name: 'Frontend Dashboard',
        description: 'Dashboard React con TypeScript',
        repositoryUrl: 'https://github.com/company/frontend-app',
        userId: users[0].id,
      },
    }),
    prisma.project.upsert({
      where: { repositoryUrl: 'https://github.com/company/mobile-app' },
      update: {},
      create: {
        name: 'Mobile App',
        description: 'Aplicación móvil React Native',
        repositoryUrl: 'https://github.com/company/mobile-app',
        userId: users[0].id,
      },
    }),
  ]);
  console.log(`✓ ${projects.length} proyectos creados`);

  // 3. CREAR ANÁLISIS Y HALLAZGOS
  console.log('\n🔍 Creando análisis y hallazgos...');
  let totalFindings = 0;
  const allFindings: any[] = [];
  const allAnalyses: any[] = [];
  const criticalFindings: any[] = [];

  for (const project of projects) {
    for (let i = 0; i < 5; i++) {
      const startedAt = daysAgo(30 - i * 5);
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

      // 5-10 hallazgos por análisis
      const findingCount = Math.floor(Math.random() * 6) + 5;
      for (let j = 0; j < findingCount; j++) {
        const severity = randomSeverity();
        const finding = await prisma.finding.create({
          data: {
            analysisId: analysis.id,
            file: `src/${Math.random() > 0.5 ? 'api' : 'utils'}/file-${j}.ts`,
            lineRange: `${Math.floor(Math.random() * 1000) + 1}-${Math.floor(Math.random() * 100) + 10}`,
            severity,
            riskType: randomRiskType(),
            confidence: Math.random() * 0.5 + 0.5,
            whySuspicious: `Potential ${severity} vulnerability detected`,
            remediationSteps: ['Review code', 'Apply patch', 'Test thoroughly'],
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
  console.log(`✓ ${totalFindings} hallazgos creados (${criticalFindings.length} CRITICAL)`);

  // 4. CREAR ASIGNACIONES Y CAMBIOS DE ESTADO (solo para críticos)
  console.log('\n📋 Creando asignaciones...');
  let assignmentCount = 0;
  for (let i = 0; i < Math.min(24, criticalFindings.length); i++) {
    const finding = criticalFindings[i];
    
    await prisma.findingAssignment.upsert({
      where: { findingId: finding.id },
      update: {},
      create: {
        findingId: finding.id,
        assignedTo: users[i % users.length].id,
      },
    });
    assignmentCount++;

    await prisma.findingStatusChange.create({
      data: {
        findingId: finding.id,
        status: 'IN_REVIEW' as FindingStatus,
        changedBy: users[0].id,
        note: 'Assigned for review',
      },
    });
  }
  console.log(`✓ ${assignmentCount} asignaciones creadas`);

  // 5. CREAR REMEDIACIONES
  console.log('\n🔧 Creando remediaciones...');
  let remediationCount = 0;
  for (let i = 0; i < Math.min(20, criticalFindings.length); i++) {
    const finding = criticalFindings[i];
    await prisma.remediationAction.create({
      data: {
        findingId: finding.id,
        assigneeId: users[(i + 1) % users.length].id,
        title: `Fix for ${finding.whySuspicious}`,
        description: 'Security patch to be applied',
        status: 'IN_PROGRESS' as RemediationStatus,
        dueDate: daysAgo(-7),
      },
    });
    remediationCount++;
  }
  console.log(`✓ ${remediationCount} remediaciones creadas`);

  // 6. CREAR EVENTOS FORENSES
  console.log('\n🔍 Creando eventos forenses...');
  let forensicCount = 0;
  const commits = [
    { hash: 'a1b2c3d4e5f6g7h8i9j0k1l2', author: 'dev1@company.com', message: 'Add authentication middleware' },
    { hash: 'b2c3d4e5f6g7h8i9j0k1l2m3', author: 'dev2@company.com', message: 'Update database schema' },
    { hash: 'c3d4e5f6g7h8i9j0k1l2m3n4', author: 'dev1@company.com', message: 'Fix security vulnerability in SQL' },
    { hash: 'd4e5f6g7h8i9j0k1l2m3n4o5', author: 'dev3@company.com', message: 'Remove hardcoded credentials' },
    { hash: 'e5f6g7h8i9j0k1l2m3n4o5p6', author: 'dev2@company.com', message: 'Add input validation' },
  ];

  for (const analysis of allAnalyses) {
    const analysisDate = analysis.startedAt;

    // 8 eventos por análisis
    for (let i = 0; i < 8; i++) {
      const commit = commits[i % commits.length];
      const eventTime = new Date(analysisDate.getTime() + i * 300000); // 5 min apart

      try {
        await prisma.forensicEvent.create({
          data: {
            analysisId: analysis.id,
            commitHash: commit.hash,
            author: commit.author,
            message: commit.message,
            file: `src/${Math.random() > 0.5 ? 'api' : 'utils'}/file-${i}.ts`,
            lineNumber: Math.floor(Math.random() * 500) + 1,
            timestamp: eventTime,
          },
        });
        forensicCount++;
      } catch (e) {
        // Ignore duplicates
      }
    }
  }
  console.log(`✓ ${forensicCount} eventos forenses creados`);

  console.log('\n' + '='.repeat(60));
  console.log('✅ FASE 1: DATOS REALISTAS CREADOS');
  console.log('='.repeat(60));
  console.log(`
📊 DATOS CREADOS:
  • Usuarios: ${users.length}
  • Proyectos: ${projects.length}
  • Análisis: ${projects.length * 5}
  • Hallazgos Totales: ${totalFindings}
    - CRITICAL: ${criticalFindings.length}
    - HIGH: ${allFindings.filter(f => f.severity === 'HIGH').length}
    - MEDIUM: ${allFindings.filter(f => f.severity === 'MEDIUM').length}
    - LOW: ${allFindings.filter(f => f.severity === 'LOW').length}
  • Asignaciones: ${assignmentCount}
  • Remediaciones: ${remediationCount}

✅ SINCRONIZACIÓN:
  • Dashboard críticos: ${criticalFindings.length} (debería coincidir con 24)
  • Incidentes (críticos asignados): ${assignmentCount}
  • Status cambios registrados: ${assignmentCount}
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
