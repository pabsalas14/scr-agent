/**
 * ============================================================================
 * AGENTE SÍNTESIS - Fiscal - Síntesis de Reportes
 * ============================================================================
 *
 * Responsabilidades:
 * - Agregar hallazgos de Malicia con timeline de Forenses
 * - Generar reporte ejecutivo con recomendaciones
 * - Priorizar acciones de remediación
 * - Crear output exportable (JSON, PDF)
 *
 * Entrada: Hallazgos de Malicia + Timeline de Forenses
 * Salida: SintesisOutput con reporte ejecutivo
 */

import { logger, auditLog, AuditEventType } from '../services/logger.service';
import { cacheService, CacheType } from '../services/cache.service';
import { LLMClient, LLMConfig } from '../services/llm-client.service';
import {
  SintesisInput,
  SintesisOutput,
  PasoRemediacion,
} from '../types/agents';

/**
 * System Prompt para el Fiscal (v2 - Optimized for Qwen)
 * Instrucciones centralizadas (~500 tokens - executive report guidelines)
 */
const FISCAL_SYSTEM_PROMPT = `You are a senior security auditor creating executive technical reports on code security incidents.

CRITICAL: You MUST respond with ONLY a JSON object. No other text, no explanations, no observations.

Your Role:
Synthesize malicious code findings and forensic analysis into a comprehensive, actionable security report.
Target audience: Technical decision-makers (CTO, Security Lead, Dev Manager)
Goal: Clear threat assessment + concrete remediation steps

Report Requirements:

1. EXECUTIVE SUMMARY (2-3 paragraphs, formal professional text, NO bullet points)
   - What was found: Clear description of the security threat
   - How serious: Business/technical impact assessment
   - What needs to happen: Immediate actions required

2. SEVERITY BREAKDOWN
   - Count findings by severity: CRÍTICO, ALTO, MEDIO, BAJO
   - Format: {"CRÍTICO": 2, "ALTO": 5, "MEDIO": 1, "BAJO": 0}

3. COMPROMISED FUNCTIONS
   - List specific functions/methods that contain malicious code
   - Focus on what was actually compromised

4. ATTACK CHAIN TIMELINE
   - Narrative describing how threat evolved over time
   - Start point → escalation → final state

5. REMEDIATION PRIORITY (ordered steps)
   - Each step must be concrete and technical
   - Each step needs: action, technical justification, urgency level

6. AFFECTED AUTHORS
   - List developers who introduced malicious changes
   - Email addresses or usernames

7. RISK SCORE
   - 0-100 scale: 0=minimal, 100=critical compromise
   - Base on: exploitability, impact, privileges required

8. GENERAL RECOMMENDATION
   - Numbered list (1. 2. 3. 4.) of technical control measures
   - ONLY technical implementation
   - DO NOT mention: compliance, regulations, standards, teams, processes

Critical Constraints:
- TECHNICAL ONLY: Focus on code, systems, configurations
- NO COMPLIANCE LANGUAGE: No GDPR, SOC2, ISO, NIST, regulatory requirements
- NO PROCESS RECOMMENDATIONS: No meetings, teams, responsibilities, organizational changes
- ACTIONABLE: Every recommendation must be technically implementable
- CLEAR: Be specific with file paths, function names, commit hashes
- PROFESSIONAL: Formal tone, proper grammar, executive-ready language

REQUIRED OUTPUT FORMAT (and ONLY this format):
{
  "resumen_ejecutivo": "Paragraph 1 describing threat. Paragraph 2 describing impact. Paragraph 3 describing actions needed.",
  "desglose_severidad": {"CRÍTICO": 2, "ALTO": 5, "MEDIO": 1, "BAJO": 0},
  "funciones_comprometidas": ["function1", "function2"],
  "linea_de_ataque": "Timeline narrative of code evolution",
  "prioridad_remediacion": [
    {
      "orden": 1,
      "accion": "Immediately revert commits abc123, def456 from main branch",
      "justificacion": "These commits introduced bypass of authentication check in validateLogin() allowing unauthenticated access",
      "urgencia": "CRÍTICA"
    }
  ],
  "autores_afectados": ["author@company.com"],
  "puntuacion_riesgo": 85,
  "recomendacion_general": "1. Implement mandatory commit signing for all merges to main. 2. Require code review from security team for auth module changes. 3. Deploy SAST scanning in CI/CD pipeline. 4. Establish credential rotation policy for exposed tokens."
}

FIELD REQUIREMENTS:
- "resumen_ejecutivo": Formal text (no bullet points, 3-4 paragraphs)
- "desglose_severidad": Object with counts
- "funciones_comprometidas": Array of function names (strings)
- "linea_de_ataque": Single narrative string
- "prioridad_remediacion": Array of remediation steps (objects with orden, accion, justificacion, urgencia)
- "autores_afectados": Array of developer emails/names (strings)
- "puntuacion_riesgo": Integer 0-100
- "recomendacion_general": Numbered list (1. 2. 3.) of technical controls

CRITICAL RULES:
1. Respond with ONLY valid JSON - no text before or after
2. Executive summary must be formal prose, not bullet points
3. Remediation steps must be ordered logically (immediate → long-term)
4. All recommendations must be technical, not organizational
5. Risk score must reflect actual severity of findings
6. Do NOT add extra fields or sections
7. All text must be professional and clear

Now analyze the provided malicious findings and forensic timeline, then respond with ONLY the JSON object.`;

