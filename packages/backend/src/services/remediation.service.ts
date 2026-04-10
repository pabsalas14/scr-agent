/**
 * ============================================================================
 * REMEDIATION SERVICE - Gestión de remediación de hallazgos
 * ============================================================================
 *
 * Maneja el ciclo completo: crear remediación → asignar → comentar → validar fix
 */

import { logger } from './logger.service';
import { prisma } from './prisma.service';
import { RemediationStatus } from '@prisma/client';

export interface CreateRemediationInput {
  findingId: string;
  title?: string;
  description?: string;
  assigneeId?: string;
  dueDate?: Date;
  priority?: number;
}

export interface UpdateRemediationInput {
  status?: RemediationStatus;
  title?: string;
  description?: string;
  assigneeId?: string;
  dueDate?: Date;
  priority?: number;
  evidence?: {
    commitSha?: string;
    prUrl?: string;
    description?: string;
  };
  comment?: string;
}

/**
 * Crear remediación para un hallazgo
 */
export async function createRemediation(input: CreateRemediationInput) {
  try {
    // Verificar que el hallazgo existe
    const finding = await prisma.finding.findUnique({
      where: { id: input.findingId },
    });

    if (!finding) {
      throw new Error(`Finding ${input.findingId} no encontrado`);
    }

    // Crear remediación
    const remediation = await prisma.remediationAction.create({
      data: {
        findingId: input.findingId,
        title: input.title,
        description: input.description,
        assigneeId: input.assigneeId,
        dueDate: input.dueDate,
        priority: input.priority || 0,
        status: 'PENDING',
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        comments: true,
      },
    });

    logger.info(`✓ Remediación creada para hallazgo ${input.findingId}`);

    return remediation;
  } catch (error) {
    logger.error(`Error creando remediación: ${error}`);
    throw error;
  }
}

/**
 * Actualizar remediación
 */
export async function updateRemediation(remediationId: string, input: UpdateRemediationInput) {
  try {
    // Validar transiciones de estado
    if (input.status) {
      const current = await prisma.remediationAction.findUnique({
        where: { id: remediationId },
        select: { status: true },
      });

      if (current) {
        validateStatusTransition(current.status, input.status);
      }
    }

    const updateData: any = {
      status: input.status,
      title: input.title,
      description: input.description,
      assigneeId: input.assigneeId,
      dueDate: input.dueDate,
      priority: input.priority,
    };

    // Si se completó o verificó, registrar fecha
    if (input.status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }
    if (input.status === 'VERIFIED') {
      updateData.verifiedAt = new Date();
    }

    // Si hay evidencia, guardarla
    if (input.evidence) {
      updateData.evidence = input.evidence;
    }

    // Guardar comentario si existe
    if (input.comment) {
      updateData.comment = input.comment;
    }

    const remediation = await prisma.remediationAction.update({
      where: { id: remediationId },
      data: updateData,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        comments: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    logger.info(`✓ Remediación ${remediationId} actualizada a estado ${input.status}`);

    return remediation;
  } catch (error) {
    logger.error(`Error actualizando remediación: ${error}`);
    throw error;
  }
}

/**
 * Obtener remediación completa
 */
export async function getRemediation(remediationId: string) {
  try {
    const remediation = await prisma.remediationAction.findUnique({
      where: { id: remediationId },
      include: {
        finding: {
          select: {
            id: true,
            severity: true,
            riskType: true,
            file: true,
            whySuspicious: true,
          },
        },
        assignee: { select: { id: true, name: true, email: true } },
        comments: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return remediation;
  } catch (error) {
    logger.error(`Error obteniendo remediación: ${error}`);
    return null;
  }
}

/**
 * Agregar comentario a remediación
 */
export async function addComment(remediationId: string, userId: string, content: string) {
  try {
    const comment = await prisma.remediationComment.create({
      data: {
        remediationId,
        userId,
        content,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    logger.info(`✓ Comentario agregado a remediación ${remediationId}`);

    return comment;
  } catch (error) {
    logger.error(`Error agregando comentario: ${error}`);
    throw error;
  }
}

/**
 * Listar remediaciones con filtros
 */
export async function listRemediations(options?: {
  status?: RemediationStatus;
  assigneeId?: string;
  overdue?: boolean;
  limit?: number;
  offset?: number;
}) {
  try {
    const limit = Math.min(options?.limit || 50, 200);
    const offset = options?.offset || 0;

    const where: any = {};

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.assigneeId) {
      where.assigneeId = options.assigneeId;
    }

    // Overdue: dueDate < now y status != completed/verified
    if (options?.overdue) {
      where.AND = [
        { dueDate: { lt: new Date() } },
        { status: { notIn: ['COMPLETED', 'VERIFIED'] } },
      ];
    }

    const [remediations, total] = await Promise.all([
      prisma.remediationAction.findMany({
        where,
        include: {
          finding: { select: { id: true, severity: true, file: true } },
          assignee: { select: { id: true, name: true } },
        },
        orderBy: { dueDate: 'asc' },
        skip: offset,
        take: limit,
      }),
      prisma.remediationAction.count({ where }),
    ]);

    return { remediations, total, limit, offset };
  } catch (error) {
    logger.error(`Error listando remediaciones: ${error}`);
    return { remediations: [], total: 0, limit: 50, offset: 0 };
  }
}

/**
 * Validar transiciones de estado permitidas
 */
function validateStatusTransition(current: RemediationStatus, next: RemediationStatus) {
  const allowed: Record<RemediationStatus, RemediationStatus[]> = {
    PENDING: ['IN_PROGRESS', 'REJECTED'],
    IN_PROGRESS: ['COMPLETED', 'REJECTED'],
    COMPLETED: ['VERIFIED', 'REJECTED'],
    VERIFIED: [],
    REJECTED: ['PENDING'], // Puede reintentar desde REJECTED
  };

  if (!allowed[current]?.includes(next)) {
    throw new Error(
      `Transición inválida: ${current} → ${next}. Transiciones permitidas desde ${current}: ${allowed[current].join(', ')}`
    );
  }
}

/**
 * Obtener estadísticas de remediación
 */
export async function getRemediationStats() {
  try {
    const [
      totalRemediations,
      byStatus,
      overdueCount,
      avgTimeToCompletion,
    ] = await Promise.all([
      prisma.remediationAction.count(),
      prisma.remediationAction.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.remediationAction.count({
        where: {
          AND: [
            { dueDate: { lt: new Date() } },
            { status: { notIn: ['COMPLETED', 'VERIFIED'] } },
          ],
        },
      }),
      // Tiempo promedio (en días) de PENDING a COMPLETED
      prisma.$queryRaw`
        SELECT AVG(EXTRACT(DAY FROM (completedAt - createdAt))) as avg_days
        FROM remediation_actions
        WHERE status = 'COMPLETED' AND completedAt IS NOT NULL
      ` as Promise<[{ avg_days: number }]>,
    ]);

    return {
      total: totalRemediations,
      byStatus: Object.fromEntries(byStatus.map(s => [s.status, s._count.id])),
      overdue: overdueCount,
      avgTimeToCompletionDays: Math.round((await avgTimeToCompletion)[0]?.avg_days || 0),
    };
  } catch (error) {
    logger.error(`Error obteniendo stats: ${error}`);
    return null;
  }
}
