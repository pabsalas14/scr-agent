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

/**
 * Tamaño máximo de código por llamada al LLM
 *
 * LM Studio's qwen2.5-coder-7b-instruct has a 4K token context window.
 *
 * Issue: Model generating empty responses despite 512 output tokens allocated
 * Root cause: Input too large (1800 bytes) for LM Studio to process + generate JSON coherently
 * Solution: Reduce to 1200 bytes per chunk to give model better context ratio
 *
 * Aggressive chunking: Better to analyze 1200 bytes deeply than 1800 bytes shallowly
 */
const MAX_CHUNK_BYTES = 1200; // Further reduced - qwen2.5-coder struggles with larger chunks

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
   * Configuración por defecto (Anthropic)
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
   * Divide en batches de MAX_CHUNK_BYTES, hace N llamadas y consolida resultados.
   */
  async analizarArchivos(
    archivos: Array<{ path: string; content: string }>,
    contexto?: string
  ): Promise<MaliciaOutput> {
    const startTime = Date.now();
    const chunks = this.splitEnChunks(archivos);
    logger.info(`Inspector: ${archivos.length} archivos → ${chunks.length} chunk(s) de análisis`);

    // Log chunk sizes for debugging
    chunks.forEach((chunk, i) => {
      const chunkSize = chunk.reduce((sum, f) => sum + f.content.length, 0);
      logger.info(`Chunk ${i + 1}: ${chunk.length} archivos, ${chunkSize} bytes`);
    });

    // Ejecutar análisis de chunks con timeout global para toda la operación
    // Máximo 35 minutos para todos los chunks (1 minuto de overhead + 30 min para Inspector + 4 min extra)
    const resultados = await Promise.race([
      Promise.all(
        chunks.map((chunk, i) =>
          this.analizarCodigo({
            codigo: chunk.map((f) => `// === ${f.path} ===\n${f.content}`).join('\n\n'),
            contexto: chunks.length > 1 ? `${contexto ?? ''} [Parte ${i + 1}/${chunks.length}]` : contexto,
          })
        )
      ),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`Inspector Agent chunks analysis timeout (35 minutos) - uno de los chunks tardó demasiado`)),
          35 * 60 * 1000
        )
      ) as any,
    ]);

    // Consolidar hallazgos de todos los chunks
    const todosHallazgos = resultados.flatMap((r) => r.hallazgos);
    const totalInputTokens = resultados.reduce((s, r) => s + ((r as any).usage?.input_tokens ?? 0), 0);
    const totalOutputTokens = resultados.reduce((s, r) => s + ((r as any).usage?.output_tokens ?? 0), 0);

    const output: MaliciaOutput & { usage: any } = {
      hallazgos: todosHallazgos,
      resumen: `Se encontraron ${todosHallazgos.length} hallazgos en ${chunks.length} parte(s)`,
      cantidad_hallazgos: todosHallazgos.length,
      tiempo_ejecucion_ms: Date.now() - startTime,
      usage: { input_tokens: totalInputTokens, output_tokens: totalOutputTokens, model: this.getLLMClient().getModel() },
    };

    auditLog(AuditEventType.INSPECTOR_EXECUTION, 'Análisis Inspector completado', {
      chunks: chunks.length,
      cantidad_hallazgos: todosHallazgos.length,
      tiempo_ms: output.tiempo_ejecucion_ms,
      usage: output.usage,
    });

    return output;
  }

  /**
   * Analizar código en busca de funciones maliciosas (un solo chunk).
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

      const prompt = this.construirPrompt(input);
      const llmClient = this.getLLMClient();
      const config = llmClient.getConfig();
      logger.info(`Llamando a ${config.provider} (${config.model})`);

      // Log prompt size for debugging
      const promptSize = Buffer.byteLength(prompt, 'utf-8');
      logger.info(`Prompt size: ${promptSize} bytes, Código size: ${input.codigo.length} bytes`);

      // For LM Studio with 4K context, allocate 768 tokens for JSON response output
      // Model was returning empty responses - increased output space for better JSON generation
      const maxOutputTokens = config.provider === 'lmstudio' ? 768 : 4096;

      // Wrap LLM call with timeout to detect hanging requests
      // LM Studio should respond within 5 minutes for code analysis
      const response = await Promise.race([
        llmClient.complete(prompt, maxOutputTokens),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error(`LLM request timeout (5 minutos) - ${config.provider}/${config.model} no respondió`)),
            5 * 60 * 1000
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
   * Construir prompt para Claude
   */
  private construirPrompt(input: MaliciaInput): string {
    return `Analiza el siguiente código fuente en busca de funcionalidades maliciosas: backdoors, inyecciones, bombas lógicas, ofuscación, bypass de autenticación, errores silenciados, credenciales hardcodeadas y ejecución dinámica (eval/exec).${input.contexto ? ` Contexto: ${input.contexto}` : ''}

\`\`\`
${input.codigo}
\`\`\`

Responde ÚNICAMENTE con JSON válido con esta estructura (sin texto adicional):
{"hallazgos":[{"archivo":"ruta","funcion":"nombre","rango_lineas":[inicio,fin],"fragmento_codigo":"...","severidad":"CRÍTICO|ALTO|MEDIO|BAJO","tipo_riesgo":"PUERTA_TRASERA|INYECCION|BOMBA_LOGICA|OFUSCACION|SOSPECHOSO|HARDCODED_VALUES|ERROR_HANDLING","por_que_sospechoso":"explicación técnica","confianza":0.0,"pasos_remediacion":["paso1"]}]}`;
  }

  /**
   * Parsear respuesta JSON de Claude
   */
  private parseRespuesta(texto: string): MaliciaFinding[] {
    try {
      /**
       * Intentar extraer JSON del texto
       * A veces Claude envolverá con markdown
       */
      let jsonStr = texto;

      // Buscar JSON entre ```json y ```
      const jsonMatch = texto.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1] ?? jsonStr;
      } else {
        // Buscar JSON plano
        const jsonMatch2 = texto.match(/\{[\s\S]*\}/);
        if (jsonMatch2) {
          jsonStr = jsonMatch2[0] ?? jsonStr;
        }
      }

      const parsed = JSON.parse(jsonStr);
      return parsed.hallazgos || [];
    } catch (error) {
      logger.error(`Error parseando respuesta de Malicia: ${error}`);
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