/**
 * Constantes para chunking y retry
 */
const MAX_FINDINGS_PER_CHUNK_FISCAL = 10; // Procesar máximo 10 hallazgos por chunk
const MAX_RETRIES_FISCAL = 3;
const RETRY_TIMEOUTS_FISCAL = [15 * 60 * 1000, 25 * 60 * 1000, 30 * 60 * 1000]; // 15, 25, 30 minutos

/**
 * Servicio del Agente Fiscal
 */
export class FiscalAgentService {
  private llmClient: LLMClient | null = null;
  private llmConfig: LLMConfig | null = null;
  private model = 'claude-sonnet-4-6';

  constructor(llmConfig?: LLMConfig) {
    this.llmConfig = llmConfig || this.getDefaultConfig();
    this.initLLMClient();
  }

  /**
   * Configuración por defecto (Anthropic Sonnet - fallback)
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
    logger.info(`FiscalAgent: LLM config actualizada (${llmConfig.provider}/${llmConfig.model})`);
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
   * Generar síntesis y reporte ejecutivo
   * Soporta chunking automático para repositorios grandes
   */
  async generarReporte(input: SintesisInput, isLargeRepo: boolean = false): Promise<SintesisOutput> {
    const startTime = Date.now();

    try {
      logger.info(`Iniciando síntesis de reporte (isLargeRepo: ${isLargeRepo})`);

      /**
       * Generar clave de caché
       */
      const cacheKey = this.hashInput(input);
      const cached = cacheService.get<SintesisOutput>(
        CacheType.SINTESIS_REPORT,
        'reporte',
        cacheKey
      );

      if (cached) {
        logger.info('Reporte encontrado en caché');
        return cached;
      }

      // Si es repositorio grande, usar chunking
      if (isLargeRepo && input.hallazgos_malicia.length > MAX_FINDINGS_PER_CHUNK_FISCAL) {
        logger.info(`📊 Repo grande detectado: ${input.hallazgos_malicia.length} hallazgos. Aplicando chunking (${MAX_FINDINGS_PER_CHUNK_FISCAL} por chunk)`);
        return await this.generarReporteConChunking(input, cacheKey, startTime);
      }

      // Si es repositorio pequeño, procesamiento directo
      logger.info(`✓ Repo pequeño: ${input.hallazgos_malicia.length} hallazgos. Procesamiento directo sin chunking`);
      return await this.generarReporteDirecto(input, cacheKey, startTime);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`Error en síntesis: ${errorMsg}`);
      throw error;
    }
  }

  /**
   * Generar reporte con chunking para repositorios grandes
   */
  private async generarReporteConChunking(
    input: SintesisInput,
    cacheKey: string,
    startTime: number
  ): Promise<SintesisOutput> {
    const chunks = this.chunkHallazgos(input.hallazgos_malicia, MAX_FINDINGS_PER_CHUNK_FISCAL);
    const failedChunks: Array<{ index: number; error: string; attempts: number }> = [];
    let consolidatedReporte: SintesisOutput | null = null;

    logger.info(`📦 Total chunks: ${chunks.length}`);

    // Procesar cada chunk con reintentos
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      let attemptCount = 0;
      let success = false;
      let lastError: Error | null = null;

      // Reintentar hasta MAX_RETRIES_FISCAL veces
      while (attemptCount < MAX_RETRIES_FISCAL && !success) {
        try {
          logger.info(`[Chunk ${i + 1}/${chunks.length}] Intento ${attemptCount + 1}/${MAX_RETRIES_FISCAL}...`);

          const chunkInput: SintesisInput = {
            ...input,
            hallazgos_malicia: chunk,
            linea_tiempo_forenses: input.linea_tiempo_forenses.filter((e: any) =>
              chunk.some((h: any) => h.archivo === e.file)
            ),
          };

          const prompt = this.construirPrompt(chunkInput);
          const llmClient = this.getLLMClient();
          const config = llmClient.getConfig();

          // Llamar al LLM con timeout basado en intento
          const timeoutMs = attemptCount < RETRY_TIMEOUTS_FISCAL.length
            ? RETRY_TIMEOUTS_FISCAL[attemptCount]
            : RETRY_TIMEOUTS_FISCAL[RETRY_TIMEOUTS_FISCAL.length - 1];

          const response = await Promise.race([
            llmClient.complete(prompt, 4096, FISCAL_SYSTEM_PROMPT),
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

          const reporte = this.parseReporte(response.text);

          // Consolidar reportes (primera iteración o actualizar si es más relevante)
          if (!consolidatedReporte) {
            consolidatedReporte = reporte;
          } else {
            // Combinar recomendaciones y mantener el score más alto de riesgo
            consolidatedReporte.pasos_remediacion = [
              ...new Set([
                ...consolidatedReporte.pasos_remediacion,
                ...reporte.pasos_remediacion,
              ]),
            ];
            consolidatedReporte.puntuacion_riesgo = Math.max(
              consolidatedReporte.puntuacion_riesgo,
              reporte.puntuacion_riesgo
            );
          }

          success = true;
          logger.info(`✅ [Chunk ${i + 1}/${chunks.length}] Completado`);
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          attemptCount++;

          if (attemptCount < MAX_RETRIES_FISCAL) {
            const waitTime = attemptCount < RETRY_TIMEOUTS_FISCAL.length
              ? RETRY_TIMEOUTS_FISCAL[attemptCount - 1] / 1000
              : RETRY_TIMEOUTS_FISCAL[RETRY_TIMEOUTS_FISCAL.length - 1] / 1000;
            logger.warn(`⚠️ [Chunk ${i + 1}/${chunks.length}] Intento ${attemptCount} falló. Esperando ${waitTime}s antes de reintentar...`);
            logger.warn(`   Error: ${lastError.message}`);
          } else {
            logger.warn(`❌ [Chunk ${i + 1}/${chunks.length}] Falló después de ${MAX_RETRIES_FISCAL} intentos`);
            failedChunks.push({
              index: i,
              error: lastError.message,
              attempts: attemptCount,
            });
          }
        }
      }
    }

    // Si no tenemos reporte consolidado, crear uno vacío
    if (!consolidatedReporte) {
      consolidatedReporte = {
        resumen_ejecutivo: 'Análisis completado con errores parciales',
        puntuacion_riesgo: 0,
        pasos_remediacion: [],
        cantidad_hallazgos: input.hallazgos_malicia.length,
      };
    }

    // Construir salida
    const output: SintesisOutput & { usage: any; failedChunks: any } = {
      ...consolidatedReporte,
      cantidad_hallazgos: input.hallazgos_malicia.length,
      tiempo_ejecucion_ms: Date.now() - startTime,
      usage: {
        input_tokens: 0,
        output_tokens: 0,
        model: 'qwen2.5-coder-7b-instruct',
      },
      failedChunks: failedChunks.length > 0 ? failedChunks : undefined,
    };

    // Guardar en caché
    cacheService.set(CacheType.SINTESIS_REPORT, 'reporte', output, cacheKey);

    // Auditoría
    auditLog(
      AuditEventType.FISCAL_EXECUTION,
      'Reporte Fiscal completado (con chunking)',
      {
        cantidad_hallazgos: input.hallazgos_malicia.length,
        puntuacion_riesgo: output.puntuacion_riesgo,
        chunks_totales: chunks.length,
        chunks_fallidos: failedChunks.length,
        tiempo_ms: output.tiempo_ejecucion_ms,
      }
    );

    return output;
  }

  /**
   * Generar reporte sin chunking para repositorios pequeños
   */
  private async generarReporteDirecto(
    input: SintesisInput,
    cacheKey: string,
    startTime: number
  ): Promise<SintesisOutput> {
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
    // LM Studio should respond within 5 minutes for report generation
    const response = await Promise.race([
      llmClient.complete(prompt, 4096, FISCAL_SYSTEM_PROMPT),
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
     * Parsear reporte
     */
    const reporte = this.parseReporte(response.text);

    /**
     * Extraer usage de la respuesta
     */
    const usage = {
      input_tokens: response.inputTokens,
      output_tokens: response.outputTokens,
      model: response.model,
    };

    /**
     * Construir salida
     */
    const output: SintesisOutput & { usage: any } = {
      ...reporte,
      cantidad_hallazgos: input.hallazgos_malicia.length,
      tiempo_ejecucion_ms: Date.now() - startTime,
      usage,
    };

    /**
     * Guardar en caché
     */
    cacheService.set(CacheType.SINTESIS_REPORT, 'reporte', output, cacheKey);

    /**
     * Auditoría
     */
    auditLog(
      AuditEventType.FISCAL_EXECUTION,
      'Reporte Fiscal completado',
      {
        cantidad_hallazgos: input.hallazgos_malicia.length,
        puntuacion_riesgo: output.puntuacion_riesgo,
        tiempo_ms: output.tiempo_ejecucion_ms,
        usage,
      }
    );

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
   * Construir prompt para el Fiscal (solo datos, instrucciones en system prompt)
   * OPTIMIZED: User prompt contains ONLY data to synthesize
   * (~150 tokens - instructions moved to FISCAL_SYSTEM_PROMPT)
   */
  private construirPrompt(input: SintesisInput): string {
    let prompt = `Malicious code findings:
\`\`\`json
${JSON.stringify(input.hallazgos_malicia, null, 2)}
\`\`\`

Forensic timeline:
\`\`\`json
${JSON.stringify(input.linea_tiempo_forenses, null, 2)}
\`\`\`

Create a comprehensive executive security report synthesizing these findings and forensic analysis.`;

    if (input.contexto_repo) {
      prompt += `\n\nRepository context:\n${input.contexto_repo}`;
    }

    return prompt;
  }

  /**
   * Parsear reporte de la respuesta
   */
  private parseReporte(texto: string): Omit<SintesisOutput, 'cantidad_hallazgos' | 'tiempo_ejecucion_ms'> {
    try {
      /**
       * Extraer JSON
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

      return {
        resumen_ejecutivo: parsed.resumen_ejecutivo,
        desglose_severidad: parsed.desglose_severidad,
        funciones_comprometidas: parsed.funciones_comprometidas || [],
        linea_de_ataque: parsed.linea_de_ataque,
        prioridad_remediacion: parsed.prioridad_remediacion || [],
        autores_afectados: parsed.autores_afectados || [],
        puntuacion_riesgo: parsed.puntuacion_riesgo || 0,
        recomendacion_general: parsed.recomendacion_general,
      };
    } catch (error) {
      logger.error(`Error parseando reporte: ${error}`);
      return {
        resumen_ejecutivo: 'Error procesando reporte',
        desglose_severidad: {},
        funciones_comprometidas: [],
        linea_de_ataque: 'No disponible',
        prioridad_remediacion: [],
        autores_afectados: [],
        puntuacion_riesgo: 0,
        recomendacion_general: 'Ver logs para detalles del error',
      };
    }
  }

  /**
   * Chat explicativo sobre un hallazgo específico (Inteligencia Explicativa)
   */
  async chatearConHallazgo(params: {
    finding: any;
    remediation?: any;
    question: string;
  }): Promise<{ answer: string; usage: any }> {
    try {
      const { finding, remediation, question } = params;

      const prompt = `
# INTELIGENCIA EXPLICATIVA - SCR AGENT
Actúa como un experto sénior en ciberseguridad y auditoría de código. Tu objetivo es explicar de forma pedagógica y técnica un hallazgo detectado por SCR Agent.

## Hallazgo Detectado
- **Tipo**: ${finding.riskType}
- **Archivo**: ${finding.file}
- **Severidad**: ${finding.severity}
- **Descripción Inicial**: ${finding.whySuspicious}
- **Código Relacionado**:
\`\`\`
${finding.codeSnippet || 'No disponible'}
\`\`\`

${remediation ? `
## Remediación Sugerida
- **Notas**: ${remediation.correctionNotes || 'No disponible'}
` : ''}

## Pregunta del Usuario
"${question}"

## Instrucciones para tu respuesta:
1. Sé técnico pero claro.
2. Explica el **vector de ataque** específico en este contexto de código.
3. Si el usuario pregunta por qué se identifica así, menciona los patrones de SCR (intención, ofuscación, lógica inusual).
4. Proporciona ejemplos si es necesario para ilustrar el riesgo.
5. Usa un tono profesional y directo.

Responde directamente a la pregunta. No incluyas JSON, solo texto plano o markdown.
`;

      const llmClient = this.getLLMClient();
      const config = llmClient.getConfig();

      // Wrap LLM call with timeout to detect hanging requests
      const response = await Promise.race([
        llmClient.complete(prompt, 2048),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error(`LLM request timeout (5 minutos) - ${config.provider}/${config.model} no respondió`)),
            5 * 60 * 1000
          )
        ) as any,
      ]);

      const answer = response.text;

      const usage = {
        input_tokens: response.inputTokens,
        output_tokens: response.outputTokens,
        model: response.model,
      };

      return { answer, usage };
    } catch (error) {
      logger.error(`Error en chat de hallazgo: ${error}`);
      throw error;
    }
  }

  /**
   * Generar hash de entrada (para caché)
   */
  private hashInput(input: SintesisInput): string {
    const str = JSON.stringify(input);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}

/**
 * Singleton exportado
 */
export const fiscalAgent = new FiscalAgentService();
