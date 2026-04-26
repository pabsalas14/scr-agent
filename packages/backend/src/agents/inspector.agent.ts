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
 *
 * ⚠️ CRITICAL FIX (2026-04-20):
 * File markers (// === filename ===) MUST be preserved during code compression.
 * Without file markers, the LLM cannot identify which files it's analyzing and
 * will hallucinate findings in non-existent files (e.g., "auth_controller.rb").
 * See: HALLUCINATION_BUG_DIAGNOSIS.md for full details.
 */

import { logger, auditLog, AuditEventType } from '../services/logger.service';
import { cacheService, CacheType } from '../services/cache.service';
import { LLMClient, LLMConfig } from '../services/llm-client.service';
import { MaliciaInput, MaliciaOutput, MaliciaFinding } from '../types/agents';
import { rateLimiter } from '../services/rate-limiter.service';
import { circuitBreaker } from '../services/circuit-breaker.service';
import { codeCompressor } from '../services/code-compressor.service';
import { lmStudioHealthChecker } from '../services/lm-studio-health.service';
import { agentContextConfig } from '../config/agent-context.config';

/**
 * System Prompt del Inspector: análisis de seguridad amplio + malicia intencional.
 * Restaurado "completo" (categorías v2 + verificación/JSON rico v6) para modelos con contexto grande.
 */
const INSPECTOR_SYSTEM_PROMPT = `You are a senior security code analyst. Your job is a thorough, accurate review of the provided source. Respond with ONE JSON object only. No markdown fences, no preamble, no postscript.

SCOPE (report real issues; avoid noise):
1. BACKDOOR: hidden access, auth bypass, magic credentials, admin-only endpoints, reverse shells, unauthorized remote control
2. INJECTION: SQL, command, template, or code injection where user-controlled input reaches dangerous sinks
3. BOMB: time- or event-triggered destructive behavior (wipe, ransom, self-delete)
4. LOGIC_BOMB: business-logic abuse that harms the system (not just a bug) when conditions are met
5. OBFUSCATION: intentionally obscured control flow, packing, or encoding to evade review
6. EXFILTRATION: theft or exfil of secrets, PII, or data to untrusted destinations
7. PRIVILEGE_ESCALATION: granting extra rights, role bypass, or breaking authorization boundaries
8. MALWARE: miners, bot behavior, worms, C2-style behavior in application code
9. SECRET: high-risk hardcoded credentials, API keys, private keys, tokens in source (when clearly sensitive)
10. EVAL: dangerous dynamic execution (eval, exec, child_process, deserialization gadgets) in risky contexts
11. OTHER: other serious security-relevant code issues not listed above

PRIORITIZATION:
- Intentional or weaponized behavior is higher severity than accidental misconfiguration.
- Do not report style, formatting, or generic library CVEs unless the code clearly weaponizes them.
- Legitimate security controls (CSP, rate limits, normal auth) are not backdoors.
- Test-only code: only if it weakens production (e.g., test hooks left enabled) or fakes security.

ANALYSIS RULES:
- Examine the code in the user message. Trace imports, I/O, network, crypto, and auth.
- Be precise: file path and line number must match the code you were given.
- Rate severity from exploitability and impact (data, availability, integrity, trust boundary).

SEVERIDAD (choose EXACTLY one per finding):
- CRÍTICO: direct compromise, trivial exploitation, or systemic impact
- ALTO: serious risk if exploited
- MEDIO: material weakness, may need chaining
- BAJO: limited impact or hard to trigger

CRITICAL VERIFICATION (anti-hallucination):
1. "archivo" must appear in the code bundle (e.g. after // === path ===). Never invent paths.
2. "linea" must refer to a line that exists in that file's content.
3. "funcion" only if a real function/method name appears there; else omit or null.
4. "codigo_snippet" must be an exact quote from the source, not paraphrased.
5. If you cannot ground a finding in the provided code, do not report it.

REQUIRED JSON SHAPE (array may be empty):
{
  "hallazgos": [
    {
      "archivo": "path/from/bundle.js",
      "linea": 42,
      "funcion": "optionalFunctionName",
      "tipo": "BACKDOOR",
      "severidad": "CRÍTICO",
      "confianza": 0.92,
      "descripcion": "Clear, technical explanation in one or two sentences",
      "codigo_snippet": "exact lines from source",
      "impacto": "What could go wrong if abused",
      "explotabilidad": "How hard to exploit; what an attacker needs"
    }
  ]
}

FIELD RULES:
- "tipo" must be one of: BACKDOOR, INJECTION, BOMB, LOGIC_BOMB, OBFUSCATION, EXFILTRATION, PRIVILEGE_ESCALATION, MALWARE, SECRET, EVAL, OTHER
- "linea" is a single integer (start line of the issue).
- "confianza" is a number between 0 and 1 when you can estimate it; otherwise omit.
- Optional fields may be omitted if truly unknown, but prefer filling snippet + descripcion.
- If there are no issues: {"hallazgos":[]}

Now output ONLY the JSON object.`;

/**
 * Tamaño máximo de código por petición (bytes UTF-8) controlado por
 * `agentContextConfig.inspectorMaxChunkBytes` → env `INSPECTOR_MAX_CHUNK_BYTES` (default 200_000).
 * Para modelos locales 4K, baja el valor; para Claude/API, el default evita millones de micro-chunks.
 */

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

    // ============================================================================
    // DIAGNOSTIC LOGGING - Check what files are being analyzed
    // ============================================================================
    logger.info(`📊 INSPECTOR DIAGNOSTIC:`);
    logger.info(`Total files received: ${archivos.length}`);
    archivos.forEach((f, i) => {
      logger.info(`  [${i+1}] ${f.path} (${f.content.length} bytes)`);
    });

    // ============================================================================
    // STRATEGY 2: SELECTIVE ANALYSIS - Filter critical files first
    // ============================================================================
    const archivosFiltrados = this.filterCriticalFiles(archivos);

    logger.info(`📋 After filtering: ${archivosFiltrados.length} files selected`);
    archivosFiltrados.forEach((f, i) => {
      logger.info(`  [${i+1}] ${f.path} (${f.content.length} bytes)`);
    });

    const chunks = this.splitEnChunks(archivosFiltrados);
    logger.info(`Inspector: ${archivos.length} archivos totales → ${archivosFiltrados.length} críticos → ${chunks.length} chunk(s) de análisis`);

    // Log chunk sizes for debugging
    chunks.forEach((chunk, i) => {
      const chunkSize = chunk.reduce((sum, f) => sum + f.content.length, 0);
      logger.info(`Chunk ${i + 1}: ${chunk.length} archivos, ${chunkSize} bytes`);
      logger.info(`  Files in chunk: ${chunk.map(f => f.path).join(", ")}`);
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
   * Estrategia: compresión opcional (env `INSPECTOR_CODE_COMPRESSION`); rate limit; circuit
   * breaker; health checks / timeouts para LM Studio.
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

      const codigoOriginal = input.codigo;
      const useCompression = agentContextConfig.inspectorCodeCompressionEnabled;
      const codigoForPrompt = useCompression
        ? codeCompressor.compress(codigoOriginal)
        : codigoOriginal;

      if (useCompression) {
        const compressionStats = codeCompressor.getStats(codigoOriginal, codigoForPrompt);
        logger.info(
          `[CodeCompression] ${compressionStats.originalSize} → ${compressionStats.compressedSize} bytes (${compressionStats.reductionPercent}% reduction)`
        );
      }

      const inputForPrompt = { ...input, codigo: codigoForPrompt };
      const prompt = this.construirPrompt(inputForPrompt);
      const llmClient = this.getLLMClient();
      const config = llmClient.getConfig();
      logger.info(`Llamando a ${config.provider} (${config.model})`);

      const promptSize = Buffer.byteLength(prompt, 'utf-8');
      logger.debug(
        `Prompt size: ${promptSize} bytes, code payload: ${codigoForPrompt.length} bytes, compression=${useCompression}`
      );

      const fileMatches = codigoForPrompt.match(/\/\/\s*===\s*(.+?)\s*===/g);
      if (fileMatches) {
        logger.debug(`File markers in LLM payload: ${fileMatches.length}`);
        fileMatches.forEach((m) => logger.debug(`  ${m}`));
      } else {
        logger.warn(`No file markers (// === path ===) in code sent to LLM — hallazgos pueden ser imprecisos`);
      }

      const maxOutputTokens = agentContextConfig.inspectorMaxOutputTokens;

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

      logger.debug(`RAW LLM RESPONSE (first 1000 chars): ${response.text.substring(0, 1000)}`);
      if (response.text.length > 1000) {
        logger.debug(`... (${response.text.length - 1000} more characters)`);
      }

      const hallazgos = this.parseRespuesta(response.text);

      logger.info(`Inspector: ${hallazgos.length} hallazgos parseados`);
      hallazgos.forEach((h, i) => {
        logger.debug(`  [${i + 1}] ${h.archivo} L${h.rango_lineas[0]} - ${h.tipo_riesgo}`);
      });

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
   * Dividir archivos en chunks que no superen el límite configurado.
   * Si un archivo individual es mayor, lo divide por líneas.
   */
  private splitEnChunks(archivos: Array<{ path: string; content: string }>): Array<typeof archivos> {
    const maxBytes = agentContextConfig.inspectorMaxChunkBytes;
    const chunks: Array<typeof archivos> = [];
    let chunk: typeof archivos = [];
    let chunkSize = 0;

    for (const archivo of archivos) {
      const fileSize = Buffer.byteLength(archivo.content, 'utf-8');

      if (fileSize > maxBytes) {
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

          if (Buffer.byteLength(filePart, 'utf-8') + lineSize > maxBytes && filePart) {
            // Guardar esta parte del archivo
            chunks.push([{
              path: `${archivo.path} [Parte ${++partNum}/${Math.ceil(fileSize / maxBytes)}]`,
              content: filePart
            }]);
            filePart = '';
          }

          filePart += line + '\n';
        }

        // Guardar la última parte
        if (filePart) {
          chunks.push([{
            path: `${archivo.path} [Parte ${++partNum}/${Math.ceil(fileSize / maxBytes)}]`,
            content: filePart
          }]);
        }
      } else {
        // Archivo normal, usar lógica de chunking original
        if (chunk.length > 0 && chunkSize + fileSize > maxBytes) {
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
   * Parsear respuesta JSON (modelos compatibles; tolera ruido alrededor del objeto).
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

      // Map response to MaliciaFinding format with rich details
      return hallazgos.map((h: any) => {
        // Parse line range - support both single line and range formats
        let rango_lineas: [number, number] = [h.linea || 0, (h.linea || 0) + 1];
        if (h.rango_lineas && Array.isArray(h.rango_lineas)) {
          rango_lineas = h.rango_lineas as [number, number];
        }

        // Map threat types from v5 malicious functions detection
        // BACKDOOR, LOGIC_BOMB, EXFILTRATION, OBFUSCATION, PRIVILEGE_ESCALATION, MALWARE, OTHER
        const tipoMalicioso = h.tipo || 'MALICIOSO_DETECTADO';

        // Build comprehensive description including impact and exploitability
        const descripcion = h.descripcion || 'Función maliciosa detectada';
        const impacto = h.impacto ? ` | Impacto: ${h.impacto}` : '';
        const explotabilidad = h.explotabilidad ? ` | Explotabilidad: ${h.explotabilidad}` : '';
        const por_que_sospechoso = descripcion + impacto + explotabilidad;

        // v5 (Malicious Functions) prompt already has high bar for malicious intent
        // Trust the LLM's judgment - include all findings it returns
        const confianza = h.confianza || 0.7;

        return {
          archivo: h.archivo || 'unknown',
          funcion: h.funcion, // Include function name if available
          rango_lineas,
          fragmento_codigo: h.codigo_snippet || h.fragmento_codigo, // Rich code snippet
          tipo_riesgo: tipoMalicioso, // BACKDOOR, LOGIC_BOMB, EXFILTRATION, OBFUSCATION, etc
          severidad: h.severidad || 'MEDIO',
          por_que_sospechoso,
          confianza,
          pasos_remediacion: h.pasos_remediacion || ['Revisar el código malicioso y determinar intención del atacante', 'Eliminar o refactorizar la función maliciosa'],
        };
      });
    } catch (error) {
      logger.warn(`Error parseando respuesta JSON del Inspector: ${error}`);
      return [];
    }
  }

  /**
   * Filtrar archivos críticos (seguridad, auth, db, api)
   * Prioriza análisis profundo de archivos sensibles
   * Para repos pequeños (<20 archivos), analiza todos
   */
  private filterCriticalFiles(archivos: Array<{ path: string; content: string }>): Array<{ path: string; content: string }> {
    // Para repos pequeños, analizar TODO
    if (archivos.length <= 20) {
      logger.info(`📂 Repo pequeño (${archivos.length} archivos) - analizando TODOS`);
      return archivos;
    }

    const criticalPatterns = [
      /auth|login|password|jwt|session|token/i,
      /database|db|sql|query|transaction/i,
      /api|endpoint|route|controller|handler/i,
      /security|crypto|encrypt|hash|validate|score|credit|payment|transaction|bank/i,
      /admin|superuser|permission|role|access/i,
    ];

    const criticalFiles = archivos.filter(f =>
      criticalPatterns.some(pattern => pattern.test(f.path))
    );

    // If we found critical files, use those + 50% más
    // Otherwise, use all files
    const minFiles = 5;
    if (criticalFiles.length >= minFiles) {
      logger.info(`🔍 Filtrados ${criticalFiles.length} archivos críticos de ${archivos.length} totales`);
      return criticalFiles;
    }

    logger.info(`📂 Analizando todos los ${archivos.length} archivos (menos de ${minFiles} críticos encontrados)`);
    return archivos;
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
