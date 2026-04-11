import { Router, Request, Response } from 'express';
import { searchService } from '../services/search.service';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Apply auth middleware to all search routes
router.use(authMiddleware);

/**
 * GET /api/v1/search
 * Global search across findings, projects, analyses, incidents
 * Query parameters:
 *   - q: search query (required)
 *   - page: page number (default: 1)
 *   - limit: results per page (default: 20)
 *   - type: filter by type (finding, project, analysis, incident, report)
 *   - severity: filter by severity (CRITICAL, HIGH, MEDIUM, LOW)
 *   - status: filter by status (PENDING, IN_PROGRESS, COMPLETED, etc)
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const {
      q,
      page = '1',
      limit = '20',
      type,
      severity,
      status,
    } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.status(400).json({
        error: 'Search query (q) is required and must be non-empty',
      });
    }

    // Parse and validate pagination
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string) || 20));

    // Call search service
    const result = await searchService.search({
      query: q,
      page: pageNum,
      limit: limitNum,
      userId,
      filters: {
        type: typeof type === 'string' ? type : undefined,
        severity: typeof severity === 'string' ? severity : undefined,
        status: typeof status === 'string' ? status : undefined,
      },
    });

    return res.status(200).json({
      data: result.results,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: result.total,
        pages: Math.ceil(result.total / limitNum),
      },
    });
  } catch (error) {
    console.error('[Search Error]', error);
    return res.status(500).json({
      error: 'Search failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/search/suggestions
 * Get search suggestions for autocomplete
 * Query parameters:
 *   - q: search query (required, min 2 chars)
 *   - limit: number of suggestions (default: 10, max: 50)
 */
router.get('/search/suggestions', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { q, limit = '10' } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      return res.status(400).json({
        error: 'Search query (q) is required and must be at least 2 characters',
      });
    }

    const limitNum = Math.max(1, Math.min(50, parseInt(limit as string) || 10));

    const suggestions = await searchService.getSuggestions(q, userId, limitNum);

    return res.status(200).json({
      data: suggestions,
      count: suggestions.length,
    });
  } catch (error) {
    console.error('[Suggestions Error]', error);
    return res.status(500).json({
      error: 'Suggestions failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
