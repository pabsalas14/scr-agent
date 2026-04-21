/**
 * ============================================================================
 * LLM Client Service - Abstracción para múltiples proveedores
 * ============================================================================
 *
 * Soporta:
 * - Anthropic Claude (APIKey)
 * - OpenAI (APIKey + API endpoint)
 * - LM Studio (OpenAI-compatible, local)
 * - Ollama (OpenAI-compatible, local)
 * - LLM Gateway (LLM routing/fallback)
 * - OpenAI-compatible (genérico)
 * - Custom/Self-hosted (genérico OpenAI-compatible)
 *
 * Uso: const client = new LLMClient(config); client.complete(prompt, maxTokens)
 */

import Anthropic from '@anthropic-ai/sdk';
import axios, { AxiosInstance } from 'axios';
import { logger } from './logger.service';

export type LLMProvider =
  | 'anthropic'
  | 'openai'
  | 'lmstudio'
  | 'ollama'
  | 'llm-gateway'
  | 'openai-compatible'
  | 'custom';

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  apiKey?: string; // Para Anthropic, OpenAI, LLM Gateway
  baseUrl?: string; // Para OpenAI-compatible, LM Studio, Ollama, LLM Gateway, Custom
  apiVersion?: string; // Para algunos proveedores (ej: Azure OpenAI)
  temperature?: number;
  maxTokens?: number;
  customHeaders?: Record<string, string>; // Headers personalizados para Custom/LLM Gateway
  signal?: AbortSignal; // Para cancelación de peticiones
}

export interface LLMResponse {
  text: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

export class LLMClient {
  private config: LLMConfig;
  private anthropicClient: Anthropic | null = null;
  private axiosClient: AxiosInstance | null = null;

  constructor(config: LLMConfig) {
    this.config = {
      temperature: 0.7,
      maxTokens: 512, // Reduced from 4096 to ~1/8 to leave room for input tokens (~3.5K)
      ...config,
    };
    this.validateConfig();
  }

  private validateConfig(): void {
    if (!this.config.model) {
      throw new Error('LLM model must be configured');
    }

    // Validar por proveedor específico
    switch (this.config.provider) {
      case 'anthropic':
        // API key can be empty, will use env var or fail at runtime if not available
        break;

      case 'openai':
        if (!this.config.apiKey) {
          throw new Error('OpenAI API key is required');
        }
        break;

      case 'llm-gateway':
        if (!this.config.baseUrl) {
          throw new Error('LLM Gateway base URL is required');
        }
        if (!this.config.apiKey) {
          throw new Error('LLM Gateway API key is required');
        }
        break;

      case 'lmstudio':
      case 'ollama':
      case 'openai-compatible':
      case 'custom':
        if (!this.config.baseUrl) {
          throw new Error(`Base URL is required for ${this.config.provider}`);
        }
        break;

      default:
        throw new Error(`Unknown LLM provider: ${this.config.provider}`);
    }
  }

