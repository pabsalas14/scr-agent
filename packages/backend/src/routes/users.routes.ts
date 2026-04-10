import { Router, type Request, type Response, type Router as ExpressRouter } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { usersService } from '../services/users.service';
import { prisma } from '../services/prisma.service';
import { logger } from '../services/logger.service';
import {
  searchUsers,
  getUserProfile,
  getUserActivityTimeline,
  getUserRepos,
  getUserRiskScore,
} from '../services/user-search.service';

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
    const currentUserId = (req as any).user?.id as string;
    const userId = req.params['userId'] as string;
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
 * GET /api/v1/users/search
 * Buscar usuarios por nombre o email
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string | undefined;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Parámetro q debe tener al menos 2 caracteres',
      });
    }

    const users = await searchUsers(query, { limit });
    res.json({ success: true, data: users });
  } catch (error) {
    logger.error(`Error buscando usuarios: ${error}`);
    res.status(500).json({ success: false, error: 'Error buscando usuarios' });
  }
});

/**
 * GET /api/v1/users/:userId/profile
 * Obtener perfil completo de usuario con estadísticas forenses
 */
router.get('/:userId/profile', async (req: Request, res: Response) => {
  try {
    const profile = await getUserProfile(req.params.userId);

    if (!profile) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    res.json({ success: true, data: profile });
  } catch (error) {
    logger.error(`Error obteniendo perfil de usuario: ${error}`);
    res.status(500).json({ success: false, error: 'Error obteniendo perfil' });
  }
});

/**
 * GET /api/v1/users/:userId/activity
 * Obtener timeline de actividad del usuario
 */
router.get('/:userId/activity', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;
    const severity = req.query.severity as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | undefined;

    const events = await getUserActivityTimeline(req.params.userId, { limit, offset, severity });
    res.json({ success: true, data: events, limit, offset });
  } catch (error) {
    logger.error(`Error obteniendo actividad de usuario: ${error}`);
    res.status(500).json({ success: false, error: 'Error obteniendo actividad' });
  }
});

/**
 * GET /api/v1/users/:userId/repos
 * Obtener repositorios donde el usuario ha commitido
 */
router.get('/:userId/repos', async (req: Request, res: Response) => {
  try {
    const repos = await getUserRepos(req.params.userId);
    res.json({ success: true, data: repos });
  } catch (error) {
    logger.error(`Error obteniendo repos del usuario: ${error}`);
    res.status(500).json({ success: false, error: 'Error obteniendo repositorios' });
  }
});

/**
 * GET /api/v1/users/:userId/risk-score
 * Obtener score de riesgo agregado del usuario
 */
router.get('/:userId/risk-score', async (req: Request, res: Response) => {
  try {
    const riskData = await getUserRiskScore(req.params.userId);
    res.json({ success: true, data: riskData });
  } catch (error) {
    logger.error(`Error calculando risk score: ${error}`);
    res.status(500).json({ success: false, error: 'Error calculando risk score' });
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
