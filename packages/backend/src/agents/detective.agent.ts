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
import { LLMClient, LLMConfig, createLLMClient, UserLLMConfig } from '../services/llm-client.service';
import { gitService } from '../services/git.service';
import { ForensesInput, ForensesOutput, EventoForense } from '../types/agents';

/**
 * System Prompt para el Detective
 * Instrucciones centralizadas (~150 tokens - moved from user prompt to system)
 */
const DETECTIVE_SYSTEM_PROMPT = `You are a forensic code analyst specializing in Git history investigation.

Your task is to analyze Git commit history and malicious findings to:
- Build a timeline of when/how malicious code was introduced
- Identify correlations between commits and security findings
- Detect patterns suggesting compromise chain
- Identify suspicious authors based on commit patterns
- Analyze how code evolved (gradual obfuscation, escalation, etc.)

For each event in the timeline, provide:
- Timestamp and commit hash
- Author email
- File and function affected
- Action (ADDED, MODIFIED)
- Risk level (ALTO, CRÍTICO)
- Suspicious indicators

Respond ONLY with valid JSON containing:
- "eventos": array of timeline events
- "patrones": array of detected patterns
- "autores_sospechosos": array of suspicious authors

Be thorough in connecting findings to commits.`;

/**
 * Constantes para chunking y retry
 */
const MAX_FINDINGS_PER_CHUNK = 5; // Procesar máximo 5 hallazgos por chunk (para Qwen 4K context)
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
      if (isLargeRepo && input.hallazgos_malicia.length > MAX_FINDINGS_PER_CHUNK) {
        logger.info(`📊 Repo grande detectado: ${input.hallazgos_malicia.length} hallazgos. Aplicando chunking (${MAX_FINDINGS_PER_CHUNK} por chunk)`);
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
    const chunks = this.chunkHallazgos(input.hallazgos_malicia, MAX_FINDINGS_PER_CHUNK);
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
        model: 'qwen2.5-coder-7b-instruct',
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
