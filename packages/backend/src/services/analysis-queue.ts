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
import { socketService } from './socket.service';
import { decrypt } from './crypto.service';

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
  let currentProjectId: string | null = null;
  let ownerId = '';
  try {
    const job = analysisQueue.shift();
    if (!job) return;

    const { id, projectId } = job;
    analysisId = id;
    currentProjectId = projectId;

    logger.info(`⚙️ Procesando análisis ${analysisId}...`);

    // Obtener datos del proyecto
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error(`Proyecto ${projectId} no encontrado`);
    }

    ownerId = project.userId ?? '';

    // Obtener GitHub token del usuario (descifrado) como fallback al env var
    let userGithubToken: string | undefined = process.env['GITHUB_TOKEN'];
    if (project.userId) {
      const userSettings = await prisma.userSettings.findUnique({
        where: { userId: project.userId },
        select: { githubToken: true },
      });
      if (userSettings?.githubToken) {
        userGithubToken = decrypt(userSettings.githubToken);
      }
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
    socketService.emitAnalysisStatusChanged(analysisId, projectId, 'INSPECTOR_RUNNING', 10);

    // Clonar/descargar repositorio
    logger.info(`Descargando repositorio: ${project.repositoryUrl}`);
    const localPath = await gitService.cloneOrPullRepository(
      project.repositoryUrl,
      userGithubToken,
      project.branch || undefined
    );

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

    // Mapear severidad español → enum Prisma
    const mapSeverity = (s: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' => {
      const normalized = (s || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (normalized.includes('CRITIC') || normalized.includes('CRITICO')) return 'CRITICAL';
      if (normalized.includes('ALTO') || normalized.includes('HIGH')) return 'HIGH';
      if (normalized.includes('MEDIO') || normalized.includes('MEDIUM')) return 'MEDIUM';
      if (normalized.includes('BAJO') || normalized.includes('LOW')) return 'LOW';
      return 'MEDIUM';
    };

    const VALID_RISK_TYPES = ['BACKDOOR', 'INJECTION', 'LOGIC_BOMB', 'OBFUSCATION', 'SUSPICIOUS', 'ERROR_HANDLING', 'HARDCODED_VALUES'] as const;
    type RiskType = typeof VALID_RISK_TYPES[number];
    const mapRiskType = (tipo: string): RiskType => {
      const t = (tipo || '').toUpperCase().replace(/[^A-Z_]/g, '').replace(/\s+/g, '_');
      if (VALID_RISK_TYPES.includes(t as any)) return t as RiskType;
      if (t.includes('BACKDOOR') || t.includes('PUERTA_TRASERA')) return 'BACKDOOR';
      if (t.includes('INJECT') || t.includes('INYEC')) return 'INJECTION';
      if (t.includes('LOGIC') || t.includes('BOMB') || t.includes('LOGICA')) return 'LOGIC_BOMB';
      if (t.includes('OBFUSC') || t.includes('OFUSC')) return 'OBFUSCATION';
      if (t.includes('HARDCOD') || t.includes('CREDENC') || t.includes('SECRET') || t.includes('HIDDEN') || t.includes('OCULTO')) return 'HARDCODED_VALUES';
      if (t.includes('ERROR') || t.includes('EXCEPTION')) return 'ERROR_HANDLING';
      return 'SUSPICIOUS';
    };

    // Guardar hallazgos y crear mapa para Detective
    const findingMap = new Map<string, string>(); // clave: "archivo:funcion", valor: id_prisma

    if (maliciaOutput.hallazgos && maliciaOutput.hallazgos.length > 0) {
      logger.info(`Guardando ${maliciaOutput.hallazgos.length} hallazgos en BD...`);
      for (const hallazgo of maliciaOutput.hallazgos) {
        const createdFinding = await prisma.finding.create({
          data: {
            analysisId,
            severity: mapSeverity(hallazgo.severidad),
            riskType: mapRiskType(hallazgo.tipo || hallazgo.tipo_riesgo || ''),
            file: hallazgo.archivo || 'unknown',
            lineRange: Array.isArray(hallazgo.rango_lineas) ? hallazgo.rango_lineas.join('-') : (hallazgo.linea ? String(hallazgo.linea) : '0'),
            codeSnippet: hallazgo.codigo || hallazgo.fragmento_codigo || undefined,
            whySuspicious: hallazgo.descripcion || hallazgo.por_que_sospechoso || 'Sin descripción',
            remediationSteps: hallazgo.remediationSteps || (hallazgo.recomendacion ? [hallazgo.recomendacion] : (hallazgo.pasos_remediacion || [])),
            confidence: hallazgo.confianza || 0.8,
          },
        });
        
        // Registrar en el mapa para el Agente Detective
        const key = `${hallazgo.archivo}:${hallazgo.funcion || 'file'}`;
        findingMap.set(key, createdFinding.id);
      }
      logger.info(`✅ Hallazgos guardados exitosamente`);
    } else {
      logger.info(`ℹ️ No se encontraron hallazgos en Inspector`);
    }

    // Check cancellation before Phase 2
    if (isAnalysisCancelled(analysisId)) {
      cancelledAnalyses.delete(analysisId);
      await prisma.analysis.update({ where: { id: analysisId }, data: { status: 'CANCELLED', progress: 0 } });
      socketService.emitAnalysisStatusChanged(analysisId, projectId, 'CANCELLED', 0);
      logger.info(`🚫 Análisis ${analysisId} cancelado antes de Detective`);
      return;
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
    socketService.emitAnalysisStatusChanged(analysisId, projectId, 'DETECTIVE_RUNNING', 40);

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

    // Guardar eventos forenses vinculados
    if (forensesOutput.linea_tiempo && forensesOutput.linea_tiempo.length > 0) {
      logger.info(`Guardando ${forensesOutput.linea_tiempo.length} eventos forenses en BD...`);
      for (const evento of forensesOutput.linea_tiempo) {
        try {
          // Intentar vincular con un hallazgo
          const findingId = findingMap.get(`${evento.archivo}:${evento.funcion || 'file'}`);

          await prisma.forensicEvent.create({
            data: {
              analysisId,
              findingId, // Vínculo real
              commitHash: evento.commit || evento.commitHash || evento.hash || 'unknown',
              commitMessage: evento.mensaje_commit || evento.commitMessage || evento.descripcion || '',
              author: evento.autor || 'unknown',
              action: (evento.accion || 'MODIFIED') as any,
              file: evento.archivo || '',
              function: evento.funcion,
              changesSummary: evento.resumen_cambios || evento.descripcion,
              timestamp: new Date(evento.timestamp || Date.now()),
            },
          });
        } catch (e) {
          logger.warn(`No se pudo guardar evento forense: ${(e as any).message}`);
        }
      }
      logger.info(`✅ Eventos forenses guardados`);
    } else {
      logger.info(`ℹ️ No se encontraron eventos en Detective`);
    }

    // Check cancellation before Phase 3
    if (isAnalysisCancelled(analysisId)) {
      cancelledAnalyses.delete(analysisId);
      await prisma.analysis.update({ where: { id: analysisId }, data: { status: 'CANCELLED', progress: 0 } });
      socketService.emitAnalysisStatusChanged(analysisId, projectId, 'CANCELLED', 0);
      logger.info(`🚫 Análisis ${analysisId} cancelado antes de Fiscal`);
      return;
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
    socketService.emitAnalysisStatusChanged(analysisId, projectId, 'FISCAL_RUNNING', 70);

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

    // Calcular totales para el reporte
    const totalInput = (maliciaOutput.usage?.input_tokens || 0) + 
                      (forensesOutput.usage?.input_tokens || 0) + 
                      (sintesisOutput.usage?.input_tokens || 0);
    const totalOutput = (maliciaOutput.usage?.output_tokens || 0) + 
                       (forensesOutput.usage?.output_tokens || 0) + 
                       (sintesisOutput.usage?.output_tokens || 0);

    // Guardar reporte con metadatos reales
    logger.info(`Guardando reporte final en BD...`);
    await prisma.report.create({
      data: {
        analysisId,
        riskScore: sintesisOutput.puntuacion_riesgo || 50,
        executiveSummary: sintesisOutput.resumen_ejecutivo || 'Análisis completado exitosamente.',
        findingsCount: maliciaOutput.cantidad_hallazgos || 0,
        severityBreakdown: sintesisOutput.desglose_severidad || {},
        compromisedFunctions: sintesisOutput.funciones_comprometidas || [],
        affectedAuthors: sintesisOutput.autores_afectados || [],
        remediationSteps: sintesisOutput.prioridad_remediacion || [],
        generalRecommendation: sintesisOutput.recomendacion_general || 'Se recomienda una revisión inmediata de los hallazgos críticos.',
        inputTokens: totalInput,
        outputTokens: totalOutput,
        model: sintesisOutput.usage?.model || 'claude-3-5-sonnet',
      },
    });
    logger.info(`✅ Reporte guardado con éxito (Tokens: ${totalInput} in / ${totalOutput} out)`);


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
    socketService.emitAnalysisStatusChanged(analysisId, projectId, 'COMPLETED', 100);

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
      }).then(() => {
        if (currentProjectId) {
          socketService.emitAnalysisError(analysisId!, currentProjectId, errorMsg, ownerId);
          socketService.emitAnalysisStatusChanged(analysisId!, currentProjectId, 'FAILED', 0);
        }
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

/** Set de análisis cancelados */
const cancelledAnalyses = new Set<string>();

/**
 * Cancelar un análisis en progreso o en cola
 */
export function cancelAnalysis(analysisId: string): boolean {
  // Remove from queue if pending
  const queueIndex = analysisQueue.findIndex(a => a.id === analysisId);
  if (queueIndex !== -1) {
    analysisQueue.splice(queueIndex, 1);
    logger.info(`🚫 Análisis ${analysisId} removido de la cola`);
    return true;
  }
  // Mark as cancelled so running analysis stops at next checkpoint
  cancelledAnalyses.add(analysisId);
  logger.info(`🚫 Análisis ${analysisId} marcado para cancelación`);
  return true;
}

/**
 * Check if analysis was cancelled
 */
export function isAnalysisCancelled(analysisId: string): boolean {
  return cancelledAnalyses.has(analysisId);
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
 * Inicia el procesador de la cola (llamar desde index.ts).
 * Recupera automáticamente análisis interrumpidos en un restart anterior.
 */
export async function startAnalysisProcessor(): Promise<void> {
  // Recuperar análisis atascados (quedaron PENDING/RUNNING al reiniciar el servidor)
  try {
    const stuck = await prisma.analysis.findMany({
      where: {
        status: {
          in: ['PENDING', 'RUNNING', 'INSPECTOR_RUNNING', 'DETECTIVE_RUNNING', 'FISCAL_RUNNING'],
        },
      },
      select: { id: true, projectId: true },
      orderBy: { createdAt: 'asc' },
    });

    for (const a of stuck) {
      await prisma.analysis.update({
        where: { id: a.id },
        data: { status: 'PENDING', progress: 0 },
      });
      analysisQueue.push({ id: a.id, projectId: a.projectId });
      logger.info(`♻️  Análisis ${a.id} recuperado tras reinicio del servidor`);
    }

    if (stuck.length > 0) {
      logger.info(`♻️  ${stuck.length} análisis recuperados y reencolarlos`);
    }
  } catch (err) {
    logger.error(`Error recuperando análisis al iniciar: ${err}`);
  }

  // Procesar cola cada segundo
  setInterval(() => {
    if (analysisQueue.length > 0 && !isProcessing) {
      processAnalysisQueue();
    }
  }, 1000);

  logger.info('✓ Analysis queue processor iniciado');
}
