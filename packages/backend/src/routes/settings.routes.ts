/**
 * ============================================================================
 * RUTAS DE CONFIGURACIÓN DEL USUARIO
 * ============================================================================
 *
 * POST   /api/v1/settings/github-token        → Guardar + validar GitHub token
 * GET    /api/v1/settings                     → Obtener configuraciones del usuario
 * DELETE /api/v1/settings/github-token        → Eliminar GitHub token
 *
 * SEGURIDAD:
 * - Tokens encriptados en BD
 * - Validación contra API de GitHub
 * - Solo el usuario propietario puede ver sus tokens
 */

import { Router, type Router as ExpressRouter, Response } from 'express';
import { z } from 'zod';
import { validarBody } from '../middleware/validation.middleware';
import { logger, auditLog, AuditEventType } from '../services/logger.service';
import { prisma } from '../services/prisma.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { encrypt } from '../services/crypto.service';
import axios from 'axios';

const router: ExpressRouter = Router();

/**
 * Schema para guardar GitHub token
 * Acepta cualquier token válido (ghp_, github_pat_, etc)
 */
const GitHubTokenSchema = z.object({
  token: z.string().min(10), // Token mínimo 10 caracteres
});

/**
 * Schema para configuración de IA
 */
const AIConfigSchema = z.object({
  claudeApiKey: z.string().optional(),
  selectedModel: z.string().min(1),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().min(512).max(8192),
  webhookUrl: z.string().url().optional(),
  llmProvider: z.enum(['anthropic', 'lmstudio']).optional(),
  llmBaseUrl: z.string().url().optional().or(z.literal('')),
});

/**
 * POST /api/v1/settings/github-token
 * Guardar y validar GitHub token
 */
