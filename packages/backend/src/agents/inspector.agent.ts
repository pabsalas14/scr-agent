/**
 * ============================================================================
 * AGENTE MALICIA - Detector de Código Malicioso
 * ============================================================================
 *
 * Responsabilidades:
 * - Analizar código fuente en busca de patrones maliciosos
 * - Identificar backdoors, lógica oculta, funciones sospechosas
 * - Generar hallazgos con severidad y recomendaciones de remediación
 *
 * Entrada: Código fuente (por archivo o repositorio)
 * Salida: MaliciaOutput con hallazgos detallados
 */

import { logger, auditLog, AuditEventType } from '../services/logger.service';
import { cacheService, CacheType } from '../services/cache.service';
import { LLMClient, LLMConfig } from '../services/llm-client.service';
import { MaliciaInput, MaliciaOutput, MaliciaFinding } from '../types/agents';
import { rateLimiter } from '../services/rate-limiter.service';
import { circuitBreaker } from '../services/circuit-breaker.service';
import { codeCompressor } from '../services/code-compressor.service';
import { lmStudioHealthChecker } from '../services/lm-studio-health.service';

/**
 * System Prompt para el Inspector (v2 - Optimized for Qwen)
 * Define el rol y comportamiento del agente
 * (~400 tokens - centralized, complete instructions)
 */
const INSPECTOR_SYSTEM_PROMPT = `You are a senior security code analyzer specializing in malicious code detection.

CRITICAL: You MUST respond with ONLY a JSON object. No other text, no explanations, no observations.

Your expertise covers:
1. BACKDOORS: Hidden entry points, unauthorized access mechanisms, reverse shells
2. INJECTIONS: SQL injection, command injection, code injection
3. BOMB: Time-delayed malicious code, event-triggered payloads
4. OBFUSCATION: Deliberately hidden/encrypted logic, code packing
5. SECRET: API keys, passwords, tokens, credentials in source code
6. EVAL: Dynamic code execution (eval, exec, dangerous process spawning)
7. OTHER: Other security threats not in above categories

Analysis Rules:
- Examine ALL code paths
- Look for suspicious imports, network calls, file I/O, system commands
- Avoid false positives: legitimate security code is NOT a backdoor
- Rate severity based on exploitability and impact
- Be precise: exact file paths, exact line numbers

Severity Levels (choose EXACTLY one):
- CRÍTICO: Immediate compromise risk, easily exploitable, high impact
- ALTO: Serious vulnerability, high impact if exploited
- MEDIO: Security weakness that could be chained with other issues
- BAJO: Minor security issue or low-impact vulnerability

REQUIRED OUTPUT FORMAT (and ONLY this format):
{
  "hallazgos": [
    {
      "archivo": "path/to/file.js",
      "linea": 42,
      "tipo": "BACKDOOR",
      "severidad": "CRÍTICO",
      "descripcion": "Exact explanation of why this is a security threat"
    }
  ]
}

FIELD REQUIREMENTS:
- "hallazgos": Array of findings. If no issues, use empty array []
- "archivo": Exact file path from code (string, must include file extension)
- "linea": Line number where issue starts (integer, NOT a string)
- "tipo": EXACTLY one of: BACKDOOR, INJECTION, BOMB, OBFUSCATION, SECRET, EVAL, OTHER
- "severidad": EXACTLY one of: CRÍTICO, ALTO, MEDIO, BAJO
- "descripcion": Clear technical explanation (string, max 250 chars)

CRITICAL RULES:
1. Respond with ONLY valid JSON - no text before or after
2. Use EXACTLY the field names shown
3. Use EXACTLY the allowed values for "tipo" and "severidad"
4. Line numbers must be integers, not strings or ranges
5. Do NOT add extra fields or sections
6. Do NOT include explanations outside the JSON
7. If there are no findings, respond: {"hallazgos":[]}

Now analyze the provided code and respond with ONLY the JSON object.`;

/**
 * Tamaño máximo de código por llamada al LLM
 *
 * LM Studio's qwen2.5-coder-7b-instruct has a 4K token context window (~3000 tokens for analysis).
 *
 * Token budget breakdown:
 * - System prompt (centralized): ~150 tokens
 * - Code to analyze: ~1200 tokens (at ~1 token per 4 bytes)
 * - JSON structure requirement: ~300 tokens
 * - Response space: ~800 tokens (allocated via maxOutputTokens)
 * Total needed: ~2800 tokens (fits in 4K with safety margin)
 *
 * Aggressively reduced from 1200 to 800 bytes to ensure model has enough space
 * to generate coherent JSON output without token overflow errors.
 */
