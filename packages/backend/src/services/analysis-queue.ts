/**
 * ============================================================================
 * ANÁLISIS QUEUE PROCESSOR - Procesa análisis asincronamente
 * ============================================================================
 *
 * Ejecuta secuencialmente los 3 agentes de análisis:
 * 1. Inspector Agent → Detecta vulnerabilidades
 * 2. Detective Agent → Investiga historial Git
 * 3. Fiscal Agent → Sintetiza reporte
 */

import { logger } from './logger.service';
import { prisma } from './prisma.service';
import { gitService } from './git.service';
import { InspectorAgentService } from '../agents/inspector.agent';
import { DetectiveAgentService } from '../agents/detective.agent';
import { FiscalAgentService } from '../agents/fiscal.agent';

// Instanciar agentes
const inspectorAgent = new InspectorAgentService();
const detectiveAgent = new DetectiveAgentService();
const fiscalAgent = new FiscalAgentService();

// Cola simple en memoria
const analysisQueue: Array<{ id: string; projectId: string }> = [];
let isProcessing = false;

/**
 * Procesa un análisis de la cola - EJECUTA LOS 3 AGENTES REALES
 */
async function processAnalysisQueue() {
  if (isProcessing || analysisQueue.length === 0) return;

  isProcessing = true;
  let analysisId: string | null = null;
  try {
    const job = analysisQueue.shift();
    if (!job) return;

    const { id, projectId } = job;
    analysisId = id;

    logger.info(`⚙️ Procesando análisis ${analysisId}...`);

    // Obtener datos del proyecto
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error(`Proyecto ${projectId} no encontrado`);
    }

    // ========== FASE 1: INSPECTOR AGENT ==========
    logger.info(`[1/3] 🔍 Ejecutando Inspector Agent...`);
    await prisma.analysis.update({
      where: { id: analysisId },
      data: {
        status: 'INSPECTOR_RUNNING',
        progress: 10,
        startedAt: new Date(),
      },
    });

    // Clonar/descargar repositorio
    logger.info(`Descargando repositorio: ${project.repositoryUrl}`);
    const localPath = await gitService.cloneOrPullRepository(project.repositoryUrl);

    // Leer código fuente
    logger.info(`Leyendo código fuente...`);
    const repoFiles = gitService.readRepositoryFiles(localPath);
    const codigoFuente = repoFiles.files
      .map((f) => `// === ${f.path} ===\n${f.content}`)
      .join('\n\n');

    logger.info(`Analizando código (${repoFiles.fileCount} archivos, ${repoFiles.totalSize} bytes)...`);

    // Ejecutar Inspector Agent con timeout de 5 minutos
    const maliciaOutput: any = await Promise.race([
      inspectorAgent.analizarCodigo({
        codigo: codigoFuente,
        contexto: `Análisis de repositorio: ${project.repositoryUrl}`,
      }),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('Inspector Agent timeout (5 minutos)')),
          5 * 60 * 1000
        )
      ),
    ]);

    logger.info(`✅ Inspector encontró ${maliciaOutput.cantidad_hallazgos} hallazgos`);

    // Guardar hallazgos
    if (maliciaOutput.hallazgos && maliciaOutput.hallazgos.length > 0) {
      logger.info(`Guardando ${maliciaOutput.hallazgos.length} hallazgos en BD...`);
      for (const hallazgo of maliciaOutput.hallazgos) {
        await prisma.finding.create({
          data: {
            analysisId,
            severity: hallazgo.severidad || 'MEDIUM',
            riskType: hallazgo.tipo || 'UNKNOWN',
            file: hallazgo.archivo || 'unknown',
            lineRange: hallazgo.linea ? String(hallazgo.linea) : '0',
            codeSnippet: hallazgo.codigo || undefined,
            whySuspicious: hallazgo.descripcion || 'No description',
            remediationSteps: hallazgo.recomendacion ? [hallazgo.recomendacion] : [],
            confidence: 0.8,
          },
        });
      }
      logger.info(`✅ Hallazgos guardados exitosamente`);
    } else {
      logger.info(`ℹ️ No se encontraron hallazgos en Inspector`);
    }

    // ========== FASE 2: DETECTIVE AGENT ==========
    logger.info(`[2/3] 🔎 Ejecutando Detective Agent...`);
    await prisma.analysis.update({
      where: { id: analysisId },
      data: {
        status: 'DETECTIVE_RUNNING',
        progress: 40,
      },
    });

    logger.info(`Obteniendo historial de Git...`);
    const historialGit = await gitService.getCommitHistory(project.repositoryUrl, 50);

    logger.info(`Investigando ${maliciaOutput.hallazgos.length} hallazgos en historial...`);

    // Ejecutar Detective Agent con timeout de 3 minutos
    const forensesOutput: any = await Promise.race([
      detectiveAgent.investigarHistorial({
        hallazgos_malicia: maliciaOutput.hallazgos,
        historial_commits: historialGit,
      }),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('Detective Agent timeout (3 minutos)')),
          3 * 60 * 1000
        )
      ),
    ]);

    logger.info(`✅ Detective encontró ${forensesOutput.linea_tiempo.length} eventos`);

    // Guardar eventos forenses
    if (forensesOutput.linea_tiempo && forensesOutput.linea_tiempo.length > 0) {
      logger.info(`Guardando ${forensesOutput.linea_tiempo.length} eventos forenses en BD...`);
      for (const evento of forensesOutput.linea_tiempo) {
        try {
          await prisma.forensicEvent.create({
            data: {
              analysisId,
              commitHash: evento.commitHash || evento.hash || 'unknown',
              commitMessage: evento.commitMessage || evento.descripcion || '',
              author: evento.autor || 'unknown',
              action: 'MODIFIED', // Default value - file was modified
              file: evento.archivo || '',
              changesSummary: evento.descripcion,
              timestamp: new Date(evento.timestamp || Date.now()),
            },
          });
        } catch (e) {
          logger.warn(`Could not save forensic event: ${(e as any).message}`);
        }
      }
      logger.info(`✅ Eventos forenses guardados`);
    } else {
      logger.info(`ℹ️ No se encontraron eventos en Detective`);
    }

    // ========== FASE 3: FISCAL AGENT ==========
    logger.info(`[3/3] 📊 Ejecutando Fiscal Agent...`);
    await prisma.analysis.update({
      where: { id: analysisId },
      data: {
        status: 'FISCAL_RUNNING',
        progress: 70,
      },
    });

    logger.info(`Sintetizando análisis y generando reporte...`);

    // Ejecutar Fiscal Agent con timeout de 2 minutos
    const sintesisOutput: any = await Promise.race([
      fiscalAgent.generarReporte({
        hallazgos_malicia: maliciaOutput.hallazgos,
        linea_tiempo_forenses: forensesOutput.linea_tiempo,
        contexto_repo: `Repositorio: ${project.repositoryUrl}`,
      }),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('Fiscal Agent timeout (2 minutos)')),
          2 * 60 * 1000
        )
      ),
    ]);

    logger.info(`✅ Fiscal generó reporte con puntuación: ${sintesisOutput.puntuacion_riesgo}/100`);

    // Guardar reporte
    logger.info(`Guardando reporte en BD...`);
    await prisma.report.create({
      data: {
        analysisId,
        riskScore: sintesisOutput.puntuacion_riesgo || 50,
        executiveSummary: sintesisOutput.resumen_ejecutivo || 'Analysis completed',
        findingsCount: maliciaOutput.cantidad_hallazgos || 0,
        severityBreakdown: {}, // JSON field
        compromisedFunctions: [],
        affectedAuthors: [],
        remediationSteps: sintesisOutput.pasos_remediacion || [],
        generalRecommendation: sintesisOutput.recomendaciones?.join('\n') || 'Follow security best practices',
      },
    });
    logger.info(`✅ Reporte guardado`);


    // ========== COMPLETADO ==========
    logger.info(`✅ Análisis ${analysisId} completado exitosamente`);
    await prisma.analysis.update({
      where: { id: analysisId },
      data: {
        status: 'COMPLETED',
        progress: 100,
        completedAt: new Date(),
      },
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(`❌ Error en análisis: ${errorMsg}`);

    // Guardar error en análisis
    if (analysisId) {
      await prisma.analysis.update({
        where: { id: analysisId },
        data: {
          status: 'FAILED',
          errorMessage: errorMsg,
          completedAt: new Date(),
        },
      }).catch((err) => logger.error('Error al guardar fallo:', err));
    }
  } finally {
    isProcessing = false;
    // Procesar siguiente análisis si hay
    if (analysisQueue.length > 0) {
      setTimeout(processAnalysisQueue, 1000);
    }
  }
}

/**
 * Encola un análisis para procesamiento
 */
export function enqueueAnalysis(analysisId: string, projectId: string) {
  analysisQueue.push({ id: analysisId, projectId });
  logger.info(`📥 Análisis ${analysisId} encolado`);
  // Comenzar procesamiento si no hay uno en progreso
  if (!isProcessing) {
    setImmediate(processAnalysisQueue);
  }
}

/**
 * Inicia el procesador de la cola (llamar desde index.ts)
 */
export function startAnalysisProcessor() {
  // Procesar cola cada segundo
  setInterval(() => {
    if (analysisQueue.length > 0 && !isProcessing) {
      processAnalysisQueue();
    }
  }, 1000);

  logger.info('✓ Analysis queue processor iniciado');
}
