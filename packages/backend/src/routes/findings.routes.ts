import { Router, type Request, type Response, type Router as ExpressRouter } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { findingsService } from '../services/findings.service';
import { usersService } from '../services/users.service';
import { notificationsService } from '../services/notifications.service';
import { socketService } from '../services/socket.service';
import { logger } from '../services/logger.service';
import { prisma } from '../services/prisma.service';

const router: ExpressRouter = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * GET /api/v1/findings/global
 * Get all findings across all analyses/projects for the current user
 */
router.get('/global', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    // BUG FIX #5: Authorization bypass - require authentication
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required. Please provide a valid user token.'
      });
    }

    const pageParam = req.query['page'] as string | undefined;
    const page = Math.max(1, parseInt(pageParam || '1') || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query['limit'] as string) || 50));
    const skip = (page - 1) * limit;

    // Optional filters
    const severityParam = req.query['severity'] as string | undefined;
    const isIncidentParam = req.query['isIncident'] === 'true'; // True for High/Critical OR tracking

    const where: any = {
      // All users see all findings (public data)
    };

    if (severityParam) {
      where.severity = severityParam;
    }

    if (isIncidentParam) {
        where.OR = [
            { severity: { in: ['CRITICAL', 'HIGH'] } },
            { assignment: { isNot: null } },
            { remediation: { isNot: null } }
        ];
    }

    const [findings, total] = await Promise.all([
      prisma.finding.findMany({
        where,
        include: {
          analysis: {
            select: {
              id: true,
              project: { select: { id: true, name: true } },
            }
          },
          statusHistory: { orderBy: { createdAt: 'desc' }, take: 1 },
          assignment: { include: { assignedUser: { select: { id: true, name: true, email: true } } } },
          remediation: true,
        },
        orderBy: [
            { createdAt: 'desc' }
        ],
        skip,
        take: limit,
      }),
      prisma.finding.count({ where }),
    ]);

    res.json({
      success: true,
      data: findings,
      total,
      page,
      limit,
      hasMore: skip + findings.length < total,
    });
  } catch (error) {
    logger.error('Error fetching global findings:', error);
    res.status(500).json({ success: false, error: 'Error fetching global findings' });
  }
});

/**
 * GET /api/v1/findings/analysis/:analysisId
 * Get all findings for an analysis
 */
router.get('/analysis/:analysisId', async (req: Request, res: Response) => {
  try {
    const { analysisId } = req.params;
    const pageParam = req.query['page'] as string | undefined;

    if (pageParam) {
      const page = Math.max(1, parseInt(pageParam) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query['limit'] as string) || 50));
      const result = await findingsService.getFindings(analysisId!, { page, limit });
      res.json({ success: true, ...(result as object) });
    } else {
      const findings = await findingsService.getFindings(analysisId!);
      res.json({ success: true, data: findings });
    }
  } catch (error) {
    logger.error('Error fetching findings:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching findings',
    });
  }
});

/**
 * GET /api/v1/findings/:findingId
 * Get finding detail with full history
 */
router.get('/:findingId', async (req: Request, res: Response) => {
  try {
    const { findingId } = req.params;
    const finding = await findingsService.getFindingDetail(findingId!);

    if (!finding) {
      return res.status(404).json({
        success: false,
        error: 'Finding not found',
      });
    }

    res.json({
      success: true,
      data: finding,
    });
  } catch (error) {
    logger.error('Error fetching finding detail:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching finding',
    });
  }
});

/**
 * PUT /api/v1/findings/:findingId/status
 * Update finding status with history tracking
 */
