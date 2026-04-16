import { prisma } from './prisma.service';
import { logger } from './logger.service';
import { GitAction } from '@prisma/client';
import { gitService } from './git.service';

/**
 * Detective Service
 * Genera eventos forenses analizando Git history y cambios de código
 * En esta versión MVP, utiliza datos mock para demostración
 */
export class DetectiveService {
  /**
   * Analiza un análisis y genera eventos forenses
   */
  async generateForensicEvents(analysisId: string): Promise<void> {
    try {
      logger.info(`[Detective] Generando eventos forenses para análisis: ${analysisId}`);

      // Obtener el análisis y sus hallazgos
      const analysis = await prisma.analysis.findUnique({
        where: { id: analysisId },
        include: {
          findings: true,
          project: true,
        },
      });

      if (!analysis) {
        logger.warn(`[Detective] Análisis no encontrado: ${analysisId}`);
        return;
      }

      // Verificar si ya existen eventos forenses
      const existingEvents = await prisma.forensicEvent.count({
        where: { analysisId },
      });

      if (existingEvents > 0) {
        logger.info(`[Detective] Eventos forenses ya existen para ${analysisId}`);
        return;
      }

      // Generar eventos forenses reales basados en Git history
      const events = await this.generateRealForensicEvents(analysis);

      // Insertar eventos en la base de datos
      for (const event of events) {
        await prisma.forensicEvent.create({
          data: event,
        });
      }

      logger.info(`[Detective] Se generaron ${events.length} eventos forenses reales para ${analysisId}`);
    } catch (error) {
      logger.error(`[Detective] Error generando eventos forenses: ${error}`);
      // No hacer throw para no afectar el flujo del análisis
    }
  }

  /**
   * Genera eventos forenses reales basados en Git history
   * Obtiene el historial real de commits para cada archivo con hallazgo
   */
  private async generateRealForensicEvents(analysis: any): Promise<any[]> {
    const events: any[] = [];

    try {
      // Obtener historial de commits del repositorio completo
      const commits = await gitService.getCommitHistory(analysis.project.repositoryUrl, 100);

      // Para cada hallazgo, buscar commits que afectaron ese archivo
      for (const finding of analysis.findings) {
        try {
          const fileCommits = await gitService.getCommitsForFile(
            analysis.project.repositoryUrl,
            finding.file,
            20
          );

          // Crear eventos forenses basados en commits reales
          for (const commit of fileCommits) {
            const commitDate = new Date(commit.date);

            // Determinar acción basada en el contexto
            // El primer commit es típicamente ADDED o la versión inicial
            // Los posteriores son MODIFIED
            const isFirstCommit = fileCommits[fileCommits.length - 1] === commit;
            const action = isFirstCommit ? 'ADDED' : 'MODIFIED';

            events.push({
              analysisId: analysis.id,
              findingId: isFirstCommit ? finding.id : null, // Solo vincular el primer commit al hallazgo
              commitHash: commit.hash,
              commitMessage: commit.message,
              author: commit.author,
              action: action,
              file: finding.file,
              riskLevel: finding.severity,
              suspicionIndicators: isFirstCommit
                ? [finding.whySuspicious || 'Initial creation']
                : [`Modified by ${commit.author}`],
              timestamp: commitDate,
            });
          }
        } catch (error) {
          logger.warn(`[Detective] No se pudo obtener commits para archivo ${finding.file}: ${error}`);
          // Si no podemos obtener commits reales, generar un evento indicativo
          events.push({
            analysisId: analysis.id,
            findingId: finding.id,
            commitHash: `unknown_${Math.random().toString(16).substr(2, 8)}`,
            commitMessage: `File ${finding.file} could not be traced in Git history`,
            author: 'System',
            action: 'ADDED',
            file: finding.file,
            riskLevel: finding.severity,
            suspicionIndicators: ['File exists but history unavailable'],
            timestamp: analysis.createdAt,
          });
        }
      }

      // Ordenar eventos cronológicamente (más antiguos primero)
      events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    } catch (error) {
      logger.warn(`[Detective] Error obteniendo Git history: ${error}`);
      // Fallback: no agregar eventos si hay error con Git
    }

    return events;
  }

  /**
   * Obtiene estadísticas forenses de un análisis
   */
  async getForensicsStats(analysisId: string) {
    try {
      const [totalEvents, criticalEvents, affectedAuthors, affectedFiles] = await Promise.all([
        prisma.forensicEvent.count({ where: { analysisId } }),
        prisma.forensicEvent.count({
          where: { analysisId, riskLevel: { in: ['CRITICAL', 'HIGH'] } },
        }),
        prisma.forensicEvent.findMany({
          where: { analysisId },
          distinct: ['author'],
          select: { author: true },
        }),
        prisma.forensicEvent.findMany({
          where: { analysisId },
          distinct: ['file'],
          select: { file: true },
        }),
      ]);

      return {
        totalEvents,
        criticalEvents,
        affectedAuthors: affectedAuthors.length,
        affectedFiles: affectedFiles.length,
      };
    } catch (error) {
      logger.error(`[Detective] Error obteniendo estadísticas: ${error}`);
      return {
        totalEvents: 0,
        criticalEvents: 0,
        affectedAuthors: 0,
        affectedFiles: 0,
      };
    }
  }
}

export const detectiveService = new DetectiveService();