const MAX_CHUNK_BYTES = 800; // Aggressively reduced for Qwen 4K context limit

/**
 * Servicio del Agente Inspector
 */
export class InspectorAgentService {
  private llmClient: LLMClient | null = null;
  private llmConfig: LLMConfig | null = null;
  private model = 'claude-sonnet-4-6';

  constructor(llmConfig?: LLMConfig) {
    this.llmConfig = llmConfig || this.getDefaultConfig();
    this.initLLMClient();
  }

  /**
   * Configuración por defecto (Anthropic - fallback)
   * En producción, usar config del usuario (que puede ser Qwen, Anthropic, etc)
   */
  private getDefaultConfig(): LLMConfig {
    return {
      provider: 'anthropic',
      model: this.model,
      apiKey: process.env['ANTHROPIC_API_KEY'],
    };
  }

  /**
   * Inicializar cliente LLM
   */
  private initLLMClient(): void {
    if (!this.llmConfig) {
      this.llmConfig = this.getDefaultConfig();
    }
    this.llmClient = new LLMClient(this.llmConfig);
  }

  /**
   * Actualizar configuración dinámicamente
   */
  updateConfig(llmConfig: LLMConfig): void {
    this.llmConfig = llmConfig;
    this.initLLMClient();
    logger.info(`InspectorAgent: LLM config actualizada (${llmConfig.provider}/${llmConfig.model})`);
  }

  /**
   * Obtener cliente LLM
   */
  private getLLMClient(): LLMClient {
    if (!this.llmClient) {
      this.initLLMClient();
    }
    return this.llmClient!;
  }

  /**
   * Analizar lista de archivos con chunking automático para repos grandes.
   * Implementa RETRY + BACKOFF strategy:
   * - 1er intento: 15 minutos timeout
   * - 2do intento: 25 minutos timeout
   * - 3er intento: 30 minutos timeout
   * - Si falla 3 veces: Marcar como FAILED pero continuar
   *
   * PARAMS OPCIONALES:
   * - progressCallback?: (processedChunks, totalChunks) => void
   *   Se llama después de procesar cada chunk para actualizar progreso
   */
  async analizarArchivos(
    archivos: Array<{ path: string; content: string }>,
    contexto?: string,
    progressCallback?: (processedChunks: number, totalChunks: number) => Promise<void>
  ): Promise<MaliciaOutput> {
    const startTime = Date.now();
    const chunks = this.splitEnChunks(archivos);
    logger.info(`Inspector: ${archivos.length} archivos → ${chunks.length} chunk(s) de análisis`);

    // Log chunk sizes for debugging
    chunks.forEach((chunk, i) => {
      const chunkSize = chunk.reduce((sum, f) => sum + f.content.length, 0);
      logger.info(`Chunk ${i + 1}: ${chunk.length} archivos, ${chunkSize} bytes`);
    });

    // ============================================================================
    // RETRY + BACKOFF STRATEGY
    // ============================================================================
    const RETRY_TIMEOUTS = [15 * 60 * 1000, 25 * 60 * 1000, 30 * 60 * 1000]; // 15, 25, 30 minutes
    const MAX_RETRIES = 3;

    interface ChunkResult {
      index: number;
      resultado?: MaliciaOutput;
      error?: string;
      attempts: number;
    }

    // Primera pasada: Procesar chunks normalmente
    const resultados: (MaliciaOutput | null)[] = new Array(chunks.length).fill(null);
    const failedChunks: ChunkResult[] = [];

    for (let i = 0; i < chunks.length; i++) {
      try {
        const resultado = await Promise.race([
          this.analizarCodigo({
            codigo: chunks[i].map((f) => `// === ${f.path} ===\n${f.content}`).join('\n\n'),
            contexto: chunks.length > 1 ? `${contexto ?? ''} [Parte ${i + 1}/${chunks.length}]` : contexto,
          }),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error(`Chunk ${i + 1}/${chunks.length} timeout`)),
              RETRY_TIMEOUTS[0] // First attempt: 15 minutes
            )
          ) as any,
        ]);

