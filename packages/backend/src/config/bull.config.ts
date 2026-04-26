/**
 * ============================================================================
 * BULL QUEUE CONFIGURATION
 * ============================================================================
 *
 * Configuración para Bull/BullMQ - Queue de análisis distribuida
 * Con persistencia en Redis y soporte para análisis concurrentes
 */

import { Queue, QueueEvents } from 'bullmq';
import { logger } from '../services/logger.service';

// Configurar conexión a Redis desde variables de entorno
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const ANALYSIS_CONCURRENCY = parseInt(process.env.ANALYSIS_CONCURRENCY || '3', 10);
const QUEUE_NAME = process.env.ANALYSIS_QUEUE_NAME || 'scr-analysis-queue';

// Parsear URL de Redis
const redisConnection = parseRedisUrl(REDIS_URL);

interface RedisConnection {
  host: string;
  port: number;
  username?: string;
  password?: string;
}

function parseRedisUrl(url: string): RedisConnection {
  const match = url.match(/redis:\/\/(?:([^:@]+):([^@]+)@)?([^:]+):(\d+)/);
  if (!match) {
    logger.warn('⚠️  Redis URL inválida, usando localhost:6379');
    return {
      host: 'localhost',
      port: 6379,
    };
  }
  return {
    host: match[3],
    port: parseInt(match[4], 10),
    username: match[1],
    password: match[2],
  };
}

// Instancia de Queue (se crea sin worker inicialmente)
export let analysisQueue: Queue | null = null;

/**
 * Inicializar y conectar a Bull Queue
 * Llamar desde index.ts al startup del servidor
 */
export async function initializeBullQueue(): Promise<Queue> {
  try {
    analysisQueue = new Queue(QUEUE_NAME, {
      connection: redisConnection,
    });

    // Event listeners via QueueEvents (correcto para BullMQ v5)
    const queueEvents = new QueueEvents(QUEUE_NAME, {
      connection: redisConnection,
    });

    queueEvents.on('error', (err) => {
      logger.error('Bull Queue error', err);
    });

    queueEvents.on('waiting', ({ jobId }) => {
      logger.debug(`📥 Job ${jobId} agregado a la queue`);
    });

    queueEvents.on('active', ({ jobId }) => {
      logger.debug(`▶️  Job ${jobId} iniciado`);
    });

    queueEvents.on('completed', ({ jobId }) => {
      logger.info(`✅ Job ${jobId} completado`);
    });

    queueEvents.on('failed', ({ jobId, failedReason }) => {
      logger.error(`❌ Job ${jobId} falló: ${failedReason}`);
    });

    logger.info(`✓ Bull Queue inicializada en Redis: ${REDIS_URL}`);
    logger.info(`✓ Concurrencia máxima: ${ANALYSIS_CONCURRENCY} análisis simultáneos`);

    return analysisQueue;
  } catch (error) {
    logger.error('Error inicializando Bull Queue', error);
    throw error;
  }
}

/**
 * Cerrar conexión a Bull Queue (para graceful shutdown)
 */
export async function closeBullQueue() {
  if (analysisQueue) {
    await analysisQueue.close();
    logger.info('✓ Bull Queue conexión cerrada');
  }
}

/**
 * Obtener instancia de Queue
 */
export function getAnalysisQueue() {
  if (!analysisQueue) {
    throw new Error('Bull Queue no inicializado. Llamar a initializeBullQueue() primero');
  }
  return analysisQueue;
}

export { QUEUE_NAME, ANALYSIS_CONCURRENCY };
