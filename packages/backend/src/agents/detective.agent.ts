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
 * Modelo: Claude 3.5 Haiku (rápido y económico)
 * Entrada: Hallazgos de Malicia + Historial de Git
 * Salida: ForensesOutput con timeline de eventos
 */

import Anthropic from '@anthropic-ai/sdk';
import { logger, auditLog, AuditEventType } from '../services/logger.service';
import { cacheService, CacheType } from '../services/cache.service';
import { gitService } from '../services/git.service';
import { ForensesInput, ForensesOutput, EventoForense } from '../types/agents';

/**
 * Servicio del Agente Detective
 */
export class DetectiveAgentService {
  /**
   * Cliente de Anthropic
   */
  private anthropic: Anthropic | null = null;
  private apiKey: string | undefined;

  /**
   * Modelo a usar (Haiku para rapidez y economía)
   */
  private model = 'claude-haiku-4-5-20251001';

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
   * Investigar historial de Git para hallazgos de malicia
   */
  async investigarHistorial(input: ForensesInput): Promise<ForensesOutput> {
    const startTime = Date.now();

    try {
      logger.info('Iniciando análisis Forenses');

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

      /**
       * Construir prompt para Claude
       */
      const prompt = this.construirPrompt(input);

      /**
       * Llamar a Claude Haiku
       */
      logger.info(`Llamando a Claude ${this.model}`);
      const response = await this.getAnthropicClient().messages.create({
        model: this.model,
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      /**
       * Procesar respuesta
       */
      const textoRespuesta = response.content
        .filter((block: any) => block.type === 'text')
        .map((block: any) => block.text)
        .join('\n')
        .trim();

      if (!textoRespuesta) {
        throw new Error('Respuesta inesperada de Claude');
      }

      /**
       * Parsear timeline
       */
      const eventos = this.parseTimeline(textoRespuesta);

      /**
       * Extraer usage de la respuesta de Anthropic
       */
      const usage = {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
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
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`Error en análisis Forenses: ${errorMsg}`);
      throw error;
    }
  }

  /**
   * Construir prompt para Claude Haiku
   */
  private construirPrompt(input: ForensesInput): string {
    return `
# Análisis Forense de Git - Investigación de Cadena de Compromiso

Se han encontrado los siguientes hallazgos maliciosos:

## Hallazgos de Malicia
\`\`\`json
${JSON.stringify(input.hallazgos_malicia, null, 2)}
\`\`\`

## Historial de Commits (últimos 50)
\`\`\`json
${JSON.stringify(input.historial_commits.slice(0, 50), null, 2)}
\`\`\`

## Tarea
Analiza el historial de Git para:

1. **Línea de Tiempo**: Crea una línea de tiempo de cuándo se agregó/modificó el código malicioso
2. **Correlaciones**: Identifica commits relacionados y cambios asociados
3. **Patrones**: Busca patrones que sugieran una cadena de compromiso (ej: introducción gradual)
4. **Autores**: Identifica autores sospechosos basándote en patrones de cambio
5. **Escalation**: Describe cómo evolucionó el código malicioso (ofuscación creciente, etc.)

## Formato de Respuesta
Responde SOLO con JSON válido:

\`\`\`json
{
  "eventos": [
    {
      "timestamp": "2024-03-15T10:30:00Z",
      "commit": "abc123",
      "autor": "usuario@ejemplo.com",
      "archivo": "src/api.js",
      "funcion": "autenticarUsuario",
      "accion": "AGREGADO",
      "mensaje_commit": "Agregada validación de autenticación",
      "resumen_cambios": "Nueva función de autenticación",
      "nivel_riesgo": "ALTO",
      "indicadores_sospecha": ["Código sin documentación", "Función inusual"]
    }
  ],
  "patrones": ["Introducción gradual de código ofuscado", "Mismo autor en todos los cambios"],
  "autores_sospechosos": ["usuario@ejemplo.com"]
}
\`\`\`
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