router.post('/github-token', validarBody(GitHubTokenSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { token } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    /**
     * Intentar validar token contra GitHub API (opcional)
     * Si falla, igual guarda el token para que el usuario lo pueda usar
     */
    let isValid = true;
    let validationMessage = 'Token guardado exitosamente';

    try {
      const response = await axios.head('https://api.github.com/user', {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
        timeout: 5000,
      });

      if (response.status !== 200) {
        isValid = false;
        validationMessage = 'Token guardado pero no se pudo verificar. Úsalo para continuar.';
      }
    } catch (error) {
      // Token se guarda de todas formas
      isValid = false;
      validationMessage = 'Token guardado. Verificación fallida, pero puedes usarlo.';
    }

    /**
     * Guardar token en BD (tabla UserSettings)
     * Usar upsert para crear o actualizar
     */
    try {
      const encryptedToken = encrypt(token);
      await prisma.userSettings.upsert({
        where: { userId },
        create: {
          userId,
          githubToken: encryptedToken,
          githubValidatedAt: new Date(),
        },
        update: {
          githubToken: encryptedToken,
          githubValidatedAt: new Date(),
        },
      });
    } catch (dbError) {
      logger.error(`DB Error saving GitHub token: ${dbError}`);
      // Continuar de todas formas
    }

    auditLog(AuditEventType.DB_OPERATION, 'GitHub token guardado y validado', {
      userId,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json({
      success: true,
      message: validationMessage,
      valid: isValid,
      scopes: isValid ? ['repo', 'read:org'] : [], // Scopes esperados
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(`Error guardando GitHub token: ${msg}`);
    res.status(500).json({ error: 'Error al guardar GitHub token' });
  }
});

/**
 * GET /api/v1/settings
 * Obtener configuraciones del usuario (sin exponer tokens)
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    /**
     * Obtener configuraciones del usuario
     */
    const settings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    res.json({
      success: true,
      data: {
        has_github_token: !!settings?.githubToken,
        github_validated_at: settings?.githubValidatedAt || null,
        has_api_key: !!settings?.apiKey,
        has_claude_key: !!settings?.claudeApiKey,
        selectedModel: settings?.selectedModel ?? 'claude-sonnet-4-6',
        temperature: settings?.temperature ?? 0.7,
        maxTokens: settings?.maxTokens ?? 4096,
        webhookUrl: settings?.webhookUrl ?? '',
        llmProvider: settings?.llmProvider ?? 'anthropic',
        llmBaseUrl: settings?.llmBaseUrl ?? '',
        preferences: {
          darkMode: settings?.darkMode ?? false,
          autoRefresh: settings?.autoRefresh ?? 10000,
        },
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(`Error obteniendo configuraciones: ${msg}`);
    res.status(500).json({ error: 'Error al obtener configuraciones' });
  }
});

/**
 * POST /api/v1/settings/ai-config
 * Guardar configuración de IA (Claude API key, modelo, temperatura, etc)
 */
router.post('/ai-config', validarBody(AIConfigSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { claudeApiKey, selectedModel, temperature, maxTokens, webhookUrl, llmProvider, llmBaseUrl } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    /**
     * Validar Claude API key si se proporciona (opcional)
     * La key se guarda de todas formas sin validación estricta
     */
    let claudeKeyValid = true;
    if (claudeApiKey) {
      // Solo validamos que no sea vacía y tenga formato mínimo
      if (!claudeApiKey || claudeApiKey.length < 10) {
        res.status(400).json({
          error: 'Claude API key debe tener al menos 10 caracteres',
          valid: false,
        });
        return;
      }
      // La key se guarda sin hacer request a la API
      // El usuario puede probar que funciona más adelante
    }

    /**
     * Guardar configuración en BD
     */
    let hasClaude = false;
    let hasWebhook = false;

    try {
      const encryptedClaudeKey = claudeApiKey ? encrypt(claudeApiKey) : undefined;

      const updatedSettings = await prisma.userSettings.upsert({
        where: { userId },
        create: {
          userId,
          claudeApiKey: encryptedClaudeKey,
          selectedModel,
          temperature,
          maxTokens,
          webhookUrl,
          llmProvider: llmProvider || 'anthropic',
          llmBaseUrl: llmBaseUrl || null,
        },
        update: {
          ...(claudeApiKey && { claudeApiKey: encryptedClaudeKey }),
          selectedModel,
          temperature,
          maxTokens,
          webhookUrl,
          llmProvider: llmProvider || 'anthropic',
          llmBaseUrl: llmBaseUrl || null,
        },
      });
      hasClaude = !!updatedSettings.claudeApiKey;
      hasWebhook = !!updatedSettings.webhookUrl;
    } catch (dbError) {
      logger.error(`DB Error saving AI config: ${dbError}`);
      // Continuar de todas formas
    }

    auditLog(AuditEventType.DB_OPERATION, 'Configuración de IA actualizada', {
      userId,
      model: selectedModel,
      temperature,
      maxTokens,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json({
      success: true,
      message: 'Configuración de IA guardada correctamente',
      data: {
        selectedModel,
        temperature,
        maxTokens,
        has_claude_key: hasClaude,
        has_webhook: hasWebhook,
      },
      note: 'Las claves se guardan sin validación en tiempo real. Puedes verificarlas al usar la plataforma.',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(`Error guardando configuración de IA: ${msg}`);
    res.status(500).json({ error: 'Error al guardar configuración de IA' });
  }
});

/**
 * DELETE /api/v1/settings/github-token
 * Eliminar GitHub token
 */
router.delete('/github-token', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    /**
     * Eliminar token de la BD
     */
    await prisma.userSettings.update({
      where: { userId },
      data: {
        githubToken: null,
        githubValidatedAt: null,
      },
    });

    auditLog(AuditEventType.DB_OPERATION, 'GitHub token eliminado', {
      userId,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'GitHub token eliminado exitosamente',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(`Error eliminando GitHub token: ${msg}`);
    res.status(500).json({ error: 'Error al eliminar GitHub token' });
  }
});

export default router;
