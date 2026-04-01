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
 * Modelo: Claude 3.5 Sonnet
 * Entrada: Código fuente (por archivo o repositorio)
 * Salida: MaliciaOutput con hallazgos detallados
 */

import Anthropic from '@anthropic-ai/sdk';
import { logger, auditLog, AuditEventType } from '../services/logger.service';
import { cacheService, CacheType } from '../services/cache.service';
import { MaliciaInput, MaliciaOutput, MaliciaFinding } from '../types/agents';

/** Tamaño máximo de código por llamada a Claude (500 KB) */
const MAX_CHUNK_BYTES = 500 * 1024;

/**
 * Patrones conocidos de malicia
 * Se usan para enfocar el análisis del LLM
 */
const MALICIOUS_PATTERNS = {
  backdoors: [
    'hardcoded.*bypass',
    'credential.*check.*===.*false',
    'admin.*===.*user',
    'if.*eval',
    'exec\\(',
    'system\\(',
  ],
  injection: [
    'sql.*concat',
    'query.*\\+',
    'eval',
    'innerHTML.*=',
    'exec\\(.*process\\.env',
  ],
  obfuscation: [
    'atob\\(',
    'btoa\\(',
    'String\\.fromCharCode',
    'charCodeAt',
    '_0x[0-9a-f]{4}',
  ],
  suspiciousErrors: [
    'try.*catch.*\\{\\}',
    'catch.*\\{\\}',
    'error.*swallow',
    'ignore.*error',
  ],
};

/**
 * Servicio del Agente Inspector
 */
export class InspectorAgentService {
  /**
   * Cliente de Anthropic para acceder a Claude
   */
  private anthropic: Anthropic | null = null;
  private apiKey: string | undefined;

  /**
   * Modelo a usar
   */
  private model = 'claude-sonnet-4-6';

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  /**
   * Obtener cliente de Anthropic (lazy init)
   */
  private getAnthropicClient(): Anthropic {
    if (!this.anthropic) {
      const key = this.apiKey || process.env['ANTHROPIC_API_KEY'];
      if (!key) {
        throw new Error('ANTHROPIC_API_KEY environment variable not set');
      }
      this.anthropic = new Anthropic({ apiKey: key });
    }
    return this.anthropic;
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

    const resultados = await Promise.all(
      chunks.map((chunk, i) =>
        this.analizarCodigo({
          codigo: chunk.map((f) => `// === ${f.path} ===\n${f.content}`).join('\n\n'),
          contexto: chunks.length > 1 ? `${contexto ?? ''} [Parte ${i + 1}/${chunks.length}]` : contexto,
        })
      )
    );

    // Consolidar hallazgos de todos los chunks
    const todosHallazgos = resultados.flatMap((r) => r.hallazgos);
    const totalInputTokens = resultados.reduce((s, r) => s + ((r as any).usage?.input_tokens ?? 0), 0);
    const totalOutputTokens = resultados.reduce((s, r) => s + ((r as any).usage?.output_tokens ?? 0), 0);

    const output: MaliciaOutput & { usage: any } = {
      hallazgos: todosHallazgos,
      resumen: `Se encontraron ${todosHallazgos.length} hallazgos en ${chunks.length} parte(s)`,
      cantidad_hallazgos: todosHallazgos.length,
      tiempo_ejecucion_ms: Date.now() - startTime,
      usage: { input_tokens: totalInputTokens, output_tokens: totalOutputTokens, model: this.model },
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
      logger.info(`Llamando a Claude ${this.model}`);
      const response = await this.getAnthropicClient().messages.create({
        model: this.model,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      });

      const textoRespuesta = response.content
        .filter((block: { type: string }) => block.type === 'text')
        .map((block: { text: string }) => block.text)
        .join('\n')
        .trim();

      if (!textoRespuesta) throw new Error('Respuesta inesperada de Claude');

      const hallazgos = this.parseRespuesta(textoRespuesta);
      const usage = {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
        model: response.model,
      };

      const output: MaliciaOutput & { usage: typeof usage } = {
        hallazgos,
        resumen: `Se encontraron ${hallazgos.length} hallazgos potenciales de código malicioso`,
        cantidad_hallazgos: hallazgos.length,
        tiempo_ejecucion_ms: Date.now() - startTime,
        usage,
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
   * Nunca corta un archivo a la mitad.
   */
  private splitEnChunks(archivos: Array<{ path: string; content: string }>): Array<typeof archivos> {
    const chunks: Array<typeof archivos> = [];
    let chunk: typeof archivos = [];
    let chunkSize = 0;

    for (const archivo of archivos) {
      const fileSize = Buffer.byteLength(archivo.content, 'utf-8');
      if (chunk.length > 0 && chunkSize + fileSize > MAX_CHUNK_BYTES) {
        chunks.push(chunk);
        chunk = [];
        chunkSize = 0;
      }
      chunk.push(archivo);
      chunkSize += fileSize;
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