  /**
   * Ejecutar completion con el proveedor configurado
   * @param prompt - Contenido del usuario (datos/código a procesar)
   * @param maxTokens - Máximo de tokens en la respuesta
   * @param systemPrompt - Instrucciones del sistema (role/comportamiento del agente)
   */
  async complete(prompt: string, maxTokens?: number, systemPrompt?: string): Promise<LLMResponse> {
    const tokens = maxTokens || this.config.maxTokens || 4096;

    // Verificar si se pidió cancelación antes de empezar
    if (this.config.signal?.aborted) {
      throw new Error('Analysis cancelled by user');
    }

    try {
      switch (this.config.provider) {
        case 'anthropic':
          return await this.completeWithAnthropic(prompt, tokens, systemPrompt);

        case 'openai':
          return await this.completeWithOpenAI(prompt, tokens, systemPrompt);

        case 'llm-gateway':
          return await this.completeWithLLMGateway(prompt, tokens, systemPrompt);

        case 'lmstudio':
        case 'ollama':
        case 'openai-compatible':
        case 'custom':
          return await this.completeWithOpenAICompatible(prompt, tokens, systemPrompt);

        default:
          throw new Error(`Unsupported provider: ${this.config.provider}`);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error(`LLMClient error (${this.config.provider}): ${msg}`);
      throw error;
    }
  }

  /**
   * Completar usando Anthropic
   */
  private async completeWithAnthropic(prompt: string, maxTokens: number, systemPrompt?: string): Promise<LLMResponse> {
    if (!this.anthropicClient) {
      const key = this.config.apiKey || process.env['ANTHROPIC_API_KEY'];
      if (!key) {
        throw new Error('ANTHROPIC_API_KEY not configured');
      }
      this.anthropicClient = new Anthropic({ apiKey: key });
    }

    const response = await this.anthropicClient.messages.create({
      model: this.config.model,
      max_tokens: maxTokens,
      temperature: this.config.temperature,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content
      .filter((block) => block.type === 'text')
      .map((block) => ('text' in block ? block.text : ''))
      .join('\n')
      .trim();

    return {
      text,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      model: response.model,
    };
  }

  /**
   * Completar usando OpenAI API
   */
  private async completeWithOpenAI(prompt: string, maxTokens: number, systemPrompt?: string): Promise<LLMResponse> {
    if (!this.axiosClient) {
      const baseUrl = this.config.baseUrl || 'https://api.openai.com/v1';
      this.axiosClient = axios.create({
        baseURL: baseUrl,
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      });
    }

    const messages: any[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await this.axiosClient.post('/chat/completions', {
      model: this.config.model,
      messages,
      temperature: this.config.temperature || 0.7,
      max_tokens: maxTokens,
    });

    const data = response.data;
    const choice = data.choices?.[0];

    if (!choice) {
      throw new Error(`Invalid response from OpenAI: ${JSON.stringify(data)}`);
    }

    const text = choice.message?.content || '';
    const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0 };

    return {
      text,
      inputTokens: usage.prompt_tokens || 0,
      outputTokens: usage.completion_tokens || 0,
      model: this.config.model,
    };
  }

  /**
   * Completar usando LLM Gateway
   */
  private async completeWithLLMGateway(prompt: string, maxTokens: number, systemPrompt?: string): Promise<LLMResponse> {
    if (!this.axiosClient) {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      if (this.config.customHeaders) {
        Object.assign(headers, this.config.customHeaders);
      }

      this.axiosClient = axios.create({
        baseURL: this.config.baseUrl,
        headers,
        timeout: 120000,
      });
    }

    const messages: any[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await this.axiosClient.post('/chat/completions', {
      model: this.config.model,
      messages,
      temperature: this.config.temperature || 0.7,
      max_tokens: maxTokens,
    });

    const data = response.data;
    const choice = data.choices?.[0];

    if (!choice) {
      throw new Error(`Invalid response from LLM Gateway: ${JSON.stringify(data)}`);
    }

    const text = choice.message?.content || '';
    const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0 };

    return {
      text,
      inputTokens: usage.prompt_tokens || 0,
      outputTokens: usage.completion_tokens || 0,
      model: this.config.model,
    };
  }

  /**
   * Completar usando servidor OpenAI-compatible (LM Studio, Ollama, Custom, etc)
   */
  private async completeWithOpenAICompatible(prompt: string, maxTokens: number, systemPrompt?: string): Promise<LLMResponse> {
    if (!this.axiosClient) {
      const baseUrl = this.config.baseUrl || 'http://localhost:1234';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }
      if (this.config.customHeaders) {
        Object.assign(headers, this.config.customHeaders);
      }
      logger.info(`[LLM Init] Creating axios client for ${this.config.provider}`, {
        baseUrl,
        headers,
        hasApiKey: !!this.config.apiKey,
      });
      this.axiosClient = axios.create({
        baseURL: baseUrl,
        timeout: 900000, // 15 minutos para modelos locales (qwen2.5-coder needs time for code analysis + JSON generation)
                         // MUST be >= adaptive timeout in inspector.agent.ts (10-15 min based on health)
        headers,
      });
      logger.info(`[LLM Init] Axios client created successfully`);
    }

    // Add request interceptor for logging
    if (!this.axiosClient.interceptors.request.handlers || this.axiosClient.interceptors.request.handlers.length === 0) {
      this.axiosClient.interceptors.request.use((config) => {
        logger.info(`[LLM Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
          headers: config.headers,
          dataSize: JSON.stringify(config.data).length,
        });
        return config;
      });
    }

    let response;
    try {
      const messages: any[] = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      const payload = {
        model: this.config.model,
        messages,
        temperature: this.config.temperature,
        max_tokens: maxTokens,
      };

      logger.info(`[LLM Debug] Sending request to ${this.config.provider}: ${this.config.baseUrl}/chat/completions`, {
        model: this.config.model,
        payloadSize: JSON.stringify(payload).length,
        promptLength: prompt.length,
        hasSystemPrompt: !!systemPrompt,
        systemPromptLength: systemPrompt?.length || 0,
        temperature: this.config.temperature,
        maxTokens: maxTokens,
        hasSignal: !!this.config.signal,
        signalAborted: this.config.signal?.aborted,
      });

      response = await this.axiosClient.post('/chat/completions', payload, {
        signal: this.config.signal,
      });
      logger.info(`[LLM Debug] Success response from ${this.config.provider}`);
    } catch (error: any) {
      // Log detailed error information for debugging
      const errorDetails = {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        axiosConfig: {
          baseURL: this.axiosClient?.defaults.baseURL,
          headers: this.axiosClient?.defaults.headers,
          timeout: this.axiosClient?.defaults.timeout,
          model: this.config.model,
          provider: this.config.provider,
        },
      };
      logger.error(`[LLM Debug] Request failed: ${JSON.stringify(errorDetails, null, 2)}`);
      // Include more details in the error message for debugging
      const detailedError = new Error(
        `LLM request failed: ${error.response?.status || error.code} - ${error.response?.statusText || error.message}` +
        (error.response?.data ? ` - ${JSON.stringify(error.response.data)}` : '')
      );
      throw detailedError;
    }

    const data = response.data;
    const choice = data.choices?.[0];

    if (!choice) {
      throw new Error(`Invalid response from ${this.config.provider}: ${JSON.stringify(data)}`);
    }

    const text = choice.message?.content || '';

    // Algunos servidores OpenAI-compatible devuelven usage, otros no
    const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0 };

    return {
      text,
      inputTokens: usage.prompt_tokens || 0,
      outputTokens: usage.completion_tokens || 0,
      model: this.config.model,
    };
  }

  /**
   * Cambiar configuración dinámicamente
   */
  updateConfig(config: Partial<LLMConfig>): void {
    const oldConfig = this.config;
    this.config = { ...this.config, ...config };
    // Limpiar clientes al cambiar config
    this.anthropicClient = null;
    this.axiosClient = null;

    logger.info(`LLMClient config before update:`, {
      provider: oldConfig?.provider,
      model: oldConfig?.model,
      hasBaseUrl: !!oldConfig?.baseUrl,
    });
    logger.info(`LLMClient config update received:`, {
      provider: config.provider,
      model: config.model,
      hasBaseUrl: !!config.baseUrl,
      hasSignal: !!config.signal,
    });

    this.validateConfig();
    logger.info(`LLMClient config after update:`, {
      provider: this.config.provider,
      model: this.config.model,
      baseUrl: this.config.baseUrl,
      hasSignal: !!this.config.signal,
    });
  }

  /**
   * Obtener configuración actual
   */
  getConfig(): LLMConfig {
    return { ...this.config };
  }
}
