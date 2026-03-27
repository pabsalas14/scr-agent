/**
 * ============================================================================
 * PUNTO DE ENTRADA - Backend MCP Server
 * ============================================================================
 *
 * Este archivo inicia el servidor Express que expone:
 * 1. API REST para el frontend
 * 2. MCP Server (Model Context Protocol) para orquestación de agentes
 * 3. Conexión a PostgreSQL (Prisma ORM)
 *
 * Arquitectura:
 * - Servidor Express en puerto 3000
 * - Rutas API bajo /api/v1/
 * - MCP expone los agentes: Inspector, Detective, Fiscal
 */

import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { logger } from './services/logger.service';

// Cargar variables de entorno
dotenv.config();

// ==================== CONFIGURACIÓN ====================

const PORT = process.env['BACKEND_PORT'] || 3000;
const NODE_ENV = process.env['NODE_ENV'] || 'development';

// ==================== SERVIDOR EXPRESS ====================

const app: Express = express();

/**
 * Middleware de Seguridad
 * OWASP Top 10 Protections
 */

// Helmet - Headers de seguridad HTTP (OWASP A06)
app.use(helmet());

// CORS - Control de origen (OWASP API2)
const allowedOrigins = [
  process.env['FRONTEND_URL'] || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:5178',
  'http://localhost:5179',
  'http://localhost:5200',
];
app.use(cors({
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    // Permitir requests sin origin (ej. Postman, health checks)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origen ${origin} no permitido`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate Limiting - Prevenir DDoS (OWASP API4)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10000, // máximo 10000 requests por ventana (development)
  message: 'Demasiadas solicitudes, intente más tarde',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

/**
 * Middleware de Logging
 * Registra todas las solicitudes HTTP
 */
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
});

// ==================== RUTAS ====================

/**
 * Health Check
 * Endpoint para verificar que el servidor está activo
 */
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * API V1 - Raíz
 */
app.get('/api/v1', (_req, res) => {
  res.status(200).json({
    name: 'SCR Agent API',
    version: '0.1.0',
    description: 'Source Code Review con arquitectura MCP agentica',
  });
});

/**
 * Rutas API
 */
import projectRoutes from './routes/projects.routes';
import analysisRoutes from './routes/analyses.routes';
import authRoutes from './routes/auth.routes';
import monitoringRoutes from './routes/monitoring.routes';
import settingsRoutes from './routes/settings.routes';
import githubRoutes from './routes/github.routes';
import findingsRoutes from './routes/findings.routes';
import usersRoutes from './routes/users.routes';
import notificationsRoutes from './routes/notifications.routes';
import { authMiddleware } from './middleware/auth.middleware';

// Rutas públicas de autenticación (sin JWT)
app.use('/api/v1/auth', authRoutes);

// Middleware JWT para todas las rutas protegidas
app.use('/api/v1', authMiddleware);

app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/analyses', analysisRoutes);
app.use('/api/v1/monitoring', monitoringRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/github', githubRoutes);
app.use('/api/v1/findings', findingsRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/notifications', notificationsRoutes);

// ==================== MANEJO DE ERRORES ====================

/**
 * Middleware 404
 */
app.use((_req, res) => {
  res.status(404).json({
    error: 'Recurso no encontrado',
    status: 404,
  });
});

/**
 * Middleware de Error Global
 * Captura todos los errores y los maneja de forma segura (OWASP A04)
 */
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const statusCode = err.statusCode || 500;
  const isDevelopment = NODE_ENV === 'development';

  logger.error({
    message: err.message,
    stack: isDevelopment ? err.stack : undefined,
    statusCode,
  });

  res.status(statusCode).json({
    error: isDevelopment ? err.message : 'Error interno del servidor',
    ...(isDevelopment && { stack: err.stack }),
  });
});

// ==================== INICIAR SERVIDOR ====================

const server = app.listen(PORT, () => {
  logger.info(`🚀 Servidor SCR Agent iniciado en puerto ${PORT}`);
  logger.info(`📍 Entorno: ${NODE_ENV}`);
  logger.info(`🔗 API base: http://localhost:${PORT}/api/v1`);
});

/**
 * Manejo de Shutdown Graceful
 * Cierra conexiones ordenadamente
 */
process.on('SIGTERM', () => {
  logger.info('📴 SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    logger.info('✅ Servidor cerrado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('⏹️ SIGINT recibido, cerrando servidor...');
  server.close(() => {
    logger.info('✅ Servidor cerrado');
    process.exit(0);
  });
});

// ==================== EXPORTAR ====================

export { app, logger };
