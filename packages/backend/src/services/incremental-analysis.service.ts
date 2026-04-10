/**
 * ============================================================================
 * INCREMENTAL ANALYSIS SERVICE
 * ============================================================================
 *
 * Servicio para optimizar análisis permitiendo procesar solo commits nuevos
 * Evita re-analizar código que ya fue analizado anteriormente
 */

import { logger } from './logger.service';
import { gitService } from './git.service';
import { prisma } from './prisma.service';

/**
 * Obtener commits nuevos desde el último análisis exitoso
 * @param repositoryUrl - URL del repositorio
 * @param lastCommitSha - SHA del último commit procesado (si existe)
 * @param maxCommits - Máximo de commits a retornar
 * @returns Array de commits nuevos
 */
export async function getNewCommits(
  repositoryUrl: string,
  lastCommitSha?: string,
  maxCommits: number = 50
) {
  try {
    // Obtener historial completo
    const allCommits = await gitService.getCommitHistory(repositoryUrl, maxCommits);

    if (!lastCommitSha || !allCommits.length) {
      logger.info(`📊 Primer análisis: procesando todos los ${allCommits.length} commits`);
      return allCommits;
    }

    // Filtrar commits posteriores al último procesado
    const lastProcessedIndex = allCommits.findIndex(c => c.hash === lastCommitSha);

    if (lastProcessedIndex === -1) {
      logger.warn(`⚠️  Último commit ${lastCommitSha} no encontrado en historial`);
      logger.warn(`📊 Realizando análisis completo por seguridad`);
      return allCommits;
    }

    // Retornar solo commits nuevos (anteriores al último procesado en el historial)
    const newCommits = allCommits.slice(0, lastProcessedIndex);

    logger.info(
      `📊 Análisis incremental: ${newCommits.length} commits nuevos desde ${lastCommitSha.substring(0, 7)}`
    );

    return newCommits;
  } catch (error) {
    logger.error(`❌ Error en getNewCommits: ${error}`);
    // Fallback a análisis completo en caso de error
    const allCommits = await gitService.getCommitHistory(repositoryUrl, maxCommits);
    return allCommits;
  }
}

/**
 * Actualizar lastCommitProcessed tras análisis exitoso
 * @param analysisId - ID del análisis
 * @param commitSha - SHA del último commit procesado
 */
export async function updateLastProcessedCommit(analysisId: string, commitSha: string) {
  try {
    await prisma.analysis.update({
      where: { id: analysisId },
      data: { lastCommitProcessed: commitSha },
    });
    logger.info(`✓ Última posición actualizada: ${commitSha.substring(0, 7)}`);
  } catch (error) {
    logger.error(`Error actualizando lastCommitProcessed: ${error}`);
  }
}

/**
 * Obtener la última posición de análisis exitoso para un proyecto
 * @param projectId - ID del proyecto
 * @returns lastCommitProcessed o null si no hay análisis previos
 */
export async function getLastAnalysisPosition(projectId: string): Promise<string | null> {
  try {
    const lastAnalysis = await prisma.analysis.findFirst({
      where: {
        projectId,
        status: 'COMPLETED',
      },
      select: { lastCommitProcessed: true },
      orderBy: { createdAt: 'desc' },
    });

    return lastAnalysis?.lastCommitProcessed || null;
  } catch (error) {
    logger.error(`Error obteniendo última posición: ${error}`);
    return null;
  }
}

/**
 * Check si un análisis debe ser incremental
 * @param projectId - ID del proyecto
 * @returns true si hay análisis previos exitosos
 */
export async function shouldBeIncremental(projectId: string): Promise<boolean> {
  try {
    const hasCompleted = await prisma.analysis.findFirst({
      where: {
        projectId,
        status: 'COMPLETED',
      },
      select: { id: true },
    });

    return !!hasCompleted;
  } catch (error) {
    logger.error(`Error en shouldBeIncremental: ${error}`);
    return false;
  }
}
