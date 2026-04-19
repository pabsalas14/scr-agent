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

import { Router, type Router as ExpressRouter, Response, Request } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.middleware';
import { prisma } from '../services/prisma.service';
import { logger } from '../services/logger.service';
import { gitService } from '../services/git.service';
import { decrypt, encrypt } from '../services/crypto.service';
import { getAnalysisQueue } from '../config/bull.config';
import axios from 'axios';
import crypto from 'crypto';

/** Obtiene y descifra el GitHub token del usuario, o lanza respuesta 400 si no está configurado */
async function resolveGithubToken(userId: string, res: Response): Promise<string | null> {
  const userSettings = await prisma.userSettings.findUnique({ where: { userId } });
  if (!userSettings?.githubToken) {
    res.status(400).json({
      error: 'GitHub token no configurado',
      message: 'Configura tu GitHub token en las preferencias primero',
    });
    return null;
  }
  return decrypt(userSettings.githubToken);
}

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

      const githubToken = await resolveGithubToken(userId, res);
      if (!githubToken) {
        logger.warn(`No GitHub token found for user ${userId}`);
        return;
      }

      const pageNum = Math.max(1, parseInt(page as string) || 1);
      const perPageNum = Math.min(100, Math.max(1, parseInt(per_page as string) || 20));

      try {
      /**
       * Obtener repos de GitHub API usando /user/repos
       * NOTA: Usamos prefijo 'token' por retrocompatibilidad con tokens Classic
       * aunque 'Bearer' es el estándar moderno.
       */
      const reposResp = await axios.get('https://api.github.com/user/repos', {
        headers: {
          Authorization: `token ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
        params: {
          sort: 'updated',
          direction: 'desc',
          per_page: search ? 100 : perPageNum, // Pedir más si vamos a filtrar localmente
          page: search ? 1 : pageNum,
          affiliation: 'owner,collaborator,organization_member',
        },
        timeout: 15000,
      });

      let reposData = reposResp.data;

      // Filtrado local si hay búsqueda
      if (search) {
        const searchLower = (search as string).toLowerCase();
        reposData = reposData.filter((repo: any) =>
          repo.name.toLowerCase().includes(searchLower) ||
          repo.full_name.toLowerCase().includes(searchLower) ||
          (repo.description && repo.description.toLowerCase().includes(searchLower))
        );

        // Paginar resultados filtrados
        const start = (pageNum - 1) * perPageNum;
        reposData = reposData.slice(start, start + perPageNum);
      }

      const repos = reposData.map((repo: any) => ({
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
          total: search ? repos.length : repos.length, // /user/repos no siempre trae total count
          page: pageNum,
          per_page: perPageNum,
          hasMore: reposData.length === perPageNum,
        },
      });
    } catch (error: any) {
      const status = error.response?.status;
      const errorData = error.response?.data;
      logger.error(`Error fetching repos from GitHub:`, {
        status,
        message: error.message,
        data: errorData,
        userId
      });

      res.status(status || 500).json({
        error: 'Error obteniendo repos de GitHub',
        message: errorData?.message || error.message,
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

      const githubToken = await resolveGithubToken(userId, res);
      if (!githubToken) return;

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

/**
 * ============================================================================
 * GITHUB WEBHOOK INTEGRATION
 * ============================================================================
 * Recibe eventos de GitHub y dispara análisis automáticos
 */

/**
 * Validar firma HMAC-SHA256 de webhook de GitHub
 * GitHub calcula: sha256(payload, secret) y lo envía en X-Hub-Signature-256
 */
function verifyGithubWebhookSignature(payload: string, signature: string | undefined, secret: string): boolean {
  if (!signature) {
    logger.warn('No X-Hub-Signature-256 header found');
    return false;
  }

  const expectedSignature = 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const isValid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));

  if (!isValid) {
    logger.warn(`Webhook signature mismatch. Expected: ${expectedSignature}, Got: ${signature}`);
  }

  return isValid;
}

/**
 * POST /api/v1/github/webhook
 * Recibe eventos de GitHub (push, pull_request, etc.)
 * No requiere autenticación - GitHub lo envía directamente
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-hub-signature-256'] as string;
    const event = req.headers['x-github-event'] as string;
    const deliveryId = req.headers['x-github-delivery'] as string;
    const payload = JSON.stringify(req.body);

    logger.info(`Received GitHub webhook: ${event} (delivery: ${deliveryId})`);

    // Obtener el proyecto asociado a este repositorio
    const repoFullName = req.body.repository?.full_name;
    if (!repoFullName) {
      logger.warn('No repository full_name in webhook payload');
      res.status(400).json({ error: 'Invalid payload' });
      return;
    }

    // Buscar proyecto por URL de repositorio
    const project = await prisma.project.findFirst({
      where: {
        repositoryUrl: {
          contains: repoFullName,
        },
      },
    });

    if (!project) {
      logger.warn(`No project found for repository: ${repoFullName}`);
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    // Validar firma del webhook
    // Use environment variable or generate random secret for security
    const webhookSecret = process.env['GITHUB_WEBHOOK_SECRET'] || crypto.randomBytes(32).toString('hex');
    if (!webhookSecret) {
      logger.error(`Critical: No webhook secret available for project ${project.id}`);
      res.status(500).json({ error: 'Webhook configuration error' });
      return;
    }

    if (!verifyGithubWebhookSignature(payload, signature, webhookSecret)) {
      logger.warn(`Invalid webhook signature for ${repoFullName}`);
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    // Procesar evento
    let shouldTriggerAnalysis = false;
    let analysisType = 'COMPLETE';
    let ref = 'main';

    switch (event) {
      case 'push': {
        // Trigger en push
        const pushRef = req.body.ref as string; // refs/heads/main
        ref = pushRef.replace('refs/heads/', '');
        shouldTriggerAnalysis = true;
        analysisType = 'INCREMENTAL'; // Push es análisis incremental
        logger.info(`Push event on ${ref}`);
        break;
      }

      case 'pull_request': {
        // Trigger en PR (solo en actions que importan)
        const action = req.body.action as string;
        if (['opened', 'reopened', 'synchronize'].includes(action)) {
          const prRef = req.body.pull_request?.head?.ref;
          ref = prRef || project.branch || 'main';
          shouldTriggerAnalysis = true;
          analysisType = 'INCREMENTAL';
          logger.info(`Pull request ${action} on ${ref}`);
        }
        break;
      }

      case 'ping': {
        // GitHub envía ping al configurar webhook
        logger.info('Webhook ping from GitHub - configuration successful');
        res.status(200).json({ message: 'Webhook configured successfully' });
        return;
      }

      default:
        logger.info(`Ignoring GitHub event: ${event}`);
        res.status(200).json({ message: 'Event ignored' });
        return;
    }

    if (shouldTriggerAnalysis) {
      try {
        // Disparar análisis automáticamente
        logger.info(`Triggering ${analysisType} analysis for project ${project.id}`);

        // Crear registro de análisis
        const analysis = await prisma.analysis.create({
          data: {
            projectId: project.id,
            status: 'PENDING',
            progress: 0,
            analysisType: analysisType as any,
            gitRef: ref,
            isIncremental: analysisType === 'INCREMENTAL',
          },
        });

        // Encolar job
        const queue = getAnalysisQueue();
        const analysisJob = await queue.add(
          'analyze',
          { analysisId: analysis.id, projectId: project.id },
          { attempts: 3, backoff: { type: 'exponential', delay: 2000 } }
        );

        logger.info(`Analysis queued: ${analysis.id} (job: ${analysisJob.id})`);

        res.status(202).json({
          success: true,
          message: 'Analysis triggered',
          analysisId: analysis.id,
          projectId: project.id,
          ref,
        });
      } catch (error) {
        logger.error(`Error triggering analysis: ${error instanceof Error ? error.message : String(error)}`);
        res.status(500).json({ error: 'Failed to trigger analysis' });
      }
    } else {
      res.status(200).json({ message: 'Event processed but no analysis triggered' });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(`Error in /github/webhook: ${msg}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/v1/github/webhooks/configure
 * Configurar webhook en GitHub para un proyecto
 * Requiere token de GitHub del usuario
 */
router.post(
  '/webhooks/configure',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const { projectId, webhookUrl } = req.body;

      if (!userId || !projectId || !webhookUrl) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project || project.userId !== userId) {
        res.status(403).json({ error: 'Unauthorized' });
        return;
      }

      // Obtener GitHub token del usuario
      const userSettings = await prisma.userSettings.findUnique({
        where: { userId },
      });

      if (!userSettings?.githubToken) {
        res.status(400).json({ error: 'GitHub token not configured' });
        return;
      }

      const githubToken = decrypt(userSettings.githubToken);
      const [owner, repo] = project.repositoryUrl.split('/').slice(-2);

      try {
        // Crear webhook en GitHub
        // Generate a cryptographically random secret (32 bytes = 256 bits)
        const webhookSecret = crypto.randomBytes(32).toString('hex');

        const webhookResponse = await axios.post(
          `https://api.github.com/repos/${owner}/${repo}/hooks`,
          {
            name: 'web',
            active: true,
            events: ['push', 'pull_request'],
            config: {
              url: webhookUrl,
              content_type: 'json',
              secret: webhookSecret,
              insecure_ssl: '0',
            },
          },
          {
            headers: {
              Authorization: `token ${githubToken}`,
              Accept: 'application/vnd.github.v3+json',
            },
          }
        );

        logger.info(`Webhook created for ${owner}/${repo}: ${webhookResponse.data.id}`);

        res.json({
          success: true,
          message: 'Webhook configured successfully',
          hookId: webhookResponse.data.id,
          url: webhookResponse.data.config.url,
        });
      } catch (error: any) {
        if (error.response?.status === 422) {
          // Webhook ya existe
          res.status(409).json({ error: 'Webhook already exists for this repository' });
        } else {
          logger.error(`Error creating GitHub webhook: ${error.message}`);
          res.status(500).json({ error: 'Failed to create webhook' });
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error(`Error in /github/webhooks/configure: ${msg}`);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/v1/github/webhooks/:projectId
 * Listar webhooks configurados para un proyecto
 */
router.get(
  '/webhooks/:projectId',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const { projectId } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project || project.userId !== userId) {
        res.status(403).json({ error: 'Unauthorized' });
        return;
      }

      // Obtener GitHub token
      const userSettings = await prisma.userSettings.findUnique({
        where: { userId },
      });

      if (!userSettings?.githubToken) {
        res.status(400).json({ error: 'GitHub token not configured' });
        return;
      }

      const githubToken = decrypt(userSettings.githubToken);
      const [owner, repo] = project.repositoryUrl.split('/').slice(-2);

      const webhooksResponse = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/hooks`,
        {
          headers: {
            Authorization: `token ${githubToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      const webhooks = webhooksResponse.data.map((hook: any) => ({
        id: hook.id,
        url: hook.config.url,
        events: hook.events,
        active: hook.active,
        createdAt: hook.created_at,
        updatedAt: hook.updated_at,
      }));

      res.json({
        success: true,
        webhooks,
        total: webhooks.length,
      });
    } catch (error: any) {
      logger.error(`Error fetching webhooks: ${error.message}`);
      res.status(500).json({ error: 'Failed to fetch webhooks' });
    }
  }
);

/**
 * DELETE /api/v1/github/webhooks/:projectId/:hookId
 * Eliminar webhook de un proyecto
 */
router.delete(
  '/webhooks/:projectId/:hookId',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const { projectId, hookId } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project || project.userId !== userId) {
        res.status(403).json({ error: 'Unauthorized' });
        return;
      }

      // Obtener GitHub token
      const userSettings = await prisma.userSettings.findUnique({
        where: { userId },
      });

      if (!userSettings?.githubToken) {
        res.status(400).json({ error: 'GitHub token not configured' });
        return;
      }

      const githubToken = decrypt(userSettings.githubToken);
      const [owner, repo] = project.repositoryUrl.split('/').slice(-2);

      await axios.delete(
        `https://api.github.com/repos/${owner}/${repo}/hooks/${hookId}`,
        {
          headers: {
            Authorization: `token ${githubToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      logger.info(`Webhook deleted: ${hookId} for ${owner}/${repo}`);

      res.json({
        success: true,
        message: 'Webhook deleted successfully',
      });
    } catch (error: any) {
      if (error.response?.status === 404) {
        res.status(404).json({ error: 'Webhook not found' });
      } else {
        logger.error(`Error deleting webhook: ${error.message}`);
        res.status(500).json({ error: 'Failed to delete webhook' });
      }
    }
  }
);

export default router;
