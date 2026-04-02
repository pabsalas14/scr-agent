/**
 * Precios de modelos Claude en USD por token.
 * Fuente: https://anthropic.com/pricing — actualizar cuando cambien.
 */
export const MODEL_PRICES: Record<string, { input: number; output: number }> = {
  'claude-opus-4-6':              { input: 0.000015,    output: 0.000075   },
  'claude-sonnet-4-6':            { input: 0.000003,    output: 0.000015   },
  'claude-haiku-4-5-20251001':    { input: 0.0000008,   output: 0.000004   },
  'claude-3-7-sonnet-20250219':   { input: 0.000003,    output: 0.000015   },
  'claude-3-5-sonnet-20241022':   { input: 0.000003,    output: 0.000015   },
  'claude-3-5-haiku-20241022':    { input: 0.0000008,   output: 0.000004   },
  'claude-3-opus-20240229':       { input: 0.000015,    output: 0.000075   },
  'claude-3-sonnet-20240229':     { input: 0.000003,    output: 0.000015   },
  'claude-3-haiku-20240307':      { input: 0.00000025,  output: 0.00000125 },
  // Alias cortos (fallback)
  'claude-3-opus':                { input: 0.000015,    output: 0.000075   },
  'claude-3-sonnet':              { input: 0.000003,    output: 0.000015   },
};

/** Precio por defecto si el modelo no está en la tabla */
export const DEFAULT_PRICE = { input: 0.000003, output: 0.000015 };
