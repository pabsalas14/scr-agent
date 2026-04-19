import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';
import { logger } from './logger.service';

export type LLMProvider = 'anthropic' | 'lmstudio';
export type AgentRole = 'inspector' | 'detective' | 'fiscal';

export interface LLMResponse {
  text: string;
  usage: { input_tokens: number; output_tokens: number; model: string };
}

const DEFAULT_ANTHROPIC_MODELS: Record<AgentRole, string> = {
  inspector: 'claude-sonnet-4-6',
  detective: 'claude-haiku-4-5-20251001',
  fiscal: 'claude-sonnet-4-6',
};

const DEFAULT_LMSTUDIO_MODEL = 'qwen2.5-coder-7b-instruct';

export class LLMClient {
  private anthropic: Anthropic | null = null;

  constructor(
    private readonly provider: LLMProvider,
    private readonly model: string,
    private readonly anthropicApiKey?: string,
    private readonly lmstudioBaseUrl: string = 'http://localhost:1234/v1'
  ) {}

  getModel(): string {
    return this.model;
  }

  getProvider(): LLMProvider {
    return this.provider;
  }

  async complete(prompt: string, maxTokens: number): Promise<LLMResponse> {
    logger.info(`LLMClient [${this.provider}] modelo: ${this.model}`);
    return this.provider === 'lmstudio'
      ? this.completeLMStudio(prompt, maxTokens)
      : this.completeAnthropic(prompt, maxTokens);
  }

  private async completeAnthropic(prompt: string, maxTokens: number): Promise<LLMResponse> {
    if (!this.anthropic) {
      const key = this.anthropicApiKey || process.env['ANTHROPIC_API_KEY'];
      if (!key) throw new Error('ANTHROPIC_API_KEY no configurado');
      this.anthropic = new Anthropic({ apiKey: key });
    }

    const response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => ('text' in b ? b.text : ''))
      .join('\n')
      .trim();

    return {
      text,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
        model: response.model,
      },
    };
  }

  private async completeLMStudio(prompt: string, maxTokens: number): Promise<LLMResponse> {
    const response = await axios.post(
      `${this.lmstudioBaseUrl}/chat/completions`,
      {
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        stream: false,
        temperature: 0.1,
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 300_000,
      }
    );

    const text: string = response.data.choices?.[0]?.message?.content ?? '';
    const usage = response.data.usage ?? {};

    return {
      text,
      usage: {
        input_tokens: usage.prompt_tokens ?? 0,
        output_tokens: usage.completion_tokens ?? 0,
        model: response.data.model ?? this.model,
      },
    };
  }
}

export interface UserLLMConfig {
  apiKey?: string;
  provider?: LLMProvider;
  model?: string;
  lmstudioBaseUrl?: string;
}

export function createLLMClient(role: AgentRole, userConfig?: UserLLMConfig): LLMClient {
  // User config takes priority over env vars
  const provider: LLMProvider =
    userConfig?.provider ||
    (process.env['LLM_PROVIDER'] as LLMProvider | undefined) ||
    'anthropic';

  if (provider === 'lmstudio') {
    const model =
      userConfig?.model ||
      process.env[`LMSTUDIO_${role.toUpperCase()}_MODEL`] ||
      process.env['LMSTUDIO_MODEL'] ||
      DEFAULT_LMSTUDIO_MODEL;
    const baseUrl =
      userConfig?.lmstudioBaseUrl ||
      process.env['LMSTUDIO_BASE_URL'] ||
      'http://localhost:1234/v1';
    return new LLMClient('lmstudio', model, undefined, baseUrl);
  }

  const model =
    userConfig?.model ||
    process.env[`ANTHROPIC_${role.toUpperCase()}_MODEL`] ||
    process.env['ANTHROPIC_MODEL'] ||
    DEFAULT_ANTHROPIC_MODELS[role];

  return new LLMClient(
    'anthropic',
    model,
    userConfig?.apiKey || process.env['ANTHROPIC_API_KEY']
  );
}
