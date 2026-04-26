/**
 * Construye LLMConfig desde UserSettings (misma lógica que el worker de análisis).
 */

import { prisma } from './prisma.service';
import { decrypt } from './crypto.service';
import { logger } from './logger.service';
import type { LLMConfig } from './llm-client.service';

export async function getLLMConfigFromUser(userId: string | null): Promise<LLMConfig | undefined> {
  if (!userId) {
    return undefined;
  }

  const userSettings = await prisma.userSettings.findUnique({
    where: { userId },
    select: {
      llmProvider: true,
      llmBaseUrl: true,
      llmModel: true,
      llmApiKey: true,
      llmCustomHeaders: true,
    },
  });

  if (!userSettings) {
    return undefined;
  }

  const provider = (userSettings.llmProvider || 'anthropic') as LLMConfig['provider'];

  let decryptedApiKey: string | undefined;
  if (userSettings.llmApiKey) {
    try {
      decryptedApiKey = decrypt(userSettings.llmApiKey);
    } catch {
      logger.error(`Failed to decrypt LLM API key for user ${userId}`);
    }
  }

  let customHeaders: Record<string, string> | undefined;
  if (userSettings.llmCustomHeaders) {
    try {
      customHeaders = JSON.parse(userSettings.llmCustomHeaders) as Record<string, string>;
    } catch {
      logger.error(`Failed to parse custom headers for user ${userId}`);
    }
  }

  const baseConfig: LLMConfig = {
    provider,
    model: userSettings.llmModel || 'default',
  };

  switch (provider) {
    case 'anthropic':
      return {
        ...baseConfig,
        model: userSettings.llmModel || 'claude-sonnet-4-6',
        apiKey: decryptedApiKey || process.env['ANTHROPIC_API_KEY'],
      };

    case 'openai':
      if (!decryptedApiKey) {
        logger.warn(`OpenAI provider requires API key for user ${userId}`);
        return undefined;
      }
      return {
        ...baseConfig,
        apiKey: decryptedApiKey,
        baseUrl: userSettings.llmBaseUrl,
      };

    case 'llm-gateway':
      if (!decryptedApiKey || !userSettings.llmBaseUrl) {
        logger.warn(`LLM Gateway requires API key and baseUrl for user ${userId}`);
        return undefined;
      }
      return {
        ...baseConfig,
        apiKey: decryptedApiKey,
        baseUrl: userSettings.llmBaseUrl,
        customHeaders,
      };

    case 'lmstudio':
    case 'ollama':
    case 'openai-compatible':
    case 'custom':
      if (!userSettings.llmBaseUrl) {
        logger.warn(`Provider ${provider} requires baseUrl for user ${userId}`);
        return undefined;
      }
      return {
        ...baseConfig,
        baseUrl: userSettings.llmBaseUrl,
        apiKey: decryptedApiKey,
        customHeaders,
      };

    default:
      logger.warn(`Unknown LLM provider: ${provider}`);
      return undefined;
  }
}
