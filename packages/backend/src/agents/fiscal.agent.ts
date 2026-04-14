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
 * Modelo: Claude 3.5 Sonnet (análisis complejo)
 * Entrada: Hallazgos de Malicia + Timeline de Forenses
 * Salida: SintesisOutput con reporte ejecutivo
 */

import Anthropic from '@anthropic-ai/sdk';
import { logger, auditLog, AuditEventType } from '../services/logger.service';
import { cacheService, CacheType } from '../services/cache.service';
import {
  SintesisInput,
  SintesisOutput,
  PasoRemediacion,
} from '../types/agents';

/**
 * Servicio del Agente Fiscal
 */
export class FiscalAgentService {
  /**
   * Cliente de Anthropic
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
   * Actualizar configuración dinámicamente
   */
  updateConfig(apiKey: string): void {
    if (this.apiKey !== apiKey) {
      this.apiKey = apiKey;
      this.anthropic = null; // Forzar re-inicialización
      logger.info('FiscalAgent: API Key actualizada');
    }
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
   * Generar síntesis y reporte ejecutivo
   */
  async generarReporte(input: SintesisInput): Promise<SintesisOutput> {
    const startTime = Date.now();

    try {
      logger.info('Iniciando síntesis de reporte');

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

      /**
       * Construir prompt para Claude
       */
      const prompt = this.construirPrompt(input);

      /**
       * Llamar a Claude
       */
      logger.info(`Llamando a Claude ${this.model}`);
      const response = await this.getAnthropicClient().messages.create({
        model: this.model,
        max_tokens: 4096,
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
       * Parsear reporte
       */
      const reporte = this.parseReporte(textoRespuesta);

      /**
       * Extraer usage de la respuesta de Anthropic
       */
      const usage = {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
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
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`Error en síntesis: ${errorMsg}`);
      throw error;
    }
  }

  /**
   * Construir prompt para Claude
   */
  private construirPrompt(input: SintesisInput): string {
    return `
# Análisis Ejecutivo - Síntesis de Hallazgos de Seguridad

Se han realizado análisis de Malicia y Forenses. Ahora necesitamos generar un reporte ejecutivo.

## Hallazgos de Código Malicioso
\`\`\`json
${JSON.stringify(input.hallazgos_malicia, null, 2)}
\`\`\`

## Línea de Tiempo Forense
\`\`\`json
${JSON.stringify(input.linea_tiempo_forenses, null, 2)}
\`\`\`

## Tarea
Genera un reporte ejecutivo que incluya:

1. **Resumen Ejecutivo**: Descripción clara del riesgo encontrado (2-3 párrafos)
2. **Desglose de Severidad**: Conteo de hallazgos por severidad (CRÍTICO, ALTO, MEDIO, BAJO)
3. **Funciones Comprometidas**: Lista de funciones maliciosas identificadas
4. **Línea de Ataque**: Descripción de cómo evolucionó el código malicioso en el tiempo
5. **Prioridad de Remediación**:
   - Paso 1-3 con acciones específicas
   - Cada paso con justificación
   - Nivel de urgencia
6. **Autores Afectados**: Quién fue responsable de los cambios
7. **Puntuación de Riesgo**: 0-100 (100 = crítico)
8. **Recomendación General**: Acciones inmediatas recomendadas

## Severidades (usar siempre estos términos)
- CRÍTICO: Riesgo inmediato de compromiso total
- ALTO: Vulnerabilidad seria que permite acceso/manipulación
- MEDIO: Debilidad de seguridad que puede ser explotada
- BAJO: Problema menor de seguridad

## Formato de Respuesta
Responde SOLO con JSON válido:

\`\`\`json
{
  "resumen_ejecutivo": "...",
  "desglose_severidad": {
    "CRÍTICO": 1,
    "ALTO": 2,
    "MEDIO": 1,
    "BAJO": 0
  },
  "funciones_comprometidas": ["autenticarUsuario", "validarToken"],
  "linea_de_ataque": "15-Mar-2024: Introducción inicial → 16-Mar-2024: Ofuscación y endurecimiento",
  "prioridad_remediacion": [
    {
      "orden": 1,
      "accion": "Revertir commits abc123 y xyz789 inmediatamente",
      "justificacion": "Código crítico comprometido que permite bypass de autenticación",
      "urgencia": "CRÍTICA"
    }
  ],
  "autores_afectados": ["usuario@ejemplo.com"],
  "puntuacion_riesgo": 92,
  "recomendacion_general": "Investigación de seguridad inmediata. Considerar rotación de credenciales del autor."
}
\`\`\`

${input.contexto_repo ? `\n## Contexto del Repositorio\n${input.contexto_repo}` : ''}
`;
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

      const response = await this.getAnthropicClient().messages.create({
        model: this.model,
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      });

      const answer = response.content
        .filter((block: any) => block.type === 'text')
        .map((block: any) => block.text)
        .join('\n')
        .trim();

      const usage = {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
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
