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
import { LLMConfig } from '../services/llm-client.service';
import { socketService } from '../services/socket.service';
import { decrypt } from '../services/crypto.service';
import { getLLMConfigFromUser } from '../services/user-llm-config.service';
import { detectiveService } from '../services/detective.service';
import { recordTokenUsage } from '../services/metrics.service';
import { createCancellationToken, cleanupCancellationToken, isAnalysisCancelled } from '../services/cancellation.service';
import { QUEUE_NAME, ANALYSIS_CONCURRENCY } from '../config/bull.config';
import {
  getNewCommits,
  getLastAnalysisPosition,
  shouldBeIncremental,
  updateLastProcessedCommit,
} from '../services/incremental-analysis.service';

// Instanciar agentes con config por defecto
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

  // Crear token de cancelación para este análisis
  const cancellationToken = createCancellationToken(analysisId);

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
    let userLLMConfig: {
      provider?: string;
      apiKey?: string;
      model?: string;
      llmBaseUrl?: string;
    } = {};

    if (project.userId) {
      const userSettings = await prisma.userSettings.findUnique({
        where: { userId: project.userId },
        select: {
          githubToken: true,
          claudeApiKey: true,
          llmProvider: true,
          llmBaseUrl: true,
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
          llmBaseUrl: userSettings.llmBaseUrl || undefined,
        };
      }
    }

    // Obtener y aplicar configuración LLM del usuario + signal de cancelación
    const llmConfig = await getLLMConfigFromUser(project.userId);
    if (llmConfig) {
      logger.info(`Aplicando LLM config del usuario: ${llmConfig.provider}/${llmConfig.model}`);
      // Agregar signal de cancelación a la config
      const configWithSignal = { ...llmConfig, signal: cancellationToken.signal };
      inspectorAgent.updateConfig(configWithSignal);
      detectiveAgent.updateConfig(configWithSignal);
      fiscalAgent.updateConfig(configWithSignal);
    } else {
      // Incluso si no hay config del usuario, pasar el signal para cancelación
      inspectorAgent.updateConfig({ signal: cancellationToken.signal } as any);
      detectiveAgent.updateConfig({ signal: cancellationToken.signal } as any);
      fiscalAgent.updateConfig({ signal: cancellationToken.signal } as any);
    }

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

    // Callback para reportar progreso en tiempo real
    const progressCallback = async (processedChunks: number, totalChunks: number) => {
      // Calcular progreso real: (chunks_procesados / chunks_totales) * 100
      // Esto da mejor granularidad especialmente con muchos chunks (ej. 1500 chunks de juice-shop)
      const inspectorProgress = Math.round((processedChunks / totalChunks) * 100);

      logger.info(`[Progress] Inspector: ${processedChunks}/${totalChunks} chunks (${inspectorProgress}%)`);

      // Actualizar BD con progreso real
      await prisma.analysis.update({
        where: { id: analysisId },
        data: { progress: inspectorProgress },
      });

      // Emitir evento WebSocket para actualizar UI en tiempo real
      socketService.emitAnalysisStatusChanged(analysisId, projectId, 'INSPECTOR_RUNNING', inspectorProgress);
    };

    // Ejecutar Inspector Agent con timeout
    // Con 10 minutos por chunk y timeout global de 4 horas, establecer timeout aquí en 5 horas para dar margen
    // Para proyectos muy grandes (>500KB): considerar limitar tamaño o usar Anthropic Claude en lugar de modelos locales
    const maliciaOutput: any = await Promise.race([
      inspectorAgent.analizarArchivos(repoFiles.files, `Repositorio: ${project.repositoryUrl}`, progressCallback),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Inspector Agent timeout (300 minutos / 5 horas) - análisis de código demasiado lento o proyecto muy grande')), 300 * 60 * 1000)
      ),
    ]);

    // Persistir cobertura
    await prisma.analysis.update({
      where: { id: analysisId },
      data: { coverageSummary: repoFiles.coverage as any },
    });
    socketService.emitCoverageReport(analysisId, projectId, repoFiles.coverage);

    // 📊 Log retry/backoff stats if any chunks failed
    if (maliciaOutput.failedChunks && maliciaOutput.failedChunks.length > 0) {
      logger.warn(
        `⚠️ Inspector: ${maliciaOutput.failedChunks.length} chunks fallidos después de reintentos`
      );
      maliciaOutput.failedChunks.forEach((fc: any) => {
        logger.warn(`   - Chunk ${fc.index + 1}: ${fc.error} (${fc.attempts} intentos)`);
      });
    }

    logger.info(`✅ [Job ${job.id}] Inspector encontró ${maliciaOutput.cantidad_hallazgos} hallazgos`);

    // 📊 RECORD INSPECTOR TOKEN USAGE (Partial - even if analysis fails later)
    if (ownerId && maliciaOutput.usage) {
      const inspectorInput = maliciaOutput.usage.input_tokens || 0;
      const inspectorOutput = maliciaOutput.usage.output_tokens || 0;
      if (inspectorInput > 0 || inspectorOutput > 0) {
        await recordTokenUsage({
          analysisId,
          userId: ownerId,
          inputTokens: inspectorInput,
          outputTokens: inspectorOutput,
          model: maliciaOutput.usage.model || llmConfig?.model || 'qwen2.5-coder-7b-instruct',
          provider: llmConfig?.provider || 'lmstudio',
          stage: 'INSPECTOR',
        });
        logger.info(`✅ Inspector tokens recorded: ${inspectorInput} in / ${inspectorOutput} out`);
        // Emit event to notify UI of cost update in real-time
        socketService.broadcast('analysisCostUpdated', {
          analysisId,
          projectId,
          stage: 'INSPECTOR',
          tokens: { input: inspectorInput, output: inspectorOutput },
        });
      }
    }

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

    // Detectar si repositorio es grande para aplicar chunking
    // Criterio: > 2MB total o > 1000 archivos
    const LARGE_REPO_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
    const LARGE_REPO_FILE_COUNT = 1000;
    const isLargeRepo =
      repoFiles.totalSize > LARGE_REPO_SIZE_BYTES ||
      repoFiles.fileCount > LARGE_REPO_FILE_COUNT;

    logger.info(`📊 Repo size analysis: ${repoFiles.totalSize} bytes, ${repoFiles.fileCount} files → ${isLargeRepo ? 'LARGE' : 'SMALL'}`);

    logger.info(`Investigando ${maliciaOutput.hallazgos.length} hallazgos en historial...`);

    const forensesOutput: any = await Promise.race([
      detectiveAgent.investigarHistorial({
        hallazgos_malicia: maliciaOutput.hallazgos,
        historial_commits: historialGit,
      }, isLargeRepo),
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

    // 📊 RECORD DETECTIVE TOKEN USAGE (Partial - even if analysis fails later)
    if (ownerId && forensesOutput.usage) {
      const detectiveInput = forensesOutput.usage.input_tokens || 0;
      const detectiveOutput = forensesOutput.usage.output_tokens || 0;
      if (detectiveInput > 0 || detectiveOutput > 0) {
        await recordTokenUsage({
          analysisId,
          userId: ownerId,
          inputTokens: detectiveInput,
          outputTokens: detectiveOutput,
          model: forensesOutput.usage.model || llmConfig?.model || 'claude-3-5-sonnet',
          provider: llmConfig?.provider || 'anthropic',
          stage: 'DETECTIVE',
        });
        logger.info(`✅ Detective tokens recorded: ${detectiveInput} in / ${detectiveOutput} out`);
        // Emit event to notify UI of cost update in real-time
        socketService.broadcast('analysisCostUpdated', {
          analysisId,
          projectId,
          stage: 'DETECTIVE',
          tokens: { input: detectiveInput, output: detectiveOutput },
        });
      }
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
      }, isLargeRepo),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Fiscal Agent timeout (10 minutos) - reporte synthesis demasiado lento o proyecto muy grande')), 10 * 60 * 1000)
      ),
    ]);

    // Validar que Fiscal devolvió datos válidos
    if (!sintesisOutput) {
      throw new Error('Fiscal Agent devolvió respuesta vacía');
    }
    if (!sintesisOutput.resumen_ejecutivo) {
      logger.warn('⚠️ Fiscal: resumen_ejecutivo vacío, usando default');
      sintesisOutput.resumen_ejecutivo = 'Análisis completado sin resumen disponible.';
    }
    if (!sintesisOutput.puntuacion_riesgo) {
      logger.warn('⚠️ Fiscal: puntuacion_riesgo vacía, usando default');
      sintesisOutput.puntuacion_riesgo = 50;
    }

    logger.info(`✅ [Job ${job.id}] Fiscal generó reporte con puntuación: ${sintesisOutput.puntuacion_riesgo}/100`);

    // 📊 RECORD FISCAL TOKEN USAGE (Last stage)
    if (ownerId && sintesisOutput.usage) {
      const fiscalInput = sintesisOutput.usage.input_tokens || 0;
      const fiscalOutput = sintesisOutput.usage.output_tokens || 0;
      if (fiscalInput > 0 || fiscalOutput > 0) {
        await recordTokenUsage({
          analysisId,
          userId: ownerId,
          inputTokens: fiscalInput,
          outputTokens: fiscalOutput,
          model: sintesisOutput.usage.model || llmConfig?.model || 'claude-3-5-sonnet',
          provider: llmConfig?.provider || 'anthropic',
          stage: 'FISCAL',
        });
        logger.info(`✅ Fiscal tokens recorded: ${fiscalInput} in / ${fiscalOutput} out`);
        // Emit event to notify UI of cost update in real-time
        socketService.broadcast('analysisCostUpdated', {
          analysisId,
          projectId,
          stage: 'FISCAL',
          tokens: { input: fiscalInput, output: fiscalOutput },
        });
      }
    }

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

    // Convert generalRecommendation array to JSON string if it's an array
    let generalRecommendationStr = 'Se recomienda una revisión inmediata de los hallazgos críticos.';
    if (sintesisOutput.recomendacion_general) {
      if (Array.isArray(sintesisOutput.recomendacion_general)) {
        generalRecommendationStr = JSON.stringify(sintesisOutput.recomendacion_general);
      } else if (typeof sintesisOutput.recomendacion_general === 'string') {
        generalRecommendationStr = sintesisOutput.recomendacion_general;
      }
    }

    // Validar y limpiar datos antes de guardar
    const severityBreakdown = sintesisOutput.desglose_severidad || { CRÍTICO: 0, ALTO: 0, MEDIO: 0, BAJO: 0 };
    logger.info(`📋 Reporte data: findings=${maliciaOutput.cantidad_hallazgos}, severity=${JSON.stringify(severityBreakdown)}, risk=${sintesisOutput.puntuacion_riesgo}`);

    try {
      // Check if report already exists to avoid unique constraint violation
      const existingReport = await prisma.report.findUnique({ where: { analysisId } });

      // Prepare remediation steps from Fiscal output
      const remediationSteps = Array.isArray(sintesisOutput.prioridad_remediacion)
        ? sintesisOutput.prioridad_remediacion
        : [];

      if (!existingReport) {
        await prisma.report.create({
          data: {
            analysisId,
            riskScore: Math.min(100, Math.max(0, sintesisOutput.puntuacion_riesgo || 50)),
            executiveSummary: sintesisOutput.resumen_ejecutivo || 'Análisis completado exitosamente.',
            findingsCount: maliciaOutput.cantidad_hallazgos || 0,
            severityBreakdown,
            generalRecommendation: generalRecommendationStr,
            remediationSteps,
            inputTokens: totalInput,
            outputTokens: totalOutput,
            model: sintesisOutput.usage?.model || 'claude-3-5-sonnet',
          },
        });
      } else {
        // Update existing report
        await prisma.report.update({
          where: { analysisId },
          data: {
            riskScore: Math.min(100, Math.max(0, sintesisOutput.puntuacion_riesgo || 50)),
            executiveSummary: sintesisOutput.resumen_ejecutivo || 'Análisis completado exitosamente.',
            findingsCount: maliciaOutput.cantidad_hallazgos || 0,
            severityBreakdown,
            generalRecommendation: generalRecommendationStr,
            remediationSteps,
            inputTokens: totalInput,
            outputTokens: totalOutput,
            model: sintesisOutput.usage?.model || 'claude-3-5-sonnet',
          },
        });
      }
      logger.info(`✅ Reporte guardado con éxito en BD (analysisId: ${analysisId}, Tokens: ${totalInput} in / ${totalOutput} out)`);
    } catch (reportError) {
      const reportErrorMsg = reportError instanceof Error ? reportError.message : String(reportError);
      logger.error(`❌ Error guardando reporte en BD: ${reportErrorMsg}`);
      logger.error(`   ReportData: ${JSON.stringify({ analysisId, riskScore: sintesisOutput.puntuacion_riesgo, findingsCount: maliciaOutput.cantidad_hallazgos })}`);
      throw new Error(`Error guardando reporte Prisma: ${reportErrorMsg}`);
    }

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

    // ✅ Token usage already recorded per-stage (INSPECTOR, DETECTIVE, FISCAL)
    // No need to record again here - tokens are aggregated in UI via getAnalysisTokenUsage()
    logger.info(`📊 Total analysis tokens: ${totalInput} input, ${totalOutput} output (recorded per-stage)`);

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

    // Limpiar token de cancelación
    cleanupCancellationToken(analysisId);

    // Re-lanzar error para que Bull lo maneje (reintentos automáticos)
    throw error;
  } finally {
    // Limpiar token de cancelación al completar exitosamente
    cleanupCancellationToken(analysisId);
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
