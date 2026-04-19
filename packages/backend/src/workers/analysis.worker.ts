/**
 * ============================================================================
 * ANALYSIS WORKER - Procesa jobs de Bull queue
 * ============================================================================
 *
 * Worker que ejecuta los 3 agentes de análisis:
 * 1. Inspector Agent → Detecta código malicioso
 * 2. Detective Agent → Investiga historial Git
 * 3. Fiscal Agent → Sintetiza reporte y risk score
 *
 * Corre en paralelo múltiples análisis (configurable via ANALYSIS_CONCURRENCY)
 */

import { Worker, Job } from 'bullmq';
import { logger } from '../services/logger.service';
import { prisma } from '../services/prisma.service';
import { gitService } from '../services/git.service';
import { InspectorAgentService } from '../agents/inspector.agent';
import { DetectiveAgentService } from '../agents/detective.agent';
import { FiscalAgentService } from '../agents/fiscal.agent';
import { socketService } from '../services/socket.service';
import { decrypt } from '../services/crypto.service';
import { UserLLMConfig } from '../services/llm-client.service';
import { detectiveService } from '../services/detective.service';
import { QUEUE_NAME, ANALYSIS_CONCURRENCY } from '../config/bull.config';
import {
  getNewCommits,
  getLastAnalysisPosition,
  shouldBeIncremental,
  updateLastProcessedCommit,
} from '../services/incremental-analysis.service';

// Instanciar agentes
const inspectorAgent = new InspectorAgentService();
const detectiveAgent = new DetectiveAgentService();
const fiscalAgent = new FiscalAgentService();

// Configuración de Redis para el worker
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

function parseRedisUrl(url: string) {
  const match = url.match(/redis:\/\/(?:([^:@]+):([^@]+)@)?([^:]+):(\d+)/);
  if (!match) {
    return { host: 'localhost', port: 6379 };
  }
  return {
    host: match[3],
    port: parseInt(match[4], 10),
    username: match[1],
    password: match[2],
  };
}

const redisConnection = parseRedisUrl(REDIS_URL);

/**
 * Procesa un job de análisis
 * Ejecuta Detective → Inspector → Fiscal secuencialmente
 */
