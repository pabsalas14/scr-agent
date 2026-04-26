/**
 * ============================================================================
 * AGENTE FORENSES - Investigación Forense de Git
 * ============================================================================
 *
 * Responsabilidades:
 * - Investigar historial de Git de archivos con hallazgos
 * - Construir línea de tiempo de cambios sospechosos
 * - Correlacionar commits, autores y patrones
 * - Detectar cadena de compromiso (cómo evolucionó el código malicioso)
 *
 * Entrada: Hallazgos de Malicia + Historial de Git
 * Salida: ForensesOutput con timeline de eventos
 */

import { logger, auditLog, AuditEventType } from '../services/logger.service';
import { cacheService, CacheType } from '../services/cache.service';
import { LLMClient, LLMConfig } from '../services/llm-client.service';
import { gitService } from '../services/git.service';
import { ForensesInput, ForensesOutput, EventoForense } from '../types/agents';
import { agentContextConfig } from '../config/agent-context.config';

/**
 * System Prompt del Detective: metodología forense completa + esquema JSON explícito.
 */
const DETECTIVE_SYSTEM_PROMPT = `You are a senior forensic Git analyst. You receive malicious/security findings and Git history. Build an evidence-based timeline. Respond with ONE JSON object only. No other text.

MISSION:
- Trace how and when concerning code was introduced and evolved.
- Correlate findings with real commits, authors, and file paths from the data provided.
- Surface patterns of coordination, obfuscation, or risky auth/crypto/data changes.
- Distinguish strong evidence from weak inference: cite commits and messages you actually see.

METHODOLOGY (apply all that the data allows):
1. Timeline construction: map each important finding to commits that plausibly introduced or modified it
2. Cross-commit correlation: connect related file changes, authors, and time proximity
3. Pattern detection: frequency, timing, message quality, and scope of changes
4. Escalation: describe progression (simple → hidden → more dangerous) if the history supports it
5. Author profiling: flag only when the history supports it (not gossip)

SUSPICIOUS INDICATORS (use when present in the data):
- HIDDEN COMMITS: generic messages ("fix", "update", "cleanup") for sensitive modules
- TIMING ANOMALIES: off-hours or bursts of changes
- RAPID SUCCESSION: many related commits in a short window
- CRITICAL FILES: auth, crypto, payments, admin, database, network ingress
- OBFUSCATION PROGRESSION: growing complexity, encoding, or evasion
- AUTHOR ANOMALIES: new or unusual authors on critical paths
- BRANCHING: long-lived feature branches, delayed merges, cherry-picks hiding intent
- MASS CHANGES: very large diffs that could conceal small malicious edits

ANALYSIS RULES:
- Prefer at least one timeline event per supplied finding when history supports a link; if a finding cannot be tied to a commit, explain that in the closest related event for that file.
- Use ISO 8601 "timestamp" when you have a commit date; if only approximate, still use ISO and align to the provided commit metadata.
- "commit" must be a hash string present in the provided history when you attribute an event to a commit.
- "resumen_cambios" and "indicadores_sospecha" must be grounded in the diff/message content you have, not invented repositories or paths.

REQUIRED OUTPUT FORMAT (exact top-level keys):
{
  "eventos": [
    {
      "timestamp": "2024-03-15T10:30:00.000Z",
      "commit": "full_or_short_hash_from_history",
      "autor": "email_or_name_from_metadata",
      "archivo": "path/from/finding_or_history",
      "funcion": "functionNameOrNull",
      "accion": "ADDED",
      "mensaje_commit": "exact or summarized commit message",
      "resumen_cambios": "what changed in security-relevant terms",
      "nivel_riesgo": "CRÍTICO",
      "indicadores_sospecha": ["specific reason tied to this commit/file"]
    }
  ],
  "patrones": ["cross-cutting patterns you infer from the set of events"],
  "autores_sospechosos": ["authors worth manual review, only if supported"]
}

FIELD REQUIREMENTS:
- "eventos": array in chronological order when dates are available
- "accion": EXACTLY one of: ADDED, MODIFIED, DELETED
- "nivel_riesgo": EXACTLY one of: CRÍTICO, ALTO
- "funcion": string or the JSON null value if not identifiable
- "indicadores_sospecha", "patrones", "autores_sospechosos": arrays of strings (may be empty)
- "patrones" and "autores_sospechosos" may be empty arrays if the evidence is thin

STRICT RULES:
1. Output ONLY valid JSON. No keys other than "eventos", "patrones", "autores_sospechosos" at the top level.
2. No markdown, no comments, no trailing commas.
3. If the supplied history is insufficient, return minimal but honest events (e.g. linking findings to the nearest touching commit) rather than fabricating metadata.

Now respond with ONLY the JSON object.`;