router.put('/:findingId/status', async (req: Request, res: Response) => {
  try {
    const { findingId } = req.params;
    const { status, note, notes } = req.body;
    const resolvedNote = note ?? notes; // Accept both 'note' and 'notes' from frontend
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    if (!status || typeof status !== 'string') {
      return res.status(400).json({ success: false, error: 'status (string) es requerido' });
    }

    if (resolvedNote !== undefined && typeof resolvedNote !== 'string') {
      return res.status(400).json({ success: false, error: 'note debe ser string' });
    }

    // Map frontend status labels to backend enum values
    const STATUS_MAP: Record<string, string> = {
      'OPEN': 'DETECTED',
      'IN_PROGRESS': 'IN_CORRECTION',
      'RESOLVED': 'CORRECTED',
      'CLOSED': 'CLOSED',
    };

    // Resolve mapped status or use raw value if already valid
    const resolvedStatus = STATUS_MAP[status] ?? status;

    // Validate resolved status
    const validStatuses = [
      'DETECTED',
      'IN_REVIEW',
      'IN_CORRECTION',
      'CORRECTED',
      'VERIFIED',
      'FALSE_POSITIVE',
      'CLOSED',
    ];

    if (!validStatuses.includes(resolvedStatus)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status: "${status}". Valid values: ${validStatuses.join(', ')} (or frontend aliases: OPEN, IN_PROGRESS, RESOLVED, CLOSED)`,
      });
    }

    const updated = await findingsService.updateFindingStatus(
      findingId!,
      resolvedStatus as any,
      userId!,
      resolvedNote
    );

    // Get user info for notification
    const user = await usersService.getUserDetail(userId);

    // Get finding's assigned user for notification
    if ((updated as any).assignment?.assignedTo) {
      await notificationsService.notifyFindingStatusChange(
        (updated as any).assignment.assignedTo,
        findingId!,
        resolvedStatus as any,
        (user as any)?.name || (user as any)?.email || 'Sistema'
      );

      // Emit WebSocket event for real-time update
      socketService.emitFindingStatusChanged(
        findingId!,
        status,
        (updated as any).assignment.assignedTo
      );
    }

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    logger.error('Error updating finding status:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating finding status',
    });
  }
});

/**
 * POST /api/v1/findings/:findingId/assign
 * Assign finding to a user
 */
router.post('/:findingId/assign', async (req: Request, res: Response) => {
  try {
    const { findingId } = req.params;
    const { assignedTo } = req.body;
    const userId = (req as any).user?.id;

    if (!assignedTo) {
      return res.status(400).json({
        success: false,
        error: 'assignedTo is required',
      });
    }

    const assignment = await findingsService.assignFinding(findingId!, assignedTo);

    // Get assigner info for notification
    const assigner = userId ? await usersService.getUserDetail(userId) : null;

    // Notify assigned user
    await notificationsService.notifyFindingAssignment(
      assignedTo,
      findingId!,
      (assigner as any)?.name || (assigner as any)?.email || 'Sistema'
    );

    // Emit WebSocket event for real-time update
    socketService.emitFindingAssigned(
      findingId!,
      assignedTo,
      userId || 'Sistema'
    );

    res.json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    logger.error('Error assigning finding:', error);
    res.status(500).json({
      success: false,
      error: 'Error assigning finding',
    });
  }
});

/**
 * DELETE /api/v1/findings/:findingId/assign
 * Unassign finding from user
 */
router.delete('/:findingId/assign', async (req: Request, res: Response) => {
  try {
    const { findingId } = req.params;

    await findingsService.unassignFinding(findingId!);

    res.json({
      success: true,
      message: 'Finding unassigned successfully',
    });
  } catch (error) {
    logger.error('Error unassigning finding:', error);
    res.status(500).json({
      success: false,
      error: 'Error unassigning finding',
    });
  }
});

/**
 * GET /api/v1/findings/:findingId/remediation
 * Get remediation details for a finding
 */
router.get('/:findingId/remediation', async (req: Request, res: Response) => {
  try {
    const { findingId } = req.params;
    const remediation = await findingsService.getRemediationDetail(findingId!);

    res.json({
      success: true,
      data: remediation,
    });
  } catch (error) {
    logger.error('Error fetching remediation:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching remediation',
    });
  }
});

/**
 * POST /api/v1/findings/:findingId/remediation
 * Create or update remediation entry
 */
router.post('/:findingId/remediation', async (req: Request, res: Response) => {
  try {
    const { findingId } = req.params;
    const { correctionNotes, proofOfFixUrl, status } = req.body;
    const userId = (req as any).user?.id;

    if (!correctionNotes && !proofOfFixUrl) {
      return res.status(400).json({
        success: false,
        error: 'At least correctionNotes or proofOfFixUrl is required',
      });
    }

    const remediation = await findingsService.createOrUpdateRemediation(
      findingId!,
      {
        correctionNotes,
        proofOfFixUrl,
        status: (status || 'IN_PROGRESS') as any,
      }
    );

    // Get user info for notification
    const user = userId ? await usersService.getUserDetail(userId) : null;

    // Get finding's assigned user for notification
    const finding = await findingsService.getFindingDetail(findingId!);
    if ((finding as any)?.assignment?.assignedTo && user) {
      await notificationsService.notifyRemediationUpdate(
        (finding as any).assignment.assignedTo,
        findingId!,
        'IN_PROGRESS' as any,
        (user as any)?.name || (user as any)?.email || 'Sistema'
      );

      // Emit WebSocket event for real-time update
      socketService.emitRemediationUpdated(
        findingId!,
        (finding as any).assignment.assignedTo
      );
    }

    res.json({
      success: true,
      data: remediation,
    });
  } catch (error) {
    logger.error('Error creating/updating remediation:', error);
    res.status(500).json({
      success: false,
      error: 'Error processing remediation',
    });
  }
});

/**
 * PUT /api/v1/findings/:findingId/remediation/verify
 * Verify remediation as complete
 */
router.put('/:findingId/remediation/verify', async (req: Request, res: Response) => {
  try {
    const { findingId } = req.params;
    const { verificationNotes } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const remediation = await findingsService.createOrUpdateRemediation(
      findingId!,
      {
        status: 'VERIFIED' as any,
        verifiedAt: new Date(),
        verificationNotes,
      }
    );

    // Update finding status to VERIFIED
    const user = await usersService.getUserDetail(userId!);
    await findingsService.updateFindingStatus(
      findingId!,
      'VERIFIED' as any,
      userId!,
      'Remediación verificada'
    );

    // Notify assigned user
    const finding = await findingsService.getFindingDetail(findingId!);
    if ((finding as any)?.assignment?.assignedTo) {
      await notificationsService.notifyRemediationVerified(
        (finding as any).assignment.assignedTo,
        findingId!,
        (user as any)?.name || (user as any)?.email || 'Sistema'
      );

      // Emit WebSocket event for real-time update
      socketService.emitRemediationVerified(
        findingId!,
        (finding as any).assignment.assignedTo
      );
    }

    res.json({
      success: true,
      data: remediation,
    });
  } catch (error) {
    logger.error('Error verifying remediation:', error);
    res.status(500).json({
      success: false,
      error: 'Error verifying remediation',
    });
  }
});

/**
 * GET /api/v1/findings/analysis/:analysisId/stats
 * Get findings statistics for an analysis
 */
router.get('/analysis/:analysisId/stats', async (req: Request, res: Response) => {
  try {
    const { analysisId } = req.params;
    const stats = await findingsService.getFindingsStats(analysisId!);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error fetching findings stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching stats',
    });
  }
});

/**
 * GET /api/v1/findings/analysis/:analysisId/export
 * Export findings as CSV (with pagination to avoid memory issues)
 *
 * BUG FIX #8: Implement pagination for large CSV exports
 * - Limits per-request to 1000 findings
 * - Streams response instead of loading all in memory
 * - Supports ?page= and ?limit= parameters
 */
router.get('/analysis/:analysisId/export', async (req: Request, res: Response) => {
  try {
    const { analysisId } = req.params;
    const limit = Math.min(1000, Math.max(100, parseInt(req.query.limit as string) || 1000)); // Max 1000 per request
    const page = Math.max(1, parseInt(req.query.page as string) || 1);

    // Get findings with pagination
    const result = await findingsService.getFindings(analysisId!, {
      page,
      limit,
    });

    const rows = Array.isArray(result) ? result : (result as any).data ?? [];

    const escape = (v: unknown) => {
      const s = String(v ?? '').replace(/"/g, '""');
      return `"${s}"`;
    };

    const headers = [
      'ID',
      'Archivo',
      'Función',
      'Líneas',
      'Severidad',
      'Tipo',
      'Confianza',
      'Estado',
      'Por qué sospechoso',
    ];

    // Start CSV with BOM
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="findings-${analysisId}-${page}.csv"`);
    res.write('\uFEFF' + headers.map(escape).join(',') + '\r\n');

    // Stream each row instead of building in memory
    for (const f of rows as Record<string, unknown>[]) {
      const currentStatus =
        Array.isArray(f['statusHistory']) && (f['statusHistory'] as { status: string }[]).length > 0
          ? (f['statusHistory'] as { status: string }[])[0]!.status
          : 'DETECTED';

      const row = [
        f['id'],
        f['file'],
        f['function'] ?? '',
        f['lineRange'] ?? '',
        f['severity'],
        f['riskType'],
        typeof f['confidence'] === 'number' ? (f['confidence'] * 100).toFixed(0) + '%' : '',
        currentStatus,
        f['whySuspicious'],
      ]
        .map(escape)
        .join(',');

      res.write(row + '\r\n');
    }

    // If more pages available, indicate in response header
    const totalPages = (result as any).total ? Math.ceil((result as any).total / limit) : 1;
    if (page < totalPages) {
      res.setHeader('X-Next-Page', page + 1);
      res.setHeader('X-Total-Pages', totalPages);
    }

    res.end();
  } catch (error) {
    logger.error('Error exporting findings CSV:', error);
    res.status(500).json({ success: false, error: 'Error exporting findings' });
  }
});

