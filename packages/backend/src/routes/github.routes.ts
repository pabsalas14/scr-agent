/**
 * ============================================================================
 * RUTAS DE GITHUB API - CARGA DINÁMICA DE REPOS Y RAMAS
 * ============================================================================
 *
 * GET    /api/v1/github/repos              → Listar repos del usuario
 * GET    /api/v1/github/repos/:owner/:repo/branches → Listar ramas de un repo
 *
 * Autenticación: Requiere GitHub token configurado en UserSettings
 */

import { Router, type Router as ExpressRouter, Response } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.middleware';
import { prisma } from '../services/prisma.service';
import { logger } from '../services/logger.service';
import { gitService } from '../services/git.service';
import { decrypt } from '../services/crypto.service';
import axios from 'axios';

const router: ExpressRouter = Router();

/**
 * GET /api/v1/github/repos
 * Listar repositorios del usuario autenticado en GitHub
 */
router.get('/repos', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { search = '', page = '1', per_page = '20' } = req.query;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    /**
     * Obtener GitHub token del usuario
     */
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!userSettings?.githubToken) {
      res.status(400).json({
        error: 'GitHub token no configurado',
        message: 'Configura tu GitHub token en las preferencias primero',
      });
      return;
    }

    const githubToken = decrypt(userSettings.githubToken);
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const perPageNum = Math.min(100, Math.max(1, parseInt(per_page as string) || 20));

    /**
     * Obtener repos de GitHub API
     * 1. Repos del usuario
     * 2. Repos de organizaciones donde es miembro
     */
    try {
      // Obtener info del usuario
      const userResp = await axios.get('https://api.github.com/user', {
        headers: {
          Authorization: `token ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
        timeout: 10000,
      });

      const username = userResp.data.login;

      // Construir query de búsqueda
      // Busca en: nombre del repo, descripción, owner
      const q = search ? `user:${username} ${search}` : `user:${username}`;

      // Buscar repos
      const searchResp = await axios.get('https://api.github.com/search/repositories', {
        params: {
          q,
          sort: 'stars',
          order: 'desc',
          per_page: perPageNum,
          page: pageNum,
        },
        headers: {
          Authorization: `token ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
        timeout: 10000,
      });

      const repos = searchResp.data.items.map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        url: repo.html_url,
        cloneUrl: repo.clone_url,
        description: repo.description || '',
        isPrivate: repo.private,
        stars: repo.stargazers_count,
        language: repo.language,
      }));

      res.json({
        success: true,
        data: {
          repos,
          total: searchResp.data.total_count,
          page: pageNum,
          per_page: perPageNum,
          hasMore: repos.length === perPageNum,
        },
      });
    } catch (error: any) {
      logger.error(`Error fetching repos from GitHub: ${error.message}`);
      res.status(500).json({
        error: 'Error obteniendo repos de GitHub',
        message: error.response?.data?.message || error.message,
      });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(`Error en /github/repos: ${msg}`);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * GET /api/v1/github/repos/:owner/:repo/branches
 * Listar ramas de un repositorio específico
 */
router.get(
  '/repos/:owner/:repo/branches',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const { owner, repo } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      if (!owner || !repo) {
        res.status(400).json({ error: 'owner y repo son requeridos' });
        return;
      }

      /**
       * Obtener GitHub token del usuario
       */
      const userSettings = await prisma.userSettings.findUnique({
        where: { userId },
      });

      if (!userSettings?.githubToken) {
        res.status(400).json({
          error: 'GitHub token no configurado',
          message: 'Configura tu GitHub token en las preferencias primero',
        });
        return;
      }

      const githubToken = decrypt(userSettings.githubToken);

      try {
        /**
         * Obtener ramas de GitHub API
         */
        const branchesResp = await axios.get(
          `https://api.github.com/repos/${owner}/${repo}/branches`,
          {
            headers: {
              Authorization: `token ${githubToken}`,
              Accept: 'application/vnd.github.v3+json',
            },
            timeout: 10000,
            params: {
              per_page: 50, // Máximo 50 ramas por página
            },
          }
        );

        const branches = branchesResp.data.map((branch: any) => ({
          name: branch.name,
          sha: branch.commit.sha,
          protected: branch.protected,
        }));

        // Sortear: main/master primero, luego alfabéticamente
        const mainBranches = ['main', 'master', 'develop'];
        branches.sort((a: any, b: any) => {
          const aIndex = mainBranches.indexOf(a.name);
          const bIndex = mainBranches.indexOf(b.name);
          if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
          if (aIndex !== -1) return -1;
          if (bIndex !== -1) return 1;
          return a.name.localeCompare(b.name);
        });

        res.json({
          success: true,
          data: {
            owner,
            repo,
            branches,
            total: branches.length,
          },
        });
      } catch (error: any) {
        if (error.response?.status === 404) {
          res.status(404).json({ error: 'Repositorio no encontrado' });
        } else {
          logger.error(`Error fetching branches: ${error.message}`);
          res.status(500).json({
            error: 'Error obteniendo ramas de GitHub',
            message: error.response?.data?.message || error.message,
          });
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error(`Error en /github/repos/:owner/:repo/branches: ${msg}`);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

/**
 * POST /api/v1/github/repos/:owner/:repo/validate
 * Validar que un repositorio es accesible
 * Devuelve: { accessible: boolean, reason?: string }
 */
router.post(
  '/repos/:owner/:repo/validate',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const { owner, repo } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      if (!owner || !repo) {
        res.status(400).json({ error: 'owner y repo son requeridos' });
        return;
      }

      /**
       * Obtener GitHub token del usuario
       */
      const userSettings = await prisma.userSettings.findUnique({
        where: { userId },
      });

      const githubToken = userSettings?.githubToken ? decrypt(userSettings.githubToken) : undefined;

      try {
        /**
         * Validar acceso al repositorio
         */
        const repoUrl = `https://github.com/${owner}/${repo}`;
        await gitService.testRepositoryAccess(repoUrl, githubToken || undefined);

        res.json({
          success: true,
          accessible: true,
          owner,
          repo,
          message: 'Repository is accessible',
        });
      } catch (error: any) {
        const errorMessage = error.message || '';

        // Determinar si es accessible o no
        if (
          errorMessage.includes('404') ||
          errorMessage.startsWith('REPO_NOT_FOUND')
        ) {
          res.status(404).json({
            accessible: false,
            reason: 'REPO_NOT_FOUND',
            message: 'Repository does not exist',
          });
        } else if (
          errorMessage.includes('403') ||
          errorMessage.startsWith('NO_ACCESS')
        ) {
          res.status(403).json({
            accessible: false,
            reason: 'NO_ACCESS',
            message: 'No access to repository (private or insufficient permissions)',
          });
        } else if (
          errorMessage.includes('401') ||
          errorMessage.startsWith('INVALID_TOKEN')
        ) {
          res.status(401).json({
            accessible: false,
            reason: 'INVALID_TOKEN',
            message: 'GitHub token is invalid or expired',
          });
        } else {
          res.status(400).json({
            accessible: false,
            reason: 'VALIDATION_ERROR',
            message: errorMessage,
          });
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error(`Error en /github/repos/:owner/:repo/validate: ${msg}`);
      res.status(500).json({
        error: 'Error validating repository',
        message: msg,
      });
    }
  }
);

export default router;
