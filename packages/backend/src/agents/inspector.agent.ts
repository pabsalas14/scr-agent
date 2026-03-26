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
 *
 * OWASP Coverage:
 * - A03: Injection - Detectar patrones de inyección
 * - A04: Insecure Design - Lógica de seguridad rota
 * - A06: Vulnerable Components - Código desconocido/ofuscado
 */

import Anthropic from '@anthropic-ai/sdk';
import { logger, auditLog, AuditEventType } from '../services/logger.service';
import { cacheService, CacheType } from '../services/cache.service';
import { MaliciaInput, MaliciaOutput, MaliciaFinding } from '../types/agents';

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
  private anthropic: Anthropic;

  /**
   * Modelo a usar
   */
  private model = 'claude-3-5-sonnet-20241022';

  constructor(apiKey?: string) {
    this.anthropic = new Anthropic({
      apiKey: apiKey || process.env['ANTHROPIC_API_KEY'],
    });
  }

  /**
   * Analizar código en busca de funciones maliciosas
   */
  async analizarCodigo(input: MaliciaInput): Promise<MaliciaOutput> {
    const startTime = Date.now();

    try {
      logger.info('Iniciando análisis Malicia');

      /**
       * Verificar caché primero
       * Usar hash del código como parte de la clave
       */
      const codigoHash = this.hashCode(input.codigo);
      const cached = cacheService.get<MaliciaOutput>(
        CacheType.MALICIA_FINDING,
        'analisis',
        codigoHash
      );

      if (cached) {
        logger.info('Resultado encontrado en caché');
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
      if (!contenido || contenido.type !== 'text') {
        throw new Error('Respuesta inesperada de Claude');
      }
      const texto = contenido.text;

      /**
       * Parsear JSON de la respuesta
       */
      const hallazgos = this.parseRespuesta(texto);

      /**
       * Construir salida
       */
      const output: MaliciaOutput = {
        hallazgos,
        resumen: `Se encontraron ${hallazgos.length} hallazgos potenciales de código malicioso`,
        cantidad_hallazgos: hallazgos.length,
        tiempo_ejecucion_ms: Date.now() - startTime,
      };

      /**
       * Guardar en caché
       */
      cacheService.set(CacheType.MALICIA_FINDING, 'analisis', output, codigoHash);

      /**
       * Auditoría
       */
      auditLog(AuditEventType.MALICIA_EXECUTION, 'Análisis Malicia completado', {
        cantidad_hallazgos: hallazgos.length,
        tiempo_ms: output.tiempo_ejecucion_ms,
      });

      return output;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`Error en análisis Malicia: ${errorMsg}`);
      throw error;
    }
  }

  /**
   * Construir prompt para Claude
   */
  private construirPrompt(input: MaliciaInput): string {
    return `
# Análisis de Seguridad de Código - Detector de Malicia

Analiza el siguiente código en busca de funcionalidades maliciosas, backdoors, lógica oculta, y comportamientos sospechosos.

## Código a Analizar
\`\`\`${input.lenguaje || 'javascript'}
${input.codigo}
\`\`\`

## Instrucciones
1. Identifica TODAS las funciones que podrían ser maliciosas
2. Para cada hallazgo, proporciona:
   - Ubicación exacta (archivo, función, líneas)
   - Severidad: BAJO, MEDIO, ALTO, CRÍTICO
   - Tipo de riesgo: PUERTA_TRASERA, INYECCION, BOMBA_LOGICA, OFUSCACION, SOSPECHOSO, etc.
   - Por qué es sospechoso (explicación técnica clara)
   - Confianza (0-1)
   - Pasos de remediación

3. Busca especialmente:
   - Lógica de bypass de autenticación
   - Código ofuscado o codificado
   - Errores swallowed sin logging
   - Valores hardcodeados inusuales
   - Inyección de SQL/Comandos
   - Eval o ejecución dinámica

## Formato de Respuesta
Responde SOLO con JSON válido, sin markdown ni explicación adicional:
\`\`\`json
{
  "hallazgos": [
    {
      "archivo": "src/api.js",
      "funcion": "autenticarUsuario",
      "rango_lineas": [45, 52],
      "fragmento_codigo": "if(user === 'admin' && pwd === hardcodedBypass) ...",
      "severidad": "CRÍTICO",
      "tipo_riesgo": "PUERTA_TRASERA",
      "por_que_sospechoso": "Lógica de bypass hardcodeada que evita validación de contraseña",
      "confianza": 0.95,
      "pasos_remediacion": [
        "Remover la condición de bypass",
        "Implementar autenticación adecuada",
        "Auditar git history para encontrar cuándo se agregó"
      ]
    }
  ]
}
\`\`\`

${input.contexto ? `\n## Contexto Adicional\n${input.contexto}` : ''}
`;
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
        jsonStr = jsonMatch[1] ?? texto;
      } else {
        // Buscar JSON plano
        const jsonMatch2 = texto.match(/\{[\s\S]*\}/);
        if (jsonMatch2) {
          jsonStr = jsonMatch2[0];
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