/**
 * POST /api/v1/findings/:findingId/chat
 * Chat with AI agent about a specific finding (Inteligencia Explicativa)
 */
router.post('/:findingId/chat', async (req: Request, res: Response) => {
  try {
    const { findingId } = req.params;
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ success: false, error: 'Question is required' });
    }

    const finding = await findingsService.getFindingDetail(findingId!);
    if (!finding) {
      return res.status(404).json({ success: false, error: 'Finding not found' });
    }

    // Usar FiscalAgent para la explicación
    const { fiscalAgent } = await import('../agents/fiscal.agent');
    
    // Obtener contexto de remediación si existe
    const remediation = await findingsService.getRemediationDetail(findingId!);

    const explanation = await fiscalAgent.chatearConHallazgo({
      finding,
      remediation,
      question
    });

    res.json({
      success: true,
      data: explanation
    });
  } catch (error) {
    logger.error('Error in finding explainer chat:', error);
    res.status(500).json({ success: false, error: 'Error processing explanation' });
  }
});

/**
 * ============================================================================
 * COMMENTS ENDPOINTS - Collaboration on Findings
 * ============================================================================
 */

/**
 * GET /api/v1/findings/:findingId/comments
 * Get all comments on a finding (for collaboration/discussion)
 */
router.get('/:findingId/comments', async (req: Request, res: Response) => {
  try {
    const { findingId } = req.params;

    const comments = await prisma.comment.findMany({
      where: { findingId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: comments.map((c) => ({
        id: c.id,
        findingId: c.findingId,
        userId: c.userId,
        userName: c.user?.name || c.user?.email,
        content: c.content,
        mentions: c.mentions,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      total: comments.length,
    });
  } catch (error) {
    logger.error('Error fetching comments:', error);
    res.status(500).json({ success: false, error: 'Error fetching comments' });
  }
});

/**
 * POST /api/v1/findings/:findingId/comments
 * Add a comment to a finding
 * Supports @mentions for user notifications
 */
router.post('/:findingId/comments', async (req: Request, res: Response) => {
  try {
    const { findingId } = req.params;
    const { content } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    // Parse mentions (@username patterns)
    const mentions: string[] = [];
    const mentionRegex = /@(\w+)/g;
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        findingId,
        userId,
        content: content.trim(),
        mentions,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Create mention notifications
    if (mentions.length > 0) {
      const mentionedUsers = await prisma.user.findMany({
        where: {
          name: {
            in: mentions,
          },
        },
      });

      for (const mentionedUser of mentionedUsers) {
        await prisma.commentMention.create({
          data: {
            commentId: comment.id,
            mentionedUserId: mentionedUser.id,
          },
        });
      }
    }

    // Emit WebSocket event for real-time updates
    socketService.emitCommentAdded(
      findingId,
      comment.id,
      userId,
      comment.user?.name || comment.user?.email || 'Unknown',
      content,
      mentions
    );

    res.status(201).json({
      success: true,
      data: {
        id: comment.id,
        findingId: comment.findingId,
        userId: comment.userId,
        userName: comment.user?.name || comment.user?.email,
        content: comment.content,
        mentions: comment.mentions,
        createdAt: comment.createdAt,
      },
    });
  } catch (error) {
    logger.error('Error creating comment:', error);
    res.status(500).json({ success: false, error: 'Error creating comment' });
  }
});

/**
 * DELETE /api/v1/findings/:findingId/comments/:commentId
 * Delete a comment (only by author or admin)
 */
router.delete('/:findingId/comments/:commentId', async (req: Request, res: Response) => {
  try {
    const { findingId, commentId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.userId !== userId) {
      return res.status(403).json({ error: 'Cannot delete other users comments' });
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    // Emit WebSocket event
    socketService.emitCommentDeleted(findingId, commentId);

    res.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    logger.error('Error deleting comment:', error);
    res.status(500).json({ success: false, error: 'Error deleting comment' });
  }
});

/**
 * ============================================================================
 * SLA (SERVICE LEVEL AGREEMENT) ENDPOINTS - Track Resolution Targets
 * ============================================================================
 */

/**
 * GET /api/v1/findings/:findingId/sla
 * Get SLA information for a finding
 */
router.get('/:findingId/sla', async (req: Request, res: Response) => {
  try {
    const { findingId } = req.params;

    const finding = await prisma.finding.findUnique({
      where: { id: findingId },
      include: {
        remediation: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!finding) {
      return res.status(404).json({ error: 'Finding not found' });
    }

    // Calculate SLA metrics
    const severity = finding.severity;
    const slaHoursByType: Record<string, number> = {
      CRITICAL: 4,   // 4 hours
      HIGH: 24,      // 1 day
      MEDIUM: 72,    // 3 days
      LOW: 168,      // 7 days
    };

    const slaHours = slaHoursByType[severity] || 168;
    const createdAt = finding.createdAt;
    const targetDate = new Date(createdAt.getTime() + slaHours * 60 * 60 * 1000);
    const now = new Date();
    const isOverdue = now > targetDate;

    let resolvedAt: Date | null = null;
    if (finding.remediation?.verifiedAt) {
      resolvedAt = finding.remediation.verifiedAt;
    } else if (finding.statusHistory.length > 0 && finding.statusHistory[0].status === 'RESOLVED') {
      resolvedAt = finding.statusHistory[0].createdAt;
    }

    const actualResolutionTime = resolvedAt ? resolvedAt.getTime() - createdAt.getTime() : null;
    const timeToTargetMs = targetDate.getTime() - now.getTime();

    res.json({
      success: true,
      data: {
        findingId,
        severity,
        createdAt,
        targetDate,
        resolvedAt: resolvedAt || null,
        slaHours,
        isOverdue,
        timeRemainingMs: Math.max(0, timeToTargetMs),
        timeRemainingHours: Math.max(0, timeToTargetMs / (60 * 60 * 1000)),
        actualResolutionTimeMs: actualResolutionTime,
        actualResolutionTimeHours: actualResolutionTime ? actualResolutionTime / (60 * 60 * 1000) : null,
        metSLA: resolvedAt ? resolvedAt <= targetDate : null,
        status: finding.statusHistory[0]?.status || 'DETECTED',
      },
    });
  } catch (error) {
    logger.error('Error fetching SLA info:', error);
    res.status(500).json({ success: false, error: 'Error fetching SLA information' });
  }
});

/**
 * PUT /api/v1/findings/:findingId/sla
 * Update SLA target date for a finding (custom SLA)
 */
router.put('/:findingId/sla', async (req: Request, res: Response) => {
  try {
    const { findingId } = req.params;
    const { targetDate } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!targetDate) {
      return res.status(400).json({ error: 'targetDate is required' });
    }

    const parsedDate = new Date(targetDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    // Store custom SLA in remediation action or finding metadata
    // For now, we'll use FindingStatusChange with metadata
    const finding = await prisma.finding.findUnique({
      where: { id: findingId },
      include: {
        remediation: true,
      },
    });

    if (!finding) {
      return res.status(404).json({ error: 'Finding not found' });
    }

    // Log SLA update as status change
    await prisma.findingStatusChange.create({
      data: {
        findingId,
        status: finding.statusHistory?.[0]?.status || 'DETECTED',
        changedBy: userId,
        note: `SLA target updated to ${parsedDate.toISOString()}`,
      },
    });

    // Emit event
    socketService.emitFindingStatusChanged(
      findingId,
      finding.statusHistory?.[0]?.status || 'DETECTED',
      userId
    );

    res.json({
      success: true,
      message: 'SLA target date updated',
      targetDate: parsedDate,
    });
  } catch (error) {
    logger.error('Error updating SLA:', error);
    res.status(500).json({ success: false, error: 'Error updating SLA' });
  }
});

export default router;
