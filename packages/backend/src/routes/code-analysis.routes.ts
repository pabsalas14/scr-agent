/**
 * ============================================================================
 * CODE ANALYSIS ROUTES - Endpoints para análisis y visualización de código
 * ============================================================================
 *
 * GET /api/code-analysis/finding/:findingId/diff       → Diff de un hallazgo
 * GET /api/code-analysis/file/compare                  → Comparar versiones de archivo
 * GET /api/code-analysis/user/:userId/files            → Archivos afectados por usuario
 * GET /api/code-analysis/context                       → Contexto de línea
 */

import { Router, type Router as ExpressRouter, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  getFindingCodeDiff,
  compareFileVersions,
  getUserAffectedFiles,
  getLineContext,
} from '../services/code-diff.service';

const router: ExpressRouter = Router();
router.use(authMiddleware);

/**
 * GET /api/code-analysis/finding/:findingId/diff
 * Obtener cambios de código para un hallazgo específico
 */
router.get('/finding/:findingId/diff', async (req: Request, res: Response) => {
  try {
    const { findingId } = req.params;

    const diff = await getFindingCodeDiff(findingId);

    if (!diff) {
      return res.status(404).json({ success: false, error: 'Finding not found' });
    }

    res.json({ success: true, data: diff });
  } catch (error) {
    logger.error(`Error getting finding code diff: ${error}`);
    res.status(500).json({ success: false, error: 'Error retrieving code diff' });
  }
});

/**
 * GET /api/code-analysis/file/compare
 * Comparar dos versiones de un archivo
 */
router.get('/file/compare', async (req: Request, res: Response) => {
  try {
    const analysisId = req.query.analysisId as string;
    const file = req.query.file as string;
    const beforeCommit = req.query.beforeCommit as string | undefined;
    const afterCommit = req.query.afterCommit as string | undefined;

    if (!analysisId || !file) {
      return res.status(400).json({
        success: false,
        error: 'analysisId and file parameters are required',
      });
    }

    const comparison = await compareFileVersions(analysisId, file, {
      beforeCommit,
      afterCommit,
    });

    if (!comparison) {
      return res.status(404).json({ success: false, error: 'File history not found' });
    }

    res.json({ success: true, data: comparison });
  } catch (error) {
    logger.error(`Error comparing file versions: ${error}`);
    res.status(500).json({ success: false, error: 'Error comparing files' });
  }
});

/**
 * GET /api/code-analysis/user/:userId/files
 * Obtener archivos más afectados por un usuario
 */
router.get('/user/:userId/files', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const analysisId = req.query.analysisId as string | undefined;

    const files = await getUserAffectedFiles(userId, { limit, analysisId });

    res.json({ success: true, data: files });
  } catch (error) {
    logger.error(`Error getting user affected files: ${error}`);
    res.status(500).json({ success: false, error: 'Error retrieving files' });
  }
});

/**
 * GET /api/code-analysis/context
 * Obtener contexto de cambios para una línea específica
 */
router.get('/context', async (req: Request, res: Response) => {
  try {
    const analysisId = req.query.analysisId as string;
    const file = req.query.file as string;
    const lineNumber = req.query.lineNumber ? parseInt(req.query.lineNumber as string) : 0;
    const context = req.query.context ? parseInt(req.query.context as string) : undefined;

    if (!analysisId || !file || lineNumber <= 0) {
      return res.status(400).json({
        success: false,
        error: 'analysisId, file, and lineNumber are required',
      });
    }

    const lineContext = await getLineContext(analysisId, file, lineNumber, context);

    if (!lineContext) {
      return res.status(404).json({ success: false, error: 'Context not found' });
    }

    res.json({ success: true, data: lineContext });
  } catch (error) {
    logger.error(`Error getting line context: ${error}`);
    res.status(500).json({ success: false, error: 'Error retrieving context' });
  }
});

export default router;
