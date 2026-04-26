/**
 * Límites de contexto LLM en agentes.
 *
 * Valores agresivos (p. ej. ~150B por chunk) existían para modelos locales 4K (Qwen 7B).
 * Los defaults ahora asumen modelos vía API con contexto amplio. Para modelos pequeños,
 * ajusta variables de entorno (ver README backend o .env.example).
 */

function parsePositiveInt(value: string | undefined, defaultVal: number): number {
  if (value == null || value === '') {
    return defaultVal;
  }
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : defaultVal;
}

function envBool(name: string, defaultVal: boolean): boolean {
  const v = process.env[name];
  if (v === '1' || v === 'true') {
    return true;
  }
  if (v === '0' || v === 'false') {
    return false;
  }
  return defaultVal;
}

export const agentContextConfig = {
  /**
   * Bytes UTF-8 máximos de código (sin contar prompts) por petición al Inspector.
   * Default 200_000: muchos fewer chunks en repos grandes; adecuado p. ej. para Claude.
   */
  get inspectorMaxChunkBytes(): number {
    return parsePositiveInt(process.env['INSPECTOR_MAX_CHUNK_BYTES'], 200_000);
  },

  /**
   * Quitar comentarios/espacios antes de enviar al LLM. Útil para ahorrar tokens en
   * modelos 4K; con modelos fuertes suele añadir ruido y riesgo de perder pistas.
   * Default: desactivado. Activa: INSPECTOR_CODE_COMPRESSION=1
   */
  get inspectorCodeCompressionEnabled(): boolean {
    return envBool('INSPECTOR_CODE_COMPRESSION', false);
  },

  get inspectorMaxOutputTokens(): number {
    return parsePositiveInt(process.env['INSPECTOR_MAX_OUTPUT_TOKENS'], 4096);
  },

  get detectiveMaxFindingsPerChunk(): number {
    return parsePositiveInt(process.env['DETECTIVE_MAX_FINDINGS_PER_CHUNK'], 40);
  },

  get fiscalMaxFindingsPerChunk(): number {
    return parsePositiveInt(process.env['FISCAL_MAX_FINDINGS_PER_CHUNK'], 30);
  },
} as const;