async function processAnalysisJob(job: Job) {
  const { analysisId, projectId, isIncremental: requestedIncremental } = job.data as { 
    analysisId: string; 
    projectId: string; 
    isIncremental?: boolean 
  };

  let ownerId = '';

  try {
    logger.info(`⚙️ [Job ${job.id}] Procesando análisis ${analysisId}...`);

    // Obtener datos del proyecto
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error(`Proyecto ${projectId} no encontrado`);
    }

    ownerId = project.userId ?? '';

    // Obtener configuración del usuario (GitHub token + LLM settings)
    let userGithubToken: string | undefined = process.env['GITHUB_TOKEN'];
    let userLLMConfig: UserLLMConfig = {};

    if (project.userId) {
      const userSettings = await prisma.userSettings.findUnique({
        where: { userId: project.userId },
        select: {
          githubToken: true,
          claudeApiKey: true,
          llmProvider: true,
          lmstudioBaseUrl: true,
          selectedModel: true,
        },
      });
      if (userSettings?.githubToken) {
        userGithubToken = decrypt(userSettings.githubToken);
      }
      if (userSettings) {
        userLLMConfig = {
          provider: (userSettings.llmProvider as any) || undefined,
          apiKey: userSettings.claudeApiKey ? decrypt(userSettings.claudeApiKey) : undefined,
          model: userSettings.selectedModel || undefined,
          lmstudioBaseUrl: userSettings.lmstudioBaseUrl || undefined,
        };
      }
    }

    inspectorAgent.updateConfig(userLLMConfig);
    detectiveAgent.updateConfig(userLLMConfig);
    fiscalAgent.updateConfig(userLLMConfig);

    // ========== FASE 1: INSPECTOR AGENT ==========
    logger.info(`[1/3] 🔍 [Job ${job.id}] Ejecutando Inspector Agent...`);
    await prisma.analysis.update({
      where: { id: analysisId },
      data: { status: 'INSPECTOR_RUNNING', progress: 10, startedAt: new Date() },
    });
    await prisma.analysisJob.update({
      where: { analysisId },
      data: { status: 'ACTIVE', startedAt: new Date(), attempts: job.attemptsMade + 1 },
    });
    socketService.emitAnalysisStatusChanged(analysisId, projectId, 'INSPECTOR_RUNNING', 10);

    // Clonar repositorio
    logger.info(`Descargando repositorio: ${project.repositoryUrl}`);
    const localPath = await gitService.cloneOrPullRepository(
      project.repositoryUrl,
      userGithubToken,
      project.branch || undefined
    );

    // Leer código fuente (Híbrido: Incremental vs Completo)
    logger.info(`Leyendo código fuente...`);
    
    // Obtener última posición para posible incremental
    const lastCommitSha = await getLastAnalysisPosition(projectId);
    let repoFiles: any;
    let isActuallyIncremental = false;

    if (requestedIncremental && lastCommitSha) {
      logger.info(`📊 Ejecutando modo INCREMENTAL desde ${lastCommitSha.substring(0, 7)}`);
      repoFiles = await gitService.readFilesChangedSince(localPath, lastCommitSha, 'HEAD', {
        maxFileSizeKb: (project as any).maxFileSizeKb ?? 150,
        maxTotalSizeMb: (project as any).maxTotalSizeMb ?? 2,
      });
      isActuallyIncremental = true;
      
      // Si no han habido cambios, podemos terminar temprano
      if (repoFiles.files.length === 0 && repoFiles.deletedFiles.length === 0) {
        logger.info(`✓ No se detectaron cambios desde el último análisis. Finalizando.`);
        await prisma.analysis.update({
          where: { id: analysisId },
          data: { status: 'COMPLETED', progress: 100, completedAt: new Date(), errorMessage: 'Sin cambios detectados' },
        });
        return { success: true, analysisId, message: 'No changes' };
      }
    } else {
      logger.info(`📊 Ejecutando modo COMPLETO del repositorio`);
      repoFiles = gitService.readRepositoryFiles(localPath, undefined, {
        maxFileSizeKb: (project as any).maxFileSizeKb ?? 150,
        maxTotalSizeMb: (project as any).maxTotalSizeMb ?? 2,
        maxDirectoryDepth: (project as any).maxDirectoryDepth ?? 6,
      });
    }

    logger.info(`Analizando código (${repoFiles.fileCount} archivos activos, ${repoFiles.totalSize} bytes)...`);

    // Ejecutar Inspector Agent con timeout
    const maliciaOutput: any = await Promise.race([
      inspectorAgent.analizarArchivos(repoFiles.files, `Repositorio: ${project.repositoryUrl}`),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Inspector Agent timeout (5 minutos)')), 5 * 60 * 1000)
      ),
    ]);

    // Persistir cobertura
    await prisma.analysis.update({
      where: { id: analysisId },
      data: { coverageSummary: repoFiles.coverage as any },
    });
    socketService.emitCoverageReport(analysisId, projectId, repoFiles.coverage);

    logger.info(`✅ [Job ${job.id}] Inspector encontró ${maliciaOutput.cantidad_hallazgos} hallazgos`);

    // Mapear severidad y tipo de riesgo
    const mapSeverity = (s: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' => {
      const normalized = (s || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (normalized.includes('CRITIC') || normalized.includes('CRITICO')) return 'CRITICAL';
      if (normalized.includes('ALTO') || normalized.includes('HIGH')) return 'HIGH';
      if (normalized.includes('MEDIO') || normalized.includes('MEDIUM')) return 'MEDIUM';
      return 'LOW';
    };

    const VALID_RISK_TYPES = [
      'BACKDOOR',
      'INJECTION',
      'LOGIC_BOMB',
      'OBFUSCATION',
      'SUSPICIOUS',
      'ERROR_HANDLING',
      'HARDCODED_VALUES',
    ] as const;
    type RiskType = typeof VALID_RISK_TYPES[number];
    const mapRiskType = (tipo: string): RiskType => {
      const t = (tipo || '').toUpperCase().replace(/[^A-Z_]/g, '').replace(/\s+/g, '_');
      if (VALID_RISK_TYPES.includes(t as any)) return t as RiskType;
      if (t.includes('BACKDOOR') || t.includes('PUERTA_TRASERA')) return 'BACKDOOR';
      if (t.includes('INJECT') || t.includes('INYEC')) return 'INJECTION';
      if (t.includes('LOGIC') || t.includes('BOMB') || t.includes('LOGICA')) return 'LOGIC_BOMB';
      if (t.includes('OBFUSC') || t.includes('OFUSC')) return 'OBFUSCATION';
      if (
        t.includes('HARDCOD') ||
        t.includes('CREDENC') ||
        t.includes('SECRET') ||
        t.includes('HIDDEN') ||
        t.includes('OCULTO')
      )
        return 'HARDCODED_VALUES';
      if (t.includes('ERROR') || t.includes('EXCEPTION')) return 'ERROR_HANDLING';
      return 'SUSPICIOUS';
    };

    // Guardar hallazgos
    const findingMap = new Map<string, string>();

    if (maliciaOutput.hallazgos && maliciaOutput.hallazgos.length > 0) {
      logger.info(`Guardando ${maliciaOutput.hallazgos.length} hallazgos en BD...`);
      for (const hallazgo of maliciaOutput.hallazgos) {
        const createdFinding = await prisma.finding.create({
          data: {
            analysisId,
            severity: mapSeverity(hallazgo.severidad),
            riskType: mapRiskType(hallazgo.tipo || hallazgo.tipo_riesgo || ''),
            file: hallazgo.archivo || 'unknown',
            lineRange: Array.isArray(hallazgo.rango_lineas)
              ? hallazgo.rango_lineas.join('-')
              : hallazgo.linea
                ? String(hallazgo.linea)
                : '0',
            codeSnippet: hallazgo.codigo || hallazgo.fragmento_codigo || undefined,
            whySuspicious: hallazgo.descripcion || hallazgo.por_que_sospechoso || 'Sin descripción',
            remediationSteps: hallazgo.remediationSteps ||
              (hallazgo.recomendacion ? [hallazgo.recomendacion] : hallazgo.pasos_remediacion || []),
            confidence: hallazgo.confianza || 0.8,
          },
        });

        const key = `${hallazgo.archivo}:${hallazgo.funcion || 'file'}`;
        findingMap.set(key, createdFinding.id);
      }
      logger.info(`✅ Hallazgos guardados exitosamente`);
    }

    // ========== FASE 2: DETECTIVE AGENT ==========
    logger.info(`[2/3] 🔎 [Job ${job.id}] Ejecutando Detective Agent...`);
    await prisma.analysis.update({
      where: { id: analysisId },
      data: { status: 'DETECTIVE_RUNNING', progress: 40 },
    });
    socketService.emitAnalysisStatusChanged(analysisId, projectId, 'DETECTIVE_RUNNING', 40);

    // Determinar si análisis debe ser incremental
    const isIncremental = await shouldBeIncremental(projectId);
    const historialGit = await getNewCommits(
      project.repositoryUrl,
      lastCommitSha ?? undefined,
      (project as any).maxCommits ?? 50
    );

    logger.info(`Investigando ${maliciaOutput.hallazgos.length} hallazgos en historial...`);

    const forensesOutput: any = await Promise.race([
      detectiveAgent.investigarHistorial({
        hallazgos_malicia: maliciaOutput.hallazgos,
        historial_commits: historialGit,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Detective Agent timeout (3 minutos)')), 3 * 60 * 1000)
      ),
    ]);

    logger.info(`✅ [Job ${job.id}] Detective encontró ${forensesOutput.linea_tiempo.length} eventos`);

    // Guardar eventos forenses
    if (forensesOutput.linea_tiempo && forensesOutput.linea_tiempo.length > 0) {
      logger.info(`Guardando ${forensesOutput.linea_tiempo.length} eventos forenses en BD...`);
      for (const evento of forensesOutput.linea_tiempo) {
        try {
          const findingId = findingMap.get(`${evento.archivo}:${evento.funcion || 'file'}`);

          await prisma.forensicEvent.create({
            data: {
              analysisId,
              findingId,
              commitHash: evento.commit || evento.commitHash || evento.hash || 'unknown',
              commitMessage: evento.mensaje_commit || evento.commitMessage || evento.descripcion || '',
              author: evento.autor || 'unknown',
              action: (evento.accion || 'MODIFIED') as any,
              file: evento.archivo || '',
              function: evento.funcion,
              changesSummary: evento.resumen_cambios || evento.descripcion,
              suspicionIndicators: evento.indicadores || [evento.resumen_cambios || 'Detected via Git history analysis'],
              timestamp: new Date(evento.timestamp || Date.now()),
            },
          });
        } catch (e) {
          logger.warn(`No se pudo guardar evento forense: ${(e as any).message}`);
        }
      }
      logger.info(`✅ Eventos forenses guardados`);
    }

    // ========== FASE 3: FISCAL AGENT ==========
    logger.info(`[3/3] 📊 [Job ${job.id}] Ejecutando Fiscal Agent...`);
    await prisma.analysis.update({
      where: { id: analysisId },
      data: { status: 'FISCAL_RUNNING', progress: 70 },
    });
    socketService.emitAnalysisStatusChanged(analysisId, projectId, 'FISCAL_RUNNING', 70);

    const sintesisOutput: any = await Promise.race([
      fiscalAgent.generarReporte({
        hallazgos_malicia: maliciaOutput.hallazgos,
        linea_tiempo_forenses: forensesOutput.linea_tiempo,
        contexto_repo: `Repositorio: ${project.repositoryUrl}`,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Fiscal Agent timeout (2 minutos)')), 2 * 60 * 1000)
      ),
    ]);

    logger.info(`✅ [Job ${job.id}] Fiscal generó reporte con puntuación: ${sintesisOutput.puntuacion_riesgo}/100`);

    // Guardar reporte
    const totalInput =
      (maliciaOutput.usage?.input_tokens || 0) +
      (forensesOutput.usage?.input_tokens || 0) +
      (sintesisOutput.usage?.input_tokens || 0);
    const totalOutput =
      (maliciaOutput.usage?.output_tokens || 0) +
      (forensesOutput.usage?.output_tokens || 0) +
      (sintesisOutput.usage?.output_tokens || 0);

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
        generalRecommendation:
          sintesisOutput.recomendacion_general ||
          'Se recomienda una revisión inmediata de los hallazgos críticos.',
        inputTokens: totalInput,
        outputTokens: totalOutput,
        model: sintesisOutput.usage?.model || 'claude-3-5-sonnet',
      },
    });
    logger.info(`✅ Reporte guardado con éxito (Tokens: ${totalInput} in / ${totalOutput} out)`);

    // ========== COMPLETADO ==========
    logger.info(`✅ [Job ${job.id}] Análisis ${analysisId} completado exitosamente`);

    // Actualizar última posición procesada si hay commits en el historial
    if (historialGit.length > 0) {
      const lastCommit = historialGit[0]; // Primer commit en el historial (más reciente)
      await updateLastProcessedCommit(analysisId, lastCommit.hash);
    }

    await prisma.analysis.update({
      where: { id: analysisId },
      data: { status: 'COMPLETED', progress: 100, completedAt: new Date() },
    });
    await prisma.analysisJob.update({
      where: { analysisId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
    socketService.emitAnalysisStatusChanged(analysisId, projectId, 'COMPLETED', 100);

    // Generar eventos forenses para el análisis completado
    await detectiveService.generateForensicEvents(analysisId);

    return { success: true, analysisId };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(`❌ [Job ${job.id}] Error en análisis: ${errorMsg}`);

    // Actualizar estado a FAILED en BD
    if (job.data.analysisId) {
      const analysisId = job.data.analysisId;
      const projectId = job.data.projectId;

      await prisma.analysis.update({
        where: { id: analysisId },
        data: { status: 'FAILED', errorMessage: errorMsg, completedAt: new Date() },
      });
      await prisma.analysisJob.update({
        where: { analysisId },
        data: { status: 'FAILED', lastError: errorMsg, completedAt: new Date() },
      });

      socketService.emitAnalysisError(analysisId, projectId, errorMsg, ownerId);
      socketService.emitAnalysisStatusChanged(analysisId, projectId, 'FAILED', 0);
    }

    // Re-lanzar error para que Bull lo maneje (reintentos automáticos)
    throw error;
  }
}

/**
 * Inicializar y arrancar el worker
 */
export async function startAnalysisWorker() {
  try {
    const worker = new Worker(QUEUE_NAME, processAnalysisJob, {
      connection: redisConnection as any,
      concurrency: ANALYSIS_CONCURRENCY,
    });

    // Event listeners
    worker.on('completed', (job) => {
      logger.info(`✓ Worker completó job ${job.id}`);
    });

    worker.on('failed', (job, err) => {
      logger.error(`✗ Worker falló job ${job?.id}: ${err.message}`);
    });

    worker.on('error', (err) => {
      logger.error(`✗ Worker error: ${err.message}`);
    });

    logger.info(`✓ Analysis worker iniciado (concurrencia: ${ANALYSIS_CONCURRENCY})`);

    return worker;
  } catch (error) {
    logger.error(`❌ Error iniciando worker: ${error}`);
    throw error;
  }
}
