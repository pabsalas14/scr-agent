import { Router, type Request, type Response, type Router as ExpressRouter } from 'express';
import bcrypt from 'bcryptjs';
import { authMiddleware } from '../middleware/auth.middleware';
import { usersService } from '../services/users.service';
import { prisma } from '../services/prisma.service';
import { logger } from '../services/logger.service';

const BCRYPT_ROUNDS = 10;
import {
  searchUsers,
  getUserProfile,
  getUserActivityTimeline,
  getUserRepos,
  getUserRiskScore,
} from '../services/user-search.service';
import { calculateAdvancedRiskScore, getRiskScoreHistory } from '../services/risk-scoring.service';
import {
  getUserRiskTrend,
  getProjectRiskTrend,
  getGlobalRiskTrend,
  compareUserRiskTrends,
} from '../services/risk-trends.service';

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
 * POST /api/v1/users
 * Crear nuevo usuario (solo ADMIN)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user?.id;
    const currentRole = await usersService.getUserRole(currentUserId);
    if (currentRole !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Solo administradores pueden crear usuarios' });
    }

    const { email, role, password } = req.body;

    // Validar campos requeridos
    if (!email || !role || !password) {
      return res.status(400).json({ success: false, error: 'Email, rol y contraseña son requeridos' });
    }

    // Validar rol
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ success: false, error: `Rol inválido. Válidos: ${VALID_ROLES.join(', ')}` });
    }

    // Validar contraseña
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'El usuario ya existe' });
    }

    // Crear nuevo usuario con la contraseña proporcionada (hasheada con bcrypt)
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const newUser = await prisma.user.create({
      data: {
        email,
        name: email.split('@')[0],
        passwordHash,
      },
    });

    // Asignar rol
    await usersService.assignRole(newUser.id, role);

    logger.info(`Nuevo usuario creado: ${email} con rol ${role}`);

    res.json({
      success: true,
      data: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role,
      },
      message: 'Usuario creado correctamente',
    });
  } catch (error) {
    logger.error('Error creating user:', error);
    res.status(500).json({ success: false, error: 'Error al crear el usuario' });
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
 * GET /api/v1/users/:userId/risk-score/advanced
 * Obtener score de riesgo avanzado con factores desglosados
 */
router.get('/:userId/risk-score/advanced', async (req: Request, res: Response) => {
  try {
    const advancedScore = await calculateAdvancedRiskScore(req.params.userId);
    res.json({ success: true, data: advancedScore });
  } catch (error) {
    logger.error(`Error calculando advanced risk score: ${error}`);
    res.status(500).json({ success: false, error: 'Error calculando risk score avanzado' });
  }
});

/**
 * GET /api/v1/users/:userId/risk-score/history
 * Obtener histórico de scores de riesgo
 */
router.get('/:userId/risk-score/history', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

    const history = await getRiskScoreHistory(req.params.userId, { days, limit });
    res.json({ success: true, data: history, period: `${days} days` });
  } catch (error) {
    logger.error(`Error obteniendo risk score history: ${error}`);
    res.status(500).json({ success: false, error: 'Error obteniendo histórico' });
  }
});

/**
 * GET /api/v1/users/:userId/risk-trend
 * Obtener tendencia de riesgo del usuario
 */
router.get('/:userId/risk-trend', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const interval = (req.query.interval as 'daily' | 'weekly' | 'monthly') || 'daily';

    const trend = await getUserRiskTrend(req.params.userId, { days, interval });

    if (!trend) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    res.json({ success: true, data: trend });
  } catch (error) {
    logger.error(`Error obteniendo user risk trend: ${error}`);
    res.status(500).json({ success: false, error: 'Error obteniendo tendencia de riesgo' });
  }
});

/**
 * POST /api/v1/users/risk-trend/compare
 * Comparar tendencias de riesgo de múltiples usuarios
 */
router.post('/risk-trend/compare', async (req: Request, res: Response) => {
  try {
    const { userIds } = req.body;
    const days = parseInt(req.query.days as string) || 30;
    const interval = (req.query.interval as 'daily' | 'weekly' | 'monthly') || 'daily';

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: 'userIds debe ser un array no vacío' });
    }

    const comparisons = await compareUserRiskTrends(userIds, { days, interval });
    const results = Object.fromEntries(comparisons);

    res.json({ success: true, data: results });
  } catch (error) {
    logger.error(`Error comparando risk trends: ${error}`);
    res.status(500).json({ success: false, error: 'Error comparando tendencias' });
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
