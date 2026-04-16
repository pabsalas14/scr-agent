import { prisma } from './prisma.service';
import { logger } from './logger.service';
import { GitAction } from '@prisma/client';

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

      // Generar eventos forenses basados en hallazgos
      const events = this.generateMockForensicEvents(analysis);

      // Insertar eventos en la base de datos
      for (const event of events) {
        await prisma.forensicEvent.create({
          data: event,
        });
      }

      logger.info(`[Detective] Se generaron ${events.length} eventos forenses para ${analysisId}`);
    } catch (error) {
      logger.error(`[Detective] Error generando eventos forenses: ${error}`);
      // No hacer throw para no afectar el flujo del análisis
    }
  }

  /**
   * Genera eventos forenses mock basados en hallazgos
   * En una implementación real, estos vendrían del Git history
   */
  private generateMockForensicEvents(analysis: any): any[] {
    const events: any[] = [];
    const authors = ['developer1@company.com', 'developer2@company.com', 'security-team@company.com'];
    const actions: GitAction[] = ['MODIFIED', 'ADDED', 'DELETED'];
    const commits = [
      'feat: Added new authentication module',
      'fix: Security patch for password validation',
      'refactor: Updated error handling',
      'chore: Removed debug logging',
      'fix: SQL injection vulnerability in user search',
    ];

    // Generar un evento forense por cada hallazgo encontrado
    analysis.findings.forEach((finding: any, index: number) => {
      const author = authors[index % authors.length];
      const action = actions[index % actions.length];
      const commitMessage = commits[index % commits.length];

      events.push({
        analysisId: analysis.id,
        findingId: finding.id,
        commitHash: `${Math.random().toString(16).substr(2, 40)}`,
        commitMessage,
        author,
        action,
        file: finding.file,
        riskLevel: finding.severity,
        suspicionIndicators: [finding.whySuspicious || 'Automatically generated forensic indicator'],
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // últimos 7 días
      });
    });

    // Agregar algunos eventos adicionales sin hallazgo asociado (commit activity)
    for (let i = 0; i < 3; i++) {
      const author = authors[Math.floor(Math.random() * authors.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const commitMessage = commits[Math.floor(Math.random() * commits.length)];

      events.push({
        analysisId: analysis.id,
        findingId: null,
        commitHash: `${Math.random().toString(16).substr(2, 40)}`,
        commitMessage,
        author,
        action,
        file: `src/${Math.random().toString(36).substring(7)}.ts`,
        riskLevel: 'LOW',
        suspicionIndicators: ['Regular commit activity'],
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      });
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
