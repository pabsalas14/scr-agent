import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper para generar timestamps realistas
const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3600000);
const daysAgo = (days: number) => new Date(Date.now() - days * 86400000);

// Helper para severidad aleatoria
const randomSeverity = () => {
  const rand = Math.random();
  if (rand < 0.48) return 'CRITICAL';
  if (rand < 0.78) return 'HIGH';
  if (rand < 0.93) return 'MEDIUM';
  if (rand < 0.98) return 'LOW';
  return 'INFO';
};

// Helper para status aleatorio
const randomStatus = () => {
  const statuses = ['DETECTED', 'IN_REVIEW', 'IN_CORRECTION', 'VERIFIED', 'CLOSED'];
  return statuses[Math.floor(Math.random() * statuses.length)];
};

async function main() {
  console.log('🌱 Iniciando seed de datos realistas...');

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
        roles: {
          create: { role: 'ADMIN' }
        }
      },
    }),
    prisma.user.upsert({
      where: { email: 'analyst@scr.com' },
      update: {},
      create: {
        email: 'analyst@scr.com',
        name: 'Ana Lyst',
        passwordHash: await bcrypt.hash('analyst123', 10),
        roles: {
          create: { role: 'ANALYST' }
        }
      },
    }),
    prisma.user.upsert({
      where: { email: 'developer@scr.com' },
      update: {},
      create: {
        email: 'developer@scr.com',
        name: 'Dev Eloper',
        passwordHash: await bcrypt.hash('dev123', 10),
        roles: {
          create: { role: 'DEVELOPER' }
        }
      },
    }),
    prisma.user.upsert({
      where: { email: 'viewer@scr.com' },
      update: {},
      create: {
        email: 'viewer@scr.com',
        name: 'View Only',
        passwordHash: await bcrypt.hash('viewer123', 10),
        roles: {
          create: { role: 'VIEWER' }
        }
      },
    }),
    prisma.user.upsert({
      where: { email: 'reviewer@scr.com' },
      update: {},
      create: {
        email: 'reviewer@scr.com',
        name: 'Rev Iewer',
        passwordHash: await bcrypt.hash('reviewer123', 10),
        roles: {
          create: { role: 'VIEWER' }
        }
      },
    }),
  ]);
  console.log(`✓ ${users.length} usuarios creados`);

  // 2. CREAR PROYECTOS
  console.log('\n📁 Creando proyectos...');
  const projects = await Promise.all([
    prisma.project.upsert({
      where: { id: 'proj-1' },
      update: {},
      create: {
        id: 'proj-1',
        name: 'API Backend',
        description: 'API REST crítica de producción',
        repositoryUrl: 'https://github.com/company/api-backend',
        userId: users[0].id,
      },
    }),
    prisma.project.upsert({
      where: { id: 'proj-2' },
      update: {},
      create: {
        id: 'proj-2',
        name: 'Frontend Dashboard',
        description: 'Dashboard React con TypeScript',
        repositoryUrl: 'https://github.com/company/frontend-dashboard',
        userId: users[0].id,
      },
    }),
    prisma.project.upsert({
      where: { id: 'proj-3' },
      update: {},
      create: {
        id: 'proj-3',
        name: 'Mobile App',
        description: 'Aplicación móvil React Native',
        repositoryUrl: 'https://github.com/company/mobile-app',
        userId: users[0].id,
      },
    }),
    prisma.project.upsert({
      where: { id: 'proj-4' },
      update: {},
      create: {
        id: 'proj-4',
        name: 'DevOps Infrastructure',
        description: 'Infraestructura como código Terraform',
        repositoryUrl: 'https://github.com/company/devops-infra',
        userId: users[0].id,
      },
    }),
    prisma.project.upsert({
      where: { id: 'proj-5' },
      update: {},
      create: {
        id: 'proj-5',
        name: 'Security Utils',
        description: 'Librería de utilidades de seguridad',
        repositoryUrl: 'https://github.com/company/security-utils',
        userId: users[0].id,
      },
    }),
  ]);
  console.log(`✓ ${projects.length} proyectos creados`);

  // 3. CREAR ANÁLISIS Y HALLAZGOS
  console.log('\n🔍 Creando análisis y hallazgos...');
  let totalFindings = 0;
  const allFindings: any[] = [];

  for (const project of projects) {
    // 10 análisis por proyecto
    for (let i = 0; i < 10; i++) {
      const startTime = daysAgo(30 - i * 3);
      const endTime = new Date(startTime.getTime() + 3600000); // 1 hora

      const analysis = await prisma.analysis.create({
        data: {
          projectId: project.id,
          status: 'COMPLETED',
          startTime,
          endTime,
          duration: 3600,
        },
      });

      // 5 hallazgos aleatorios por análisis
      const findingCount = Math.floor(Math.random() * 8) + 2; // 2-9 hallazgos
      for (let j = 0; j < findingCount; j++) {
        const severity = randomSeverity();
        const finding = await prisma.finding.create({
          data: {
            analysisId: analysis.id,
            projectId: project.id,
            title: `Security Issue #${++totalFindings}: ${severity} Finding`,
            description: `Potential vulnerability detected in ${project.name}`,
            severity,
            status: randomStatus(),
            cwe: `CWE-${100 + Math.floor(Math.random() * 900)}`,
            cvss: (Math.random() * 9 + 1).toFixed(1),
            file: `src/${Math.random() > 0.5 ? 'api' : 'utils'}/file-${j}.ts`,
            line: Math.floor(Math.random() * 1000) + 1,
            recommendations: 'Review and apply security patches',
          },
        });
        allFindings.push(finding);
      }
    }
  }
  console.log(`✓ ${totalFindings} hallazgos creados`);

  // 4. CREAR INCIDENTES (de los 24 hallazgos CRITICAL)
  console.log('\n🚨 Creando incidentes...');
  const criticalFindings = allFindings.filter(f => f.severity === 'CRITICAL').slice(0, 24);
  const incidents = [];

  for (let i = 0; i < criticalFindings.length; i++) {
    const finding = criticalFindings[i];
    const statuses = ['PENDING', 'IN_REVIEW', 'IN_CORRECTION', 'VERIFIED'];
    
    const incident = await prisma.incident.create({
      data: {
        findingId: finding.id,
        projectId: finding.projectId,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        assignedTo: i % 3 === 0 ? users[1].id : users[2].id,
        priority: 'HIGH',
        description: `Incident for ${finding.title}`,
      },
    });
    incidents.push(incident);
  }
  console.log(`✓ ${incidents.length} incidentes creados`);

  // 5. CREAR REMEDIACIONES
  console.log('\n🔧 Creando remediaciones...');
  for (let i = 0; i < incidents.length; i++) {
    const incident = incidents[i];
    const stages = ['IDENTIFIED', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED'];
    
    await prisma.remediation.create({
      data: {
        findingId: incident.findingId,
        projectId: incident.projectId,
        status: stages[Math.floor(Math.random() * stages.length)],
        description: 'Security patch applied',
        assignedTo: users[2].id,
        deadline: new Date(Date.now() + 7 * 86400000),
      },
    });
  }
  console.log(`✓ ${incidents.length} remediaciones creadas`);

  // 6. CREAR COMENTARIOS
  console.log('\n💬 Creando comentarios...');
  let commentCount = 0;
  for (let i = 0; i < Math.min(20, allFindings.length); i++) {
    const finding = allFindings[i];
    const commentCount_local = Math.floor(Math.random() * 3) + 1;
    
    for (let j = 0; j < commentCount_local; j++) {
      await prisma.comment.create({
        data: {
          findingId: finding.id,
          userId: users[Math.floor(Math.random() * users.length)].id,
          content: `Comment about vulnerability: ${['Critical issue', 'Needs review', 'In progress', 'Completed'][j % 4]}`,
          mentions: [users[1].id],
        },
      });
      commentCount++;
    }
  }
  console.log(`✓ ${commentCount} comentarios creados`);

  // RESUMEN
  console.log('\n' + '='.repeat(50));
  console.log('✅ SEED REALISTA COMPLETADO');
  console.log('='.repeat(50));
  console.log(`
📊 DATOS CREADOS:
  • Usuarios: ${users.length}
  • Proyectos: ${projects.length}
  • Hallazgos Totales: ${totalFindings}
    - CRITICAL: ${allFindings.filter(f => f.severity === 'CRITICAL').length}
    - HIGH: ${allFindings.filter(f => f.severity === 'HIGH').length}
    - MEDIUM: ${allFindings.filter(f => f.severity === 'MEDIUM').length}
    - LOW: ${allFindings.filter(f => f.severity === 'LOW').length}
  • Incidentes: ${incidents.length}
  • Remediaciones: ${incidents.length}
  • Comentarios: ${commentCount}

🔐 CREDENCIALES DE PRUEBA:
  Admin: admin@scr.com / admin123
  Analyst: analyst@scr.com / analyst123
  Developer: developer@scr.com / dev123
  Viewer: viewer@scr.com / viewer123
  Reviewer: reviewer@scr.com / reviewer123
  `);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('✓ Seed completado exitosamente');
  })
  .catch(async (e) => {
    console.error('❌ Error en seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