        resultados[i] = resultado;
        logger.info(`✅ Chunk ${i + 1}/${chunks.length} procesado exitosamente`);

        // Reportar progreso después de cada chunk
        if (progressCallback) {
          try {
            await progressCallback(i + 1, chunks.length);
          } catch (error) {
            logger.error(`Error reportando progreso: ${error}`);
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.warn(`⚠️ Chunk ${i + 1}/${chunks.length} falló (intento 1/${MAX_RETRIES}): ${errorMsg}`);
        failedChunks.push({
          index: i,
          error: errorMsg,
          attempts: 1,
        });
      }
    }

    // Segunda pasada: Reintentar chunks fallidos con backoff
    if (failedChunks.length > 0) {
      logger.info(`🔄 Reintentando ${failedChunks.length} chunks fallidos...`);

      for (const failedChunk of failedChunks) {
        let success = false;

        for (let attempt = 1; attempt < MAX_RETRIES; attempt++) {
          try {
            logger.info(`🔄 Chunk ${failedChunk.index + 1}/${chunks.length} intento ${attempt + 1}/${MAX_RETRIES}...`);

            const resultado = await Promise.race([
              this.analizarCodigo({
                codigo: chunks[failedChunk.index].map((f) => `// === ${f.path} ===\n${f.content}`).join('\n\n'),
                contexto: chunks.length > 1 ? `${contexto ?? ''} [Parte ${failedChunk.index + 1}/${chunks.length} - Retry ${attempt}]` : contexto,
              }),
              new Promise((_, reject) =>
                setTimeout(
                  () => reject(new Error(`Retry timeout`)),
                  RETRY_TIMEOUTS[attempt] // 25, then 30 minutes
                )
              ) as any,
            ]);

            resultados[failedChunk.index] = resultado;
            failedChunk.attempts = attempt + 1;
            logger.info(`✅ Chunk ${failedChunk.index + 1}/${chunks.length} procesado en intento ${attempt + 1}`);
            success = true;
            break;
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            logger.warn(
              `⚠️ Chunk ${failedChunk.index + 1}/${chunks.length} falló en intento ${attempt + 1}/${MAX_RETRIES}: ${errorMsg}`
            );
            failedChunk.error = errorMsg;
          }
        }

        if (!success) {
          logger.error(
            `❌ Chunk ${failedChunk.index + 1}/${chunks.length} falló después de ${MAX_RETRIES} intentos - se marcará como FAILED`
          );
        }
      }
    }

    // Consolidar hallazgos de chunks exitosos
    const todosHallazgos = resultados
      .filter((r): r is MaliciaOutput => r !== null)
      .flatMap((r) => r.hallazgos);

    const totalInputTokens = resultados
      .filter((r): r is MaliciaOutput => r !== null)
      .reduce((s, r) => s + ((r as any).usage?.input_tokens ?? 0), 0);

    const totalOutputTokens = resultados
      .filter((r): r is MaliciaOutput => r !== null)
      .reduce((s, r) => s + ((r as any).usage?.output_tokens ?? 0), 0);

    const processedChunks = resultados.filter((r) => r !== null).length;
    const failedChunksCount = chunks.length - processedChunks;

    const output: MaliciaOutput & { usage: any; failedChunks?: any[] } = {
      hallazgos: todosHallazgos,
      resumen: `Se encontraron ${todosHallazgos.length} hallazgos en ${processedChunks}/${chunks.length} chunks ${failedChunksCount > 0 ? `(${failedChunksCount} chunks fallidos)` : ''}`,
      cantidad_hallazgos: todosHallazgos.length,
      tiempo_ejecucion_ms: Date.now() - startTime,
      usage: { input_tokens: totalInputTokens, output_tokens: totalOutputTokens, model: this.getLLMClient().getConfig().model },
      failedChunks: failedChunks.filter((fc) => resultados[fc.index] === null), // Only chunks that never succeeded
    };

    auditLog(AuditEventType.INSPECTOR_EXECUTION, 'Análisis Inspector completado', {
      chunks: chunks.length,
      processedChunks,
      failedChunks: failedChunksCount,
      cantidad_hallazgos: todosHallazgos.length,
      tiempo_ms: output.tiempo_ejecucion_ms,
      usage: output.usage,
    });

