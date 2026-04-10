/**
 * ============================================================================
 * TIMELINE VISUALIZATION SERVICE - Preparación de datos para visualización
 * ============================================================================
 *
 * Formatea eventos forenses y acciones de remediación para:
 * - Timeline interactivos
 * - Gráficos de actividad
 * - Análisis históricos
 */

import { logger } from './logger.service';
import { prisma } from './prisma.service';

export interface TimelineEvent {
  id: string;
  type: 'forensic' | 'remediation' | 'analysis' | 'status_change';
  timestamp: Date;
  title: string;
  description: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  relatedId: string;
  relatedType: string;
  metadata?: Record<string, any>;
}

export interface TimelineGroup {
  date: string;
  events: TimelineEvent[];
  eventCount: number;
  severityBreakdown: Record<string, number>;
}

export interface AnalysisTimeline {
  analysisId: string;
  projectName: string;
  startDate: Date;
  endDate: Date;
  status: string;
  timeline: TimelineGroup[];
  summary: {
    totalEvents: number;
    totalFindings: number;
    totalRemediations: number;
    criticalCount: number;
    highCount: number;
  };
}

/**
 * Obtener timeline de eventos forenses para análisis
 */
export async function getAnalysisTimeline(analysisId: string): Promise<AnalysisTimeline | null> {
  try {
    // Obtener análisis
    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      include: {
        project: { select: { name: true } },
      },
    });

    if (!analysis) {
      return null;
    }

    // Obtener eventos forenses
    const forensicEvents = await prisma.forensicEvent.findMany({
      where: { analysisId },
      include: {
        finding: { select: { severity: true, riskType: true } },
      },
      orderBy: { timestamp: 'asc' },
    });

    // Obtener hallazgos
    const findings = await prisma.finding.findMany({
      where: { analysisId },
      select: { id: true, createdAt: true, severity: true },
    });

    // Obtener remediaciones
    const remediations = await prisma.remediationAction.findMany({
      where: { finding: { analysisId } },
      select: { id: true, createdAt: true, completedAt: true, status: true },
    });

    // Construir timeline de eventos
    const timelineEvents: TimelineEvent[] = [];

    // Agregar eventos forenses
    forensicEvents.forEach(event => {
      timelineEvents.push({
        id: event.id,
        type: 'forensic',
        timestamp: event.timestamp,
        title: `${event.finding?.riskType || 'Unknown'} detected`,
        description: `Event detected by forensic analysis`,
        severity: event.finding?.severity as any,
        relatedId: event.findingId,
        relatedType: 'finding',
        metadata: {
          author: event.author,
          file: event.file,
        },
      });
    });

    // Agregar creación de hallazgos
    findings.forEach(finding => {
      timelineEvents.push({
        id: `finding-${finding.id}`,
        type: 'analysis',
        timestamp: finding.createdAt,
        title: 'Finding created',
        description: `Finding recorded in analysis`,
        severity: finding.severity as any,
        relatedId: finding.id,
        relatedType: 'finding',
      });
    });

    // Agregar remediaciones
    remediations.forEach(remediation => {
      timelineEvents.push({
        id: `remediation-${remediation.id}`,
        type: 'remediation',
        timestamp: remediation.createdAt,
        title: 'Remediation initiated',
        description: `Remediation action started (${remediation.status})`,
        relatedId: remediation.id,
        relatedType: 'remediation',
      });

      if (remediation.completedAt) {
        timelineEvents.push({
          id: `remediation-complete-${remediation.id}`,
          type: 'status_change',
          timestamp: remediation.completedAt,
          title: 'Remediation completed',
          description: 'Remediation action completed',
          relatedId: remediation.id,
          relatedType: 'remediation',
        });
      }
    });

    // Agrupar por fecha
    const groupedByDate = new Map<string, TimelineEvent[]>();
    timelineEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    timelineEvents.forEach(event => {
      const dateStr = event.timestamp.toISOString().split('T')[0];
      if (!groupedByDate.has(dateStr)) {
        groupedByDate.set(dateStr, []);
      }
      groupedByDate.get(dateStr)!.push(event);
    });

    // Construir grupos con estadísticas
    const timelineGroups: TimelineGroup[] = [];
    let criticalCount = 0,
      highCount = 0;

    Array.from(groupedByDate.entries())
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .forEach(([date, events]) => {
        const severityBreakdown = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };

        events.forEach(event => {
          if (event.severity) {
            severityBreakdown[event.severity]++;
          }
          if (event.severity === 'CRITICAL') criticalCount++;
          if (event.severity === 'HIGH') highCount++;
        });

        timelineGroups.push({
          date,
          events,
          eventCount: events.length,
          severityBreakdown,
        });
      });

    return {
      analysisId,
      projectName: analysis.project.name,
      startDate: analysis.createdAt,
      endDate: analysis.updatedAt,
      status: analysis.status,
      timeline: timelineGroups,
      summary: {
        totalEvents: timelineEvents.length,
        totalFindings: findings.length,
        totalRemediations: remediations.length,
        criticalCount,
        highCount,
      },
    };
  } catch (error) {
    logger.error(`Error obteniendo análisis timeline: ${error}`);
    return null;
  }
}

