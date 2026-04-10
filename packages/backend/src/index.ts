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
import { createServer } from 'http';
import path from 'path';
import { logger } from './services/logger.service';
import { socketService } from './services/socket.service';

// Cargar variables de entorno - intentar múltiples rutas (override para evitar vars vacías del sistema)
const envPaths = [
  path.resolve(__dirname, '../.env'),
  path.resolve(process.cwd(), 'packages/backend/.env'),
  path.resolve(process.cwd(), '.env'),
];
for (const p of envPaths) {
  const result = dotenv.config({ path: p, override: true });
  if (!result.error) break;
}

// ==================== CONFIGURACIÓN ====================

const PORT = process.env['BACKEND_PORT'] || 3000;
const NODE_ENV = process.env['NODE_ENV'] || 'development';

// ==================== SERVIDOR EXPRESS ====================

const app: Express = express();

/**
 * Middleware de Seguridad
 */

// Helmet - Headers de seguridad HTTP
app.use(helmet());

// CORS - Control de origen
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

// Rate Limiting - Prevenir DDoS
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
import commentsRoutes from './routes/comments.routes';
import analyticsRoutes from './routes/analytics.routes';
import userSettingsRoutes from './routes/user-settings.routes';
import auditRoutes from './routes/audit.routes';
import remediationRoutes from './routes/remediation.routes';
import timelineRoutes from './routes/timeline.routes';
import trendsRoutes from './routes/trends.routes';
import detectionRoutes from './routes/detection.routes';
import visualizationsRoutes from './routes/visualizations.routes';
import codeAnalysisRoutes from './routes/code-analysis.routes';
import reportsRoutes from './routes/reports.routes';
import comparisonRoutes from './routes/comparison.routes';
import searchRoutes from './routes/search.routes';
import { authMiddleware } from './middleware/auth.middleware';
import { auditMiddleware } from './middleware/audit.middleware';

// Rutas públicas de autenticación (sin JWT)
app.use('/api/v1/auth', authRoutes);

// Middleware JWT para todas las rutas protegidas
app.use('/api/v1', authMiddleware);

// Middleware de auditoría para registrar acciones
app.use('/api/v1', auditMiddleware);

app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/analyses', analysisRoutes);
app.use('/api/v1/monitoring', monitoringRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/github', githubRoutes);
app.use('/api/v1/findings', findingsRoutes);
app.use('/api/v1/users', userSettingsRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/findings', commentsRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/remediation', remediationRoutes);
app.use('/api/v1/timeline', timelineRoutes);
app.use('/api/v1/trends', trendsRoutes);
app.use('/api/v1/detection', detectionRoutes);
app.use('/api/v1/visualizations', visualizationsRoutes);
app.use('/api/v1/code-analysis', codeAnalysisRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/comparison', comparisonRoutes);
app.use('/api/v1', searchRoutes);

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
 * Captura todos los errores y los maneja de forma segura
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

// Crear servidor HTTP para Express
const httpServer = createServer(app);

// Inicializar Socket.io para notificaciones en tiempo real
socketService.init(httpServer, allowedOrigins);

// ==================== QUEUE PROCESSOR ====================

// Importar y iniciar el procesador de análisis (async — Bull queue + Worker)
import { startAnalysisProcessor, stopAnalysisProcessor } from './services/analysis-queue';
startAnalysisProcessor().catch((err) => {
  logger.error(`Error iniciando analysis processor: ${err}`);
});

// Iniciar servidor
const server = httpServer.listen(PORT, () => {
  logger.info(`🚀 Servidor SCR Agent iniciado en puerto ${PORT}`);
  logger.info(`📍 Entorno: ${NODE_ENV}`);
  logger.info(`🔗 API base: http://localhost:${PORT}/api/v1`);
  logger.info(`🔌 WebSocket listo en ws://localhost:${PORT}`);
});

/**
 * Manejo de Shutdown Graceful
 * Cierra conexiones ordenadamente (Bull queue, Worker, HTTP server)
 */
async function gracefulShutdown() {
  logger.info('🔌 Iniciando shutdown graceful...');

  try {
    // Cerrar Bull queue y worker
    await stopAnalysisProcessor();
  } catch (err) {
    logger.error(`Error cerrando processor: ${err}`);
  }

  server.close(() => {
    logger.info('✅ Servidor cerrado');
    process.exit(0);
  });
}

process.on('SIGTERM', () => {
  logger.info('📴 SIGTERM recibido, cerrando servidor...');
  gracefulShutdown();
});

process.on('SIGINT', () => {
  logger.info('⏹️ SIGINT recibido, cerrando servidor...');
  gracefulShutdown();
});

// ==================== EXPORTAR ====================

export { app, logger };
