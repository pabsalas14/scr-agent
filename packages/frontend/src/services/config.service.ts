/**
 * Servicio de configuración de la aplicación
 * Maneja API key y otras configuraciones almacenadas en localStorage
 */

const API_KEY_STORAGE_KEY = 'coda_api_key';

/**
 * Obtener API key del almacenamiento
 */
export function getApiKey(): string | null {
  try {
    const encoded = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (!encoded) return null;
    // Decodificar desde base64 (simple obfuscación)
    return atob(encoded);
  } catch (error) {
    console.error('Error al obtener API key:', error);
    return null;
  }
}

/**
 * Guardar API key en almacenamiento
 */
export function setApiKey(apiKey: string): void {
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('API key no puede estar vacío');
  }
  try {
    // Codificar a base64 (simple obfuscación)
    const encoded = btoa(apiKey);
    localStorage.setItem(API_KEY_STORAGE_KEY, encoded);
  } catch (error) {
    console.error('Error al guardar API key:', error);
    throw error;
  }
}

/**
 * Limpiar API key del almacenamiento
 */
export function clearApiKey(): void {
  try {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  } catch (error) {
    console.error('Error al limpiar API key:', error);
  }
}

/**
 * Verificar si hay API key guardada
 */
export function hasApiKey(): boolean {
  return getApiKey() !== null;
}

/**
 * Obtener API key enmascarada para mostrar en UI
 */
export function getMaskedApiKey(): string | null {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  // Mostrar solo últimos 8 caracteres
  const visible = apiKey.slice(-8);
  return `••••••••${visible}`;
}
