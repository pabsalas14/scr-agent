import { Router, type Request, type Response, type Router as ExpressRouter } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { usersService } from '../services/users.service';
import { prisma } from '../services/prisma.service';
import { logger } from '../services/logger.service';

const VALID_ROLES = ['ADMIN', 'ANALYST', 'DEVELOPER', 'VIEWER'] as const;

const router: ExpressRouter = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * GET /api/v1/users
 * Listar todos los usuarios (solo ADMIN)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user?.id;
    const currentRole = await usersService.getUserRole(currentUserId);
    if (currentRole !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Solo administradores pueden listar usuarios' });
    }
    const users = await usersService.getAllUsers();
    res.json({ success: true, data: users });
  } catch (error) {
    logger.error('Error listing users:', error);
    res.status(500).json({ success: false, error: 'Error listando usuarios' });
  }
});

/**
 * PATCH /api/v1/users/:userId/role
 * Cambiar rol de un usuario (solo ADMIN)
 */
router.patch('/:userId/role', async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user?.id;
    const { userId } = req.params;
    const { role } = req.body;

    const currentRole = await usersService.getUserRole(currentUserId);
    if (currentRole !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Solo administradores pueden cambiar roles' });
    }

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ success: false, error: `Rol inválido. Válidos: ${VALID_ROLES.join(', ')}` });
    }

    if (userId === currentUserId) {
      return res.status(400).json({ success: false, error: 'No puedes cambiar tu propio rol' });
    }

    const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!target) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    await prisma.userRole.deleteMany({ where: { userId } });
    await usersService.assignRole(userId, role);

    res.json({ success: true, message: 'Rol actualizado' });
  } catch (error) {
    logger.error('Error changing user role:', error);
    res.status(500).json({ success: false, error: 'Error actualizando rol' });
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
