/**
 * ============================================================================
 * LLM Client Service - Abstracción para múltiples proveedores
 * ============================================================================
 *
 * Soporta:
 * - Anthropic Claude (APIKey)
 * - LM Studio (OpenAI-compatible, localhost:1234)
 * - Ollama (OpenAI-compatible)
 * - Otros servidores OpenAI-compatible
 *
 * Uso: const client = new LLMClient(config); client.complete(prompt, maxTokens)
 */

import Anthropic from '@anthropic-ai/sdk';
import axios, { AxiosInstance } from 'axios';
import { logger } from './logger.service';

export type LLMProvider = 'anthropic' | 'lmstudio' | 'ollama' | 'openai-compatible';

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  apiKey?: string; // Para Anthropic
  baseUrl?: string; // Para OpenAI-compatible
  temperature?: number;
  maxTokens?: number;
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
      maxTokens: 4096,
      ...config,
    };
    this.validateConfig();
  }

  private validateConfig(): void {
    if (!this.config.model) {
      throw new Error('LLM model must be configured');
    }

    if (this.config.provider === 'anthropic' && !this.config.apiKey) {
      throw new Error('Anthropic API key is required');
    }

    if (
      ['lmstudio', 'ollama', 'openai-compatible'].includes(this.config.provider) &&
      !this.config.baseUrl
    ) {
      throw new Error(`Base URL is required for ${this.config.provider}`);
    }
  }

  /**
   * Ejecutar completion con el proveedor configurado
   */
  async complete(prompt: string, maxTokens?: number): Promise<LLMResponse> {
    const tokens = maxTokens || this.config.maxTokens || 4096;

    try {
      if (this.config.provider === 'anthropic') {
        return await this.completeWithAnthropic(prompt, tokens);
      } else {
        return await this.completeWithOpenAICompatible(prompt, tokens);
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
  private async completeWithAnthropic(prompt: string, maxTokens: number): Promise<LLMResponse> {
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
   * Completar usando servidor OpenAI-compatible (LM Studio, Ollama, etc)
   */
  private async completeWithOpenAICompatible(prompt: string, maxTokens: number): Promise<LLMResponse> {
    if (!this.axiosClient) {
      const baseUrl = this.config.baseUrl || 'http://localhost:1234';
      this.axiosClient = axios.create({
        baseURL: baseUrl,
        timeout: 120000, // 2 minutos para modelos locales
      });
    }

    const response = await this.axiosClient.post('/chat/completions', {
      model: this.config.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: this.config.temperature,
      max_tokens: maxTokens,
    });

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
    this.config = { ...this.config, ...config };
    // Limpiar clientes al cambiar config
    this.anthropicClient = null;
    this.axiosClient = null;
    this.validateConfig();
    logger.info(`LLMClient config updated: ${this.config.provider} / ${this.config.model}`);
  }

  /**
   * Obtener configuración actual
   */
  getConfig(): LLMConfig {
    return { ...this.config };
  }
}