    return output;
  }

  /**
   * Analizar código en busca de funciones maliciosas (un solo chunk).
   *
   * Resilience Strategy (3 layers):
   * Layer 1: Code compression - reduce token load before sending to LLM
   * Layer 2: Rate limiting + Circuit breaker - control request flow & detect failures
   * Layer 3: Health checks - monitor LM Studio state & adapt timeouts
   */
  async analizarCodigo(input: MaliciaInput): Promise<MaliciaOutput> {
    const startTime = Date.now();

    try {
      logger.info('Iniciando análisis Malicia');

      const codigoHash = this.hashCode(input.codigo);
      const cached = cacheService.get<MaliciaOutput>(CacheType.MALICIA_FINDING, 'analisis', codigoHash);
      if (cached) {
        logger.info('Resultado encontrado en caché');
        return cached;
      }

      // ============================================================================
      // LAYER 1: CODE COMPRESSION - Reduce token load before sending to LLM
      // ============================================================================
      const codigoOriginal = input.codigo;
      const codigoComprimido = codeCompressor.compress(codigoOriginal);
      const compressionStats = codeCompressor.getStats(codigoOriginal, codigoComprimido);

      logger.info(`[CodeCompression] ${compressionStats.originalSize} → ${compressionStats.compressedSize} bytes (${compressionStats.reductionPercent}% reduction)`);

      // Build prompt with compressed code
      const inputComprimido = { ...input, codigo: codigoComprimido };
      const prompt = this.construirPrompt(inputComprimido);
      const llmClient = this.getLLMClient();
      const config = llmClient.getConfig();
      logger.info(`Llamando a ${config.provider} (${config.model})`);

      // Log prompt size for debugging
      const promptSize = Buffer.byteLength(prompt, 'utf-8');
      logger.info(`Prompt size: ${promptSize} bytes, Código comprimido size: ${codigoComprimido.length} bytes`);

      // For LM Studio (Qwen) with 4K context limit:
      // - Reduced from 768 to 512 to leave more room for input tokens
      // - Simplified JSON format requires less output space
      const maxOutputTokens = config.provider === 'lmstudio' ? 512 : 4096;

      // ============================================================================
      // LAYER 2: CIRCUIT BREAKER - Check if LM Studio is available
      // ============================================================================
      if (!circuitBreaker.canExecute()) {
        const state = circuitBreaker.getState();
        throw new Error(`Circuit breaker is ${state} - LM Studio unavailable. Please wait or restart the service.`);
      }

      // ============================================================================
      // LAYER 3: ADAPTIVE TIMEOUT - Use health check data for dynamic timeouts
      // ============================================================================
      const adaptiveTimeout = lmStudioHealthChecker.getAdaptiveTimeout();
      const timeoutMs = Math.max(15 * 60 * 1000, adaptiveTimeout); // At least 15 minutes for qwen models

      const healthStatus = lmStudioHealthChecker.getLastResult();
      if (healthStatus) {
        logger.info(`[HealthCheck] Status: ${healthStatus.status}, Latency: ${healthStatus.latency}ms, Timeout: ${timeoutMs}ms`);
      }

      // ============================================================================
      // LAYER 2: RATE LIMITING - Throttle requests to prevent LM Studio overload
      // ============================================================================
      // Wrap LLM call with rate limiter and circuit breaker recording
      // Pass system prompt for Inspector (centralized instructions, not in user prompt)
      const response = await Promise.race([
        rateLimiter.execute(async () => {
          try {
            const llmResponse = await llmClient.complete(prompt, maxOutputTokens, INSPECTOR_SYSTEM_PROMPT);
            circuitBreaker.recordSuccess();
            return llmResponse;
          } catch (error) {
            circuitBreaker.recordFailure();
            throw error;
          }
        }),
        new Promise((_, reject) =>
          setTimeout(
            () => {
              circuitBreaker.recordFailure();
              reject(new Error(`LLM request timeout (${timeoutMs}ms) - ${config.provider}/${config.model} no respondió`));
            },
            timeoutMs
          )
        ) as any,
      ]);

      if (!response.text) throw new Error('Respuesta inesperada del LLM');

      const hallazgos = this.parseRespuesta(response.text);

      const output: MaliciaOutput & { usage: any } = {
        hallazgos,
        resumen: `Se encontraron ${hallazgos.length} hallazgos potenciales de código malicioso`,
        cantidad_hallazgos: hallazgos.length,
        tiempo_ejecucion_ms: Date.now() - startTime,
        usage: {
          input_tokens: response.inputTokens,
          output_tokens: response.outputTokens,
          model: response.model,
        },
      };

      cacheService.set(CacheType.MALICIA_FINDING, 'analisis', output, codigoHash);
      return output;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`Error en análisis Malicia: ${errorMsg}`);
      throw error;
    }
  }

  /**
   * Dividir archivos en chunks que no superen MAX_CHUNK_BYTES.
   * Si un archivo individual es mayor que MAX_CHUNK_BYTES, lo divide por líneas.
   */
  private splitEnChunks(archivos: Array<{ path: string; content: string }>): Array<typeof archivos> {
    const chunks: Array<typeof archivos> = [];
    let chunk: typeof archivos = [];
    let chunkSize = 0;

    for (const archivo of archivos) {
      const fileSize = Buffer.byteLength(archivo.content, 'utf-8');

      // Si el archivo es más grande que MAX_CHUNK_BYTES, dividirlo por líneas
      if (fileSize > MAX_CHUNK_BYTES) {
        // Primero, guardar el chunk actual si no está vacío
        if (chunk.length > 0) {
          chunks.push(chunk);
          chunk = [];
          chunkSize = 0;
        }

        // Dividir archivo grande por líneas
        const lines = archivo.content.split('\n');
        let filePart = '';
        let partNum = 0;

        for (const line of lines) {
          const lineSize = Buffer.byteLength(line + '\n', 'utf-8');

          if (Buffer.byteLength(filePart, 'utf-8') + lineSize > MAX_CHUNK_BYTES && filePart) {
            // Guardar esta parte del archivo
            chunks.push([{
              path: `${archivo.path} [Parte ${++partNum}/${Math.ceil(fileSize / MAX_CHUNK_BYTES)}]`,
              content: filePart
            }]);
            filePart = '';
          }

          filePart += line + '\n';
        }

        // Guardar la última parte
        if (filePart) {
          chunks.push([{
            path: `${archivo.path} [Parte ${++partNum}/${Math.ceil(fileSize / MAX_CHUNK_BYTES)}]`,
            content: filePart
          }]);
        }
      } else {
        // Archivo normal, usar lógica de chunking original
        if (chunk.length > 0 && chunkSize + fileSize > MAX_CHUNK_BYTES) {
          chunks.push(chunk);
          chunk = [];
          chunkSize = 0;
        }
        chunk.push(archivo);
        chunkSize += fileSize;
      }
    }

    if (chunk.length > 0) chunks.push(chunk);
    return chunks.length > 0 ? chunks : [[]];
  }

  /**
   * Construir prompt para el Inspector (solo datos, instrucciones en system prompt)
   * OPTIMIZED: User prompt now contains ONLY code, no instructions
   * (~100 tokens - instructions moved to INSPECTOR_SYSTEM_PROMPT)
   */
  private construirPrompt(input: MaliciaInput): string {
    let prompt = '';
    if (input.contexto) {
      prompt += `Context: ${input.contexto}\n\n`;
    }
    prompt += `Code to analyze:\n\`\`\`\n${input.codigo}\n\`\`\``;
    return prompt;
  }

  /**
   * Parsear respuesta JSON - Optimizado para Qwen
   */
  private parseRespuesta(texto: string): MaliciaFinding[] {
    try {
      let jsonStr = texto.trim();

      // Extract JSON from various formats
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      const parsed = JSON.parse(jsonStr);
      const hallazgos = parsed.hallazgos || [];

      // Map simplified response to MaliciaFinding format
      return hallazgos.map((h: any) => ({
        archivo: h.archivo || 'unknown',
        linea: h.linea || 0,
        tipo_riesgo: h.tipo || h.tipo_riesgo || 'SOSPECHOSO',
        severidad: h.severidad || 'MEDIO',
        por_que_sospechoso: h.descripcion || h.por_que_sospechoso || 'Patrón sospechoso detectado',
        confianza: 0.7,
        pasos_remediacion: ['Revisar el código manualmente'],
      }));
    } catch (error) {
      logger.warn(`Error parseando respuesta de Inspector (probablemente Qwen): ${error}`);
      return [];
    }
  }

  /**
   * Generar hash simple del código (para caché)
   */
  private hashCode(code: string): string {
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
      const char = code.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convertir a 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }
}

/**
 * Singleton exportado
 */
export const inspectorAgent = new InspectorAgentService();
