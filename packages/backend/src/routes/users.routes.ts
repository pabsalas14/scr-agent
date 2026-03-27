import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { usersService } from '../services/users.service';
import { logger } from '../services/logger.service';
import { Role } from '@prisma/client';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * GET /api/v1/users
 * Get all users (Admin only)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userRole = await usersService.getUserRole((req as any).user?.id);

    // Check if user is admin
    if (userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: Admin access required',
      });
    }

    const users = await usersService.getAllUsers();

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching users',
    });
  }
});

/**
 * GET /api/v1/users/:userId
 * Get user detail
 */
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = (req as any).user?.id;

    // Users can only view their own profile unless they're admin
    if (userId !== currentUserId) {
      const userRole = await usersService.getUserRole(currentUserId);
      if (userRole !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized',
        });
      }
    }

    const user = await usersService.getUserDetail(userId);

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
 * GET /api/v1/users/role/:role
 * Get users by role
 */
router.get('/role/:role', async (req: Request, res: Response) => {
  try {
    const { role } = req.params;

    const validRoles: Role[] = ['ADMIN', 'ANALYST', 'DEVELOPER', 'VIEWER'];
    if (!validRoles.includes(role as Role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role',
      });
    }

    const users = await usersService.getUsersByRole(role as Role);

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    logger.error('Error fetching users by role:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching users',
    });
  }
});

/**
 * POST /api/v1/users/:userId/roles
 * Assign role to user (Admin only)
 */
router.post('/:userId/roles', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const currentUserId = (req as any).user?.id;

    // Check if requester is admin
    const userRole = await usersService.getUserRole(currentUserId);
    if (userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: Admin access required',
      });
    }

    if (!role) {
      return res.status(400).json({
        success: false,
        error: 'Role is required',
      });
    }

    const validRoles: Role[] = ['ADMIN', 'ANALYST', 'DEVELOPER', 'VIEWER'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role',
      });
    }

    const userRole = await usersService.assignRole(userId, role);

    res.json({
      success: true,
      data: userRole,
    });
  } catch (error) {
    logger.error('Error assigning role:', error);
    res.status(500).json({
      success: false,
      error: 'Error assigning role',
    });
  }
});

/**
 * DELETE /api/v1/users/:userId/roles/:role
 * Remove role from user (Admin only)
 */
router.delete('/:userId/roles/:role', async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.params;
    const currentUserId = (req as any).user?.id;

    // Check if requester is admin
    const userRole = await usersService.getUserRole(currentUserId);
    if (userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: Admin access required',
      });
    }

    const validRoles: Role[] = ['ADMIN', 'ANALYST', 'DEVELOPER', 'VIEWER'];
    if (!validRoles.includes(role as Role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role',
      });
    }

    await usersService.removeRole(userId, role as Role);

    res.json({
      success: true,
      message: 'Role removed successfully',
    });
  } catch (error) {
    logger.error('Error removing role:', error);
    res.status(500).json({
      success: false,
      error: 'Error removing role',
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

    const assignments = await usersService.getUserAssignments(userId);

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

    const assignments = await usersService.getAnalystAssignments(analysisId);

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