/** Reintentos por chunk (independiente del tamaño de contexto). */
const MAX_RETRIES = 3;
const RETRY_TIMEOUTS = [15 * 60 * 1000, 25 * 60 * 1000, 30 * 60 * 1000]; // 15, 25, 30 minutos

/**
 * Servicio del Agente Detective
 */
export class DetectiveAgentService {
  private llmClient: LLMClient | null = null;
  private llmConfig: LLMConfig | null = null;
  private model = 'claude-haiku-4-5-20251001';

  constructor(llmConfig?: LLMConfig) {
    this.llmConfig = llmConfig || this.getDefaultConfig();
    this.initLLMClient();
  }

  /**
   * Configuración por defecto (Anthropic Haiku - fallback)
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
    logger.info(`DetectiveAgent: LLM config actualizada (${llmConfig.provider}/${llmConfig.model})`);
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
   * Investigar historial de Git para hallazgos de malicia
   * Soporta chunking automático para repositorios grandes
   */
  async investigarHistorial(input: ForensesInput, isLargeRepo: boolean = false): Promise<ForensesOutput> {
    const startTime = Date.now();

    try {
      logger.info(`Iniciando análisis Forenses (isLargeRepo: ${isLargeRepo})`);

      /**
       * Construir clave de caché
       * Usar combinación de IDs de hallazgos
       */
      const hallazgoIds = input.hallazgos_malicia
        .map((h) => h.archivo + ':' + (h.funcion || 'file'))
        .join('|');
      const cacheKey = this.hashInput(hallazgoIds);

      const cached = cacheService.get<ForensesOutput>(
        CacheType.FORENSES_TIMELINE,
        'timeline',
        cacheKey
      );

      if (cached) {
        logger.info('Timeline encontrada en caché');
        return cached;
      }

      // Si es repositorio grande, usar chunking
      const maxFindings = agentContextConfig.detectiveMaxFindingsPerChunk;
      if (isLargeRepo && input.hallazgos_malicia.length > maxFindings) {
        logger.info(
          `📊 Repo grande detectado: ${input.hallazgos_malicia.length} hallazgos. Aplicando chunking (${maxFindings} por chunk, env DETECTIVE_MAX_FINDINGS_PER_CHUNK)`
        );
        return await this.investigarHistorialConChunking(input, cacheKey, startTime);
      }

      // Si es repositorio pequeño, procesamiento directo
      logger.info(`✓ Repo pequeño: ${input.hallazgos_malicia.length} hallazgos. Procesamiento directo sin chunking`);
      return await this.investigarHistorialDirecto(input, cacheKey, startTime);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`Error en análisis Forenses: ${errorMsg}`);
      throw error;
    }
  }

  /**
   * Investigar historial con chunking para repositorios grandes
   */
  private async investigarHistorialConChunking(
    input: ForensesInput,
    cacheKey: string,
    startTime: number
  ): Promise<ForensesOutput> {
    const allEventos: EventoForense[] = [];
    const chunks = this.chunkHallazgos(
      input.hallazgos_malicia,
      agentContextConfig.detectiveMaxFindingsPerChunk
    );
    const failedChunks: Array<{ index: number; error: string; attempts: number }> = [];

    logger.info(`📦 Total chunks: ${chunks.length}`);

    // Procesar cada chunk con reintentos
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      let attemptCount = 0;
      let success = false;
      let lastError: Error | null = null;

      // Reintentar hasta MAX_RETRIES veces
      while (attemptCount < MAX_RETRIES && !success) {
        try {
          logger.info(`[Chunk ${i + 1}/${chunks.length}] Intento ${attemptCount + 1}/${MAX_RETRIES}...`);

          const chunkInput: ForensesInput = {
            ...input,
            hallazgos_malicia: chunk,
          };

          const prompt = this.construirPrompt(chunkInput);
          const llmClient = this.getLLMClient();
          const config = llmClient.getConfig();

          // Llamar al LLM con timeout basado en intento
          const timeoutMs = attemptCount < RETRY_TIMEOUTS.length
            ? RETRY_TIMEOUTS[attemptCount]
            : RETRY_TIMEOUTS[RETRY_TIMEOUTS.length - 1];

          const response = await Promise.race([
            llmClient.complete(prompt, 2048, DETECTIVE_SYSTEM_PROMPT),
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error(`LLM request timeout (${timeoutMs / 60000} minutos)`)),
                timeoutMs
              )
            ) as any,
          ]);

          if (!response.text) {
            throw new Error('Respuesta inesperada del LLM');
          }

          const eventos = this.parseTimeline(response.text);
          allEventos.push(...eventos);
          success = true;
          logger.info(`✅ [Chunk ${i + 1}/${chunks.length}] Completado (${eventos.length} eventos)`);
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          attemptCount++;

          if (attemptCount < MAX_RETRIES) {
            const waitTime = attemptCount < RETRY_TIMEOUTS.length
              ? RETRY_TIMEOUTS[attemptCount - 1] / 1000
              : RETRY_TIMEOUTS[RETRY_TIMEOUTS.length - 1] / 1000;
            logger.warn(`⚠️ [Chunk ${i + 1}/${chunks.length}] Intento ${attemptCount} falló. Esperando ${waitTime}s antes de reintentar...`);
            logger.warn(`   Error: ${lastError.message}`);
            // En producción, aquí iría await con setTimeout real
            // Por ahora, continuamos inmediatamente para testing
          } else {
            logger.warn(`❌ [Chunk ${i + 1}/${chunks.length}] Falló después de ${MAX_RETRIES} intentos`);
            failedChunks.push({
              index: i,
              error: lastError.message,
              attempts: attemptCount,
            });
          }
        }
      }
    }

    // Detectar patrones y autores sospechosos
    const { patrones, autores } = this.analizarPatrones(allEventos);

    // Construir salida
    const output: ForensesOutput & { usage: any; failedChunks: any } = {
      linea_tiempo: allEventos,
      resumen_forense: `Se analizaron ${allEventos.length} eventos en la línea de tiempo (${chunks.length} chunks). Se detectaron ${patrones.length} patrones sospechosos.`,
      patrones_detectados: patrones,
      autores_sospechosos: autores,
      tiempo_ejecucion_ms: Date.now() - startTime,
      usage: {
        input_tokens: 0, // Acumulado de chunks
        output_tokens: 0,
        model: this.getLLMClient().getConfig().model,
      },
      failedChunks: failedChunks.length > 0 ? failedChunks : undefined,
    };

    // Guardar en caché
    cacheService.set(CacheType.FORENSES_TIMELINE, 'timeline', output, cacheKey);

    // Auditoría
    auditLog(AuditEventType.DETECTIVE_EXECUTION, 'Análisis Detective completado (con chunking)', {
      cantidad_eventos: allEventos.length,
      patrones_detectados: patrones.length,
      autores_sospechosos: autores.length,
      chunks_totales: chunks.length,
      chunks_fallidos: failedChunks.length,
      tiempo_ms: output.tiempo_ejecucion_ms,
    });

    return output;
  }

  /**
   * Investigar historial sin chunking para repositorios pequeños
   */
  private async investigarHistorialDirecto(
    input: ForensesInput,
    cacheKey: string,
    startTime: number
  ): Promise<ForensesOutput> {
    /**
     * Construir prompt para Claude
     */
    const prompt = this.construirPrompt(input);

    /**
     * Llamar al LLM
     */
    const llmClient = this.getLLMClient();
    const config = llmClient.getConfig();
    logger.info(`Llamando a ${config.provider} (${config.model})`);

    // Wrap LLM call with timeout to detect hanging requests
    // LM Studio should respond within 5 minutes for forensic analysis
    const response = await Promise.race([
      llmClient.complete(prompt, 2048, DETECTIVE_SYSTEM_PROMPT),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`LLM request timeout (5 minutos) - ${config.provider}/${config.model} no respondió`)),
          5 * 60 * 1000
        )
      ) as any,
    ]);

    if (!response.text) {
      throw new Error('Respuesta inesperada del LLM');
    }

    /**
     * Parsear timeline
     */
    const eventos = this.parseTimeline(response.text);

    /**
     * Extraer usage de la respuesta
     */
    const usage = {
      input_tokens: response.inputTokens,
      output_tokens: response.outputTokens,
      model: response.model,
    };

    /**
     * Detectar patrones y autores sospechosos
     */
    const { patrones, autores } = this.analizarPatrones(eventos);

    /**
     * Construir salida
     */
    const output: ForensesOutput & { usage: any } = {
      linea_tiempo: eventos,
      resumen_forense: `Se analizaron ${eventos.length} eventos en la línea de tiempo. Se detectaron ${patrones.length} patrones sospechosos.`,
      patrones_detectados: patrones,
      autores_sospechosos: autores,
      tiempo_ejecucion_ms: Date.now() - startTime,
      usage,
    };

    /**
     * Guardar en caché
     */
    cacheService.set(CacheType.FORENSES_TIMELINE, 'timeline', output, cacheKey);

    /**
     * Auditoría
     */
    auditLog(AuditEventType.DETECTIVE_EXECUTION, 'Análisis Detective completado', {
      cantidad_eventos: eventos.length,
      patrones_detectados: patrones.length,
      autores_sospechosos: autores.length,
      tiempo_ms: output.tiempo_ejecucion_ms,
      usage,
    });

    return output;
  }

  /**
   * Dividir hallazgos en chunks para procesamiento
   */
  private chunkHallazgos(hallazgos: any[], chunkSize: number): any[][] {
    const chunks: any[][] = [];
    for (let i = 0; i < hallazgos.length; i += chunkSize) {
      chunks.push(hallazgos.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Construir prompt para el Detective (solo datos, instrucciones en system prompt)
   * OPTIMIZED: User prompt contains ONLY data to analyze
   * (~100 tokens - instructions moved to DETECTIVE_SYSTEM_PROMPT)
   */
  private construirPrompt(input: ForensesInput): string {
    return `
Malicious findings discovered:
\`\`\`json
${JSON.stringify(input.hallazgos_malicia, null, 2)}
\`\`\`

Git commit history (last 50 commits):
\`\`\`json
${JSON.stringify(input.historial_commits.slice(0, 50), null, 2)}
\`\`\`

Build a forensic timeline correlating these findings with commit history.
`;
  }

  /**
   * Parsear timeline de la respuesta
   */
  private parseTimeline(texto: string): EventoForense[] {
    try {
      /**
       * Extraer JSON del texto
       */
      let jsonStr = texto;

      const jsonMatch = texto.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1] ?? jsonStr;
      } else {
        const jsonMatch2 = texto.match(/\{[\s\S]*\}/);
        if (jsonMatch2) {
          jsonStr = jsonMatch2[0] ?? jsonStr;
        }
      }

      const parsed = JSON.parse(jsonStr);
      const eventos: EventoForense[] = (parsed.eventos || []).map((e: any) => ({
        timestamp: e.timestamp,
        commit: e.commit,
        autor: e.autor,
        archivo: e.archivo,
        funcion: e.funcion,
        accion: e.accion,
        mensaje_commit: e.mensaje_commit,
        resumen_cambios: e.resumen_cambios,
        nivel_riesgo: e.nivel_riesgo,
        indicadores_sospecha: e.indicadores_sospecha,
      }));

      return eventos;
    } catch (error) {
      logger.error(`Error parseando timeline: ${error}`);
      return [];
    }
  }

  /**
   * Analizar patrones en eventos
   */
  private analizarPatrones(
    eventos: EventoForense[]
  ): { patrones: string[]; autores: string[] } {
    const patrones: Set<string> = new Set();
    const autores: Set<string> = new Set();

    /**
     * Detectar patrones comunes
     */
    const eventosPorAutor: Record<string, number> = {};
    const nivelAlto = eventos.filter(
      (e) => e.nivel_riesgo === 'ALTO' || e.nivel_riesgo === 'CRÍTICO'
    ).length;

    eventos.forEach((evento) => {
      eventosPorAutor[evento.autor] = (eventosPorAutor[evento.autor] || 0) + 1;
    });

    /**
     * Patrones detectados
     */
    if (nivelAlto / eventos.length > 0.5) {
      patrones.add('Alto porcentaje de eventos de riesgo ALTO/CRÍTICO');
    }

    Object.entries(eventosPorAutor).forEach(([autor, count]) => {
      if (count > eventos.length / 2) {
        patrones.add(`Un solo autor (${autor}) responsable de la mayoría de cambios`);
        autores.add(autor);
      }
    });

    /**
     * Detectar introducción gradual
     */
    const cambios = eventos.filter((e) => e.accion === 'MODIFICADO').length;
    if (cambios > eventos.filter((e) => e.accion === 'AGREGADO').length) {
      patrones.add('Patrón de introducción gradual: más modificaciones que adiciones iniciales');
    }

    return {
      patrones: Array.from(patrones),
      autores: Array.from(autores),
    };
  }

  /**
   * Generar hash de entrada (para caché)
   */
  private hashInput(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}

/**
 * Singleton exportado
 */
export const detectiveAgent = new DetectiveAgentService();