/**
 * Obtener timeline de usuario (actividad en múltiples análisis)
 */
export async function getUserActivityTimeline(
  userId: string,
  options?: {
    limit?: number;
    severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    startDate?: Date;
    endDate?: Date;
  }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user?.email) {
      return [];
    }

    const limit = Math.min(options?.limit || 100, 500);
    const where: any = { author: user.email };

    if (options?.severity) {
      where.riskLevel = options.severity;
    }

    if (options?.startDate || options?.endDate) {
      where.timestamp = {};
      if (options?.startDate) where.timestamp.gte = options.startDate;
      if (options?.endDate) where.timestamp.lte = options.endDate;
    }

    const events = await prisma.forensicEvent.findMany({
      where,
      include: {
        analysis: {
          select: {
            id: true,
            project: { select: { name: true } },
          },
        },
        finding: { select: { severity: true, riskType: true, file: true } },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return events.map(event => ({
      id: event.id,
      timestamp: event.timestamp,
      type: 'forensic',
      project: event.analysis?.project.name || 'Unknown',
      analysisId: event.analysisId,
      severity: event.finding?.severity,
      riskType: event.finding?.riskType,
      file: event.finding?.file,
      author: event.author,
      metadata: {
        commit: event.commit,
        author: event.author,
      },
    }));
  } catch (error) {
    logger.error(`Error obteniendo user activity timeline: ${error}`);
    return [];
  }
}

/**
 * Obtener timeline de remediaciones
 */
export async function getRemediationTimeline(options?: {
  findingId?: string;
  userId?: string;
  status?: string;
  limit?: number;
}) {
  try {
    const where: any = {};

    if (options?.findingId) {
      where.findingId = options.findingId;
    }

    if (options?.userId) {
      where.assigneeId = options.userId;
    }

    if (options?.status) {
      where.status = options.status;
    }

    const limit = Math.min(options?.limit || 50, 200);

    const remediations = await prisma.remediationAction.findMany({
      where,
      include: {
        finding: {
          select: {
            severity: true,
            riskType: true,
            file: true,
            analysis: { select: { project: { select: { name: true } } } },
          },
        },
        assignee: { select: { name: true, email: true } },
        comments: { select: { createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return remediations.map(rem => ({
      id: rem.id,
      findingId: rem.findingId,
      title: rem.title,
      status: rem.status,
      severity: rem.finding?.severity,
      riskType: rem.finding?.riskType,
      project: rem.finding?.analysis?.project.name,
      assignee: rem.assignee?.name,
      createdAt: rem.createdAt,
      dueDate: rem.dueDate,
      completedAt: rem.completedAt,
      verifiedAt: rem.verifiedAt,
      commentCount: rem.comments.length,
      timeline: {
        created: rem.createdAt,
        completed: rem.completedAt,
        verified: rem.verifiedAt,
      },
    }));
  } catch (error) {
    logger.error(`Error obteniendo remediation timeline: ${error}`);
    return [];
  }
}

/**
 * Obtener estadísticas de timeline para período
 */
export async function getTimelineStats(options?: {
  startDate?: Date;
  endDate?: Date;
  projectId?: string;
}) {
  try {
    const where: any = {};

    if (options?.startDate || options?.endDate) {
      where.timestamp = {};
      if (options?.startDate) where.timestamp.gte = options.startDate;
      if (options?.endDate) where.timestamp.lte = options.endDate;
    }

    if (options?.projectId) {
      where.analysis = { projectId: options.projectId };
    }

    const [
      totalEvents,
      bySeverity,
      byRiskType,
      uniqueAuthors,
      uniqueProjects,
    ] = await Promise.all([
      prisma.forensicEvent.count({ where }),
      prisma.forensicEvent.groupBy({
        by: ['riskLevel'],
        where,
        _count: { id: true },
      }),
      prisma.forensicEvent.groupBy({
        by: ['riskLevel'],
        where,
        _count: { id: true },
      }),
      prisma.forensicEvent.findMany({
        where,
        distinct: ['author'],
        select: { author: true },
      }),
      prisma.forensicEvent.findMany({
        where,
        distinct: ['analysisId'],
        select: { analysisId: true },
      }),
    ]);

    return {
      period: {
        start: options?.startDate,
        end: options?.endDate,
      },
      totalEvents,
      bySeverity: Object.fromEntries(bySeverity.map(s => [s.riskLevel, s._count.id])),
      uniqueAuthorsCount: uniqueAuthors.length,
      uniqueProjectsCount: uniqueProjects.length,
    };
  } catch (error) {
    logger.error(`Error obteniendo timeline stats: ${error}`);
    return null;
  }
}
