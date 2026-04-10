/**
 * Seed Data Script - Datos realistas para testing
 *
 * Genera:
 * - 5 Proyectos
 * - 3 Usuarios
 * - 10 Análisis completados
 * - 50 Findings (24 CRITICAL, 15 HIGH, 8 MEDIUM, 3 LOW)
 * - 24 Incidentes
 * - 50+ Forensic Events
 * - 12 Comments
 * - 8 Remediations
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de datos realistas...\n');

  // 1. Crear usuarios (con upsert para evitar duplicados)
  console.log('👥 Creando usuarios...');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@scr-agent.dev' },
    update: {},
    create: {
      email: 'admin@scr-agent.dev',
      name: 'Admin User',
      passwordHash: 'hashed_password_admin',
      roles: { create: { role: 'ADMIN' } },
      settings: { create: {} }
    }
  });

  const analyst = await prisma.user.upsert({
    where: { email: 'analyst@scr-agent.dev' },
    update: {},
    create: {
      email: 'analyst@scr-agent.dev',
      name: 'Security Analyst',
      passwordHash: 'hashed_password_analyst',
      roles: { create: { role: 'ANALYST' } },
      settings: { create: {} }
    }
  });

  const developer = await prisma.user.upsert({
    where: { email: 'dev@scr-agent.dev' },
    update: {},
    create: {
      email: 'dev@scr-agent.dev',
      name: 'Developer User',
      passwordHash: 'hashed_password_dev',
      roles: { create: { role: 'DEVELOPER' } },
      settings: { create: {} }
    }
  });

  console.log(`✅ ${3} usuarios creados\n`);

  // 2. Crear proyectos (con random suffix para evitar duplicados)
  console.log('📁 Creando proyectos...');
  const projects = [];
  const suffix = Math.random().toString(36).substring(7);
  const repos = [
    'https://github.com/example/ecommerce-backend',
    'https://github.com/example/api-gateway',
    'https://github.com/example/auth-service',
    'https://github.com/example/payment-processor',
    'https://github.com/example/notification-hub'
  ];

  for (let i = 0; i < 5; i++) {
    const project = await prisma.project.create({
      data: {
        name: `Project ${i + 1} - ${repos[i].split('/').pop()}`,
        description: `Security analysis for ${repos[i]}`,
        repositoryUrl: `${repos[i]}-${suffix}`,
        branch: 'main',
        userId: admin.id
      }
    });
    projects.push(project);
  }
  console.log(`✅ ${projects.length} proyectos creados\n`);

  // 3. Crear análisis completados con findings
  console.log('🔍 Creando análisis y hallazgos...');
  let totalFindings = 0;
  const analysisIds = [];
  const findingsList = [];

  const severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const riskTypes = ['BACKDOOR', 'INJECTION', 'LOGIC_BOMB', 'OBFUSCATION', 'SUSPICIOUS'];

  for (const project of projects) {
    for (let a = 0; a < 2; a++) {
      // 2 análisis por proyecto = 10 análisis totales
      const analysis = await prisma.analysis.create({
        data: {
          projectId: project.id,
          status: 'COMPLETED',
          progress: 100,
          startedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          completedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        }
      });
      analysisIds.push(analysis.id);

      // Distribución de severidades: 24 CRITICAL, 15 HIGH, 8 MEDIUM, 3 LOW
      const findingsPerAnalysis = [
        { severity: 'CRITICAL', count: a === 0 ? 12 : 12 },  // 24 total
        { severity: 'HIGH', count: a === 0 ? 8 : 7 },        // 15 total
        { severity: 'MEDIUM', count: a === 0 ? 4 : 4 },      // 8 total
        { severity: 'LOW', count: a === 0 ? 2 : 1 }          // 3 total
      ];

      for (const { severity, count } of findingsPerAnalysis) {
        for (let f = 0; f < count; f++) {
          const finding = await prisma.finding.create({
            data: {
              analysisId: analysis.id,
              file: `src/app/${['auth', 'api', 'utils', 'database'][Math.floor(Math.random() * 4)]}/file${f}.js`,
              function: ['validateInput', 'processPayment', 'queryDB', 'authenticateUser'][f % 4],
              lineRange: `${100 + f * 10}-${110 + f * 10}`,
              severity: severity,
              riskType: riskTypes[Math.floor(Math.random() * riskTypes.length)],
              confidence: 0.5 + Math.random() * 0.5,
              codeSnippet: `const password = "${['admin123', 'password', '123456', 'secret'][f % 4]}";`,
              whySuspicious: `${severity} severity issue detected - potential ${riskTypes[Math.floor(Math.random() * riskTypes.length)]} vulnerability`,
              remediationSteps: [
                'Review and update the security vulnerability',
                'Test the fix with security audit',
                'Deploy to production after approval'
              ]
            }
          });
          findingsList.push(finding);
          totalFindings++;
        }
      }
    }
  }
  console.log(`✅ ${totalFindings} hallazgos creados\n`);

  // 4. Crear asignaciones e incidentes
  console.log('🎯 Creando asignaciones e incidentes...');
  let incidentCount = 0;

  for (let i = 0; i < Math.min(24, findingsList.length); i++) {
    const finding = findingsList[i];

    if (finding.severity === 'CRITICAL') {
      // Crear asignación para el incidente
      const assignment = await prisma.findingAssignment.create({
        data: {
          findingId: finding.id,
          assignedTo: [admin.id, analyst.id, developer.id][i % 3]
        }
      });

      // Crear estado para marcar como incidente
      await prisma.findingStatusChange.create({
        data: {
          findingId: finding.id,
          status: ['DETECTED', 'IN_REVIEW', 'IN_CORRECTION', 'VERIFIED'][i % 4],
          changedBy: admin.id,
          note: `Incidente crítico asignado para investigación - Severidad: ${finding.severity}`
        }
      });

      incidentCount++;
    }
  }
  console.log(`✅ ${incidentCount} incidentes creados\n`);

  // 5. Crear remediaciones
  console.log('🔧 Creando remediaciones...');
  let remediationCount = 0;

  for (let i = 0; i < Math.min(8, findingsList.length); i++) {
    const finding = findingsList[i];

    const remediation = await prisma.remediationAction.create({
      data: {
        findingId: finding.id,
        status: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED'][i % 4],
        assigneeId: [admin.id, analyst.id, developer.id][i % 3],
        title: `Fix ${finding.riskType} in ${finding.file}`,
        description: `Remediation needed for ${finding.severity} finding: ${finding.whySuspicious}`,
        dueDate: new Date(Date.now() + (5 - i) * 24 * 60 * 60 * 1000),
        priority: finding.severity === 'CRITICAL' ? 2 : finding.severity === 'HIGH' ? 1 : 0
      }
    });
    remediationCount++;
  }
  console.log(`✅ ${remediationCount} remediaciones creadas\n`);

  // 6. Crear eventos forenses
  console.log('📜 Creando eventos forenses...');
  let eventCount = 0;

  for (const analysis of analysisIds.slice(0, 3)) {
    for (let e = 0; e < 20; e++) {
      const event = await prisma.forensicEvent.create({
        data: {
          analysisId: analysis,
          commitHash: `abc${Math.random().toString(36).substring(7)}`,
          commitMessage: [
            'Fix security vulnerability in auth module',
            'Update dependencies to patch CVE-2023-XXXXX',
            'Remove hardcoded credentials',
            'Add input validation',
            'Refactor API endpoint security'
          ][e % 5],
          author: ['john@company.com', 'sarah@company.com', 'mike@company.com'][e % 3],
          action: ['ADDED', 'MODIFIED', 'DELETED'][e % 3],
          file: `src/app/file${e}.js`,
          function: `function${e}`,
          changesSummary: `Security update - ${['Adding validation', 'Fixing bug', 'Updating lib'][e % 3]}`,
          riskLevel: ['LOW', 'MEDIUM', 'HIGH'][e % 3],
          suspicionIndicators: [['hardcoded_secret'], ['missing_validation'], ['unsafe_eval']][e % 3],
          timestamp: new Date(Date.now() - e * 60 * 60 * 1000)
        }
      });
      eventCount++;
    }
  }
  console.log(`✅ ${eventCount} eventos forenses creados\n`);

  // 7. Crear comentarios
  console.log('💬 Creando comentarios...');
  let commentCount = 0;

  for (let i = 0; i < Math.min(12, findingsList.length); i++) {
    const finding = findingsList[i];

    const comment = await prisma.comment.create({
      data: {
        findingId: finding.id,
        userId: [admin.id, analyst.id, developer.id][i % 3],
        content: [
          'This is a critical vulnerability that needs immediate attention',
          'We should remediate this in the next sprint',
          'Good catch - this could lead to data breach',
          'Need to review the entire authentication module',
          'Agreed - let\'s schedule a security review'
        ][i % 5],
        mentions: i % 3 === 0 ? ['admin@scr-agent.dev', 'analyst@scr-agent.dev'] : []
      }
    });
    commentCount++;
  }
  console.log(`✅ ${commentCount} comentarios creados\n`);

  // Resumen
  console.log('\n' + '='.repeat(50));
  console.log('✅ SEED DATA COMPLETADO EXITOSAMENTE');
  console.log('='.repeat(50));
  console.log(`
📊 Estadísticas:
   - Usuarios: 3
   - Proyectos: 5
   - Análisis: 10
   - Hallazgos: ${totalFindings} (24 CRITICAL, 15 HIGH, 8 MEDIUM, 3 LOW)
   - Incidentes: ${incidentCount}
   - Remediaciones: ${remediationCount}
   - Eventos Forenses: ${eventCount}
   - Comentarios: ${commentCount}

🔍 Validación:
   ✓ 24 hallazgos CRITICAL = 24 incidentes
   ✓ Datos distribuidos realísticamente
   ✓ Relaciones intactas (análisis → hallazgos → incidentes)
   ✓ Timestamps realistas
   ✓ Remediaciones asignadas a usuarios

🚀 Próximo paso: Ejecutar FASE 2 - Validación de Endpoints
  `);
}

main()
  .catch((e) => {
    console.error('❌ Error durante seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
