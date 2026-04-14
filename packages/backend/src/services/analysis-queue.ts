/**
 * ============================================================================
 * ANALYSIS QUEUE - Interfaz para Bull queue job processing
 * ============================================================================
 *
 * Wrapper alrededor de Bull queue para:
 * - Encolar análisis
 * - Cancelar análisis
 * - Inicializar y recuperar análisis tras restart
 *
 * El procesamiento real ocurre en analysis.worker.ts
 */

import { logger } from './logger.service';
import { prisma } from './prisma.service';
import { getAnalysisQueue, initializeBullQueue, closeBullQueue } from '../config/bull.config';
import { startAnalysisWorker } from '../workers/analysis.worker';

let analysisWorker: any = null;

/**
 * Encola un análisis para procesamiento via Bull
 */
export async function enqueueAnalysis(analysisId: string, projectId: string, isIncremental: boolean = false) {
  try {
    const queue = getAnalysisQueue();

    // Crear job en Bull queue
    const job = await queue.add(
      'analyze',
      { analysisId, projectId, isIncremental },
      {
        attempts: 3, // Reintentos automáticos
        backoff: {
          type: 'exponential',
          delay: 60000, // 1 minuto
        },
        removeOnComplete: false, // Mantener histórico
        removeOnFail: false,
      }
    );

    logger.info(`📥 Análisis ${analysisId} encolado (Modo: ${isIncremental ? 'Incremental' : 'Completo'}, Job ID: ${job.id})`);

    // Registrar job en BD
    await prisma.analysisJob.upsert({
      where: { analysisId },
      update: { bullJobId: job.id, status: 'PENDING' },
      create: {
        analysisId,
        bullJobId: job.id,
        status: 'PENDING',
      },
    });

    return job;
  } catch (error) {
    logger.error(`❌ Error encolando análisis: ${error}`);
    throw error;
  }
}

/**
 * Cancelar un análisis en progreso o en cola
 */
export async function cancelAnalysis(analysisId: string): Promise<boolean> {
  try {
    const analysisJob = await prisma.analysisJob.findUnique({
      where: { analysisId },
    });

    if (!analysisJob) {
      logger.warn(`⚠️  AnalysisJob no encontrado para ${analysisId}`);
      return false;
    }

    const queue = getAnalysisQueue();
    const job = await queue.getJob(analysisJob.bullJobId);

    if (!job) {
      logger.warn(`⚠️  Job ${analysisJob.bullJobId} no encontrado en Bull queue`);
      return false;
    }

    // Remover job de la cola si está pendiente
    if (job.isPending()) {
      await job.remove();
      logger.info(`🚫 Análisis ${analysisId} removido de la cola`);
      return true;
    }

    // Si está en progreso, marcar para cancelación
    await prisma.analysis.update({
      where: { id: analysisId },
      data: { status: 'CANCELLED', progress: 0 },
    });

    logger.info(`🚫 Análisis ${analysisId} marcado para cancelación`);
    return true;
  } catch (error) {
    logger.error(`❌ Error cancelando análisis: ${error}`);
    return false;
  }
}

/**
 * Inicia el procesador de la cola Bull
 * Recupera automáticamente análisis interrumpidos tras restart
 */
export async function startAnalysisProcessor(): Promise<void> {
  try {
    // Inicializar Bull queue
    await initializeBullQueue();

    // Iniciar worker
    analysisWorker = await startAnalysisWorker();

    // Recuperar análisis atascados (quedaron en estado intermedio)
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

      if (stuck.length > 0) {
        logger.info(`♻️  Recuperando ${stuck.length} análisis atascados tras reinicio...`);

        for (const analysis of stuck) {
          try {
            // Resetear a PENDING y reenucolar
            await prisma.analysis.update({
              where: { id: analysis.id },
              data: { status: 'PENDING', progress: 0 },
            });

            await enqueueAnalysis(analysis.id, analysis.projectId);
            logger.info(`♻️  Análisis ${analysis.id} re-encolado`);
          } catch (err) {
            logger.error(`Error recuperando análisis ${analysis.id}: ${err}`);
          }
        }

        logger.info(`✓ ${stuck.length} análisis recuperados y reencolarlos`);
      }
    } catch (err) {
      logger.error(`Error recuperando análisis al iniciar: ${err}`);
    }

    logger.info('✓ Analysis queue processor iniciado (Bull + Worker)');
  } catch (error) {
    logger.error(`❌ Error iniciando processor: ${error}`);
    throw error;
  }
}

/**
 * Detener gracefully el processor (para shutdown)
 */
export async function stopAnalysisProcessor(): Promise<void> {
  try {
    if (analysisWorker) {
      await analysisWorker.close();
    }
    await closeBullQueue();
    logger.info('✓ Analysis processor detenido');
  } catch (error) {
    logger.error(`Error deteniendo processor: ${error}`);
  }
}
