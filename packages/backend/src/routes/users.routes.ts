import { Router, type Request, type Response, type Router as ExpressRouter } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { usersService } from '../services/users.service';
import { logger } from '../services/logger.service';

const router: ExpressRouter = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * GET /api/v1/users/:userId
 * Get user detail
 */
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = (req as any).user?.id;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Users can only view their own profile unless they're admin
    if (userId !== currentUserId) {
      const userRole = await usersService.getUserRole(currentUserId!);
      if (userRole !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized',
        });
      }
    }

    const user = await usersService.getUserDetail(userId!);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error('Error fetching user detail:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching user',
    });
  }
});

/**
 * GET /api/v1/users/:userId/assignments
 * Get findings assigned to a user
 */
router.get('/:userId/assignments', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = (req as any).user?.id;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Users can only view their own assignments unless they're admin/analyst
    if (userId !== currentUserId) {
      const userRole = await usersService.getUserRole(currentUserId);
      if (!['ADMIN', 'ANALYST'].includes(userRole || '')) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized',
        });
      }
    }

    const assignments = await usersService.getUserAssignments(userId!);

    res.json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    logger.error('Error fetching user assignments:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching assignments',
    });
  }
});

/**
 * GET /api/v1/users/analysis/:analysisId/assignments
 * Get all assignments for an analysis
 */
router.get('/analysis/:analysisId/assignments', async (req: Request, res: Response) => {
  try {
    const { analysisId } = req.params;

    const assignments = await usersService.getAnalystAssignments(analysisId!);

    res.json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    logger.error('Error fetching analyst assignments:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching assignments',
    });
  }
});

export default router;
