/**
 * ============================================================================
 * TESTS: Agente Inspector
 * ============================================================================
 *
 * Pruebas unitarias del agente de detección de código malicioso
 * Se mockea la API de Anthropic para pruebas deterministas y sin costo
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InspectorAgentService } from '../../src/agents/inspector.agent';

/**
 * Mock del cliente Anthropic
 * Simula respuestas del LLM sin llamadas reales
 */
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn(),
      },
    })),
  };
});

/**
 * Mock del servicio de caché
 */
vi.mock('../../src/services/cache.service', () => ({
  cacheService: {
    get: vi.fn().mockReturnValue(null), // Siempre caché miss en tests
    set: vi.fn(),
  },
  CacheType: {
    MALICIA_FINDING: 'malicia:finding',
  },
}));

describe('InspectorAgentService', () => {
  let agente: InspectorAgentService;
  let anthropicMock: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    agente = new InspectorAgentService('api-key-test');
    // Obtener la instancia mockeada creada dentro del agente
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const AnthropicMock = vi.mocked(Anthropic);
    anthropicMock = AnthropicMock.mock.results[0]?.value;

    if (!anthropicMock?.messages?.create) {
      throw new Error('No se pudo obtener el mock de Anthropic.messages.create');
    }
  });

  it('detecta un backdoor en código sospechoso', async () => {
    /**
     * Respuesta simulada del LLM con un hallazgo de backdoor
     */
    anthropicMock.messages.create.mockResolvedValueOnce({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            hallazgos: [
              {
                archivo: 'src/auth.js',
                funcion: 'login',
                rango_lineas: [10, 15],
                severidad: 'CRÍTICO',
                tipo_riesgo: 'PUERTA_TRASERA',
                por_que_sospechoso:
                  'Condicional bypasea autenticación con contraseña hardcodeada',
                confianza: 0.98,
                pasos_remediacion: ['Remover bypass', 'Auditar historial'],
              },
            ],
          }),
        },
      ],
    });

    const resultado = await agente.analizarCodigo({
      codigo: `
        function login(user, pwd) {
          if (pwd === 'supersecret123') return true; // bypass
          return checkDb(user, pwd);
        }
      `,
    });

    expect(resultado.hallazgos).toHaveLength(1);
    expect(resultado.hallazgos[0]?.severidad).toBe('CRÍTICO');
    expect(resultado.hallazgos[0]?.tipo_riesgo).toBe('PUERTA_TRASERA');
    expect(resultado.cantidad_hallazgos).toBe(1);
  });

  it('retorna lista vacía cuando el código es limpio', async () => {
    anthropicMock.messages.create.mockResolvedValueOnce({
      content: [
        {
          type: 'text',
          text: JSON.stringify({ hallazgos: [] }),
        },
      ],
    });

    const resultado = await agente.analizarCodigo({
      codigo: `
        function sumar(a: number, b: number): number {
          return a + b;
        }
      `,
    });

    expect(resultado.hallazgos).toHaveLength(0);
    expect(resultado.cantidad_hallazgos).toBe(0);
  });

  it('maneja errores de parseo de JSON gracefully', async () => {
    /**
     * LLM devuelve texto no JSON
     */
    anthropicMock.messages.create.mockResolvedValueOnce({
      content: [
        {
          type: 'text',
          text: 'No encontré ningún problema en el código analizado.',
        },
      ],
    });

    const resultado = await agente.analizarCodigo({
      codigo: 'const x = 1;',
    });

    // No debe tirar error, devuelve lista vacía
    expect(resultado.hallazgos).toHaveLength(0);
  });

  it('detecta múltiples tipos de riesgo', async () => {
    anthropicMock.messages.create.mockResolvedValueOnce({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            hallazgos: [
              {
                archivo: 'src/db.js',
                funcion: 'query',
                rango_lineas: [5, 8],
                severidad: 'ALTO',
                tipo_riesgo: 'INYECCION',
                por_que_sospechoso: 'Query SQL concatenado sin sanitización',
                confianza: 0.92,
                pasos_remediacion: ['Usar prepared statements'],
              },
              {
                archivo: 'src/utils.js',
                funcion: 'decode',
                rango_lineas: [20, 25],
                severidad: 'MEDIO',
                tipo_riesgo: 'OFUSCACION',
                por_que_sospechoso: 'Uso de atob() para ocultar lógica',
                confianza: 0.75,
                pasos_remediacion: ['Revisar qué se decodifica'],
              },
            ],
          }),
        },
      ],
    });

    const resultado = await agente.analizarCodigo({
      codigo: `
        const q = "SELECT * FROM users WHERE id = " + userId;
        const hidden = atob("aGlkZGVuX2xvZ2lj");
      `,
    });

    expect(resultado.hallazgos).toHaveLength(2);
    expect(resultado.hallazgos.map((h) => h.tipo_riesgo)).toContain('INYECCION');
    expect(resultado.hallazgos.map((h) => h.tipo_riesgo)).toContain('OFUSCACION');
  });

  it('incluye tiempo de ejecución en la respuesta', async () => {
    anthropicMock.messages.create.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify({ hallazgos: [] }) }],
    });

    const resultado = await agente.analizarCodigo({ codigo: 'const x = 1;' });

    // En entornos rápidos puede ser 0ms; solo validamos que exista y sea no-negativo
    expect(resultado.tiempo_ejecucion_ms).toBeGreaterThanOrEqual(0);
  });
});
