/**
 * ============================================================================
 * AGENTE SÍNTESIS - Síntesis de Reportes
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
 *
 * OWASP Coverage:
 * - A01: Broken Access Control - Recomendaciones de seguridad
 * - A04: Insecure Design - Análisis de arquitectura
 * - A09: Logging & Monitoring - Recomendaciones de auditoría
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
 * Servicio del Agente Síntesis
 */
export class SintesisAgentService {
  /**
   * Cliente de Anthropic
   */
  private anthropic: Anthropic;

  /**
   * Modelo a usar
   */
  private model = 'claude-3-5-sonnet-20241022';

  constructor(apiKey?: string) {
    this.anthropic = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
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
      const response = await this.anthropic.messages.create({
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
      const contenido = response.content[0];
      if (contenido.type !== 'text') {
        throw new Error('Respuesta inesperada de Claude');
      }

      /**
       * Parsear reporte
       */
      const reporte = this.parseReporte(contenido.text);

      /**
       * Construir salida
       */
      const output: SintesisOutput = {
        ...reporte,
        cantidad_hallazgos: input.hallazgos_malicia.length,
        tiempo_ejecucion_ms: Date.now() - startTime,
      };

      /**
       * Guardar en caché
       */
      cacheService.set(CacheType.SINTESIS_REPORT, 'reporte', output, cacheKey);

      /**
       * Auditoría
       */
      auditLog(
        AuditEventType.SINTESIS_EXECUTION,
        'Síntesis de reporte completada',
        {
          cantidad_hallazgos: input.hallazgos_malicia.length,
          puntuacion_riesgo: output.puntuacion_riesgo,
          tiempo_ms: output.tiempo_ejecucion_ms,
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
        jsonStr = jsonMatch[1];
      } else {
        const jsonMatch2 = texto.match(/\{[\s\S]*\}/);
        if (jsonMatch2) {
          jsonStr = jsonMatch2[0];
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
export const sintesisAgent = new SintesisAgentService();
