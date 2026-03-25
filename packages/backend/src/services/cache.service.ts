/**
 * ============================================================================
 * SERVICIO DE CACHÉ
 * ============================================================================
 *
 * Servicio de caching para optimizar performance
 * Almacena resultados de análisis para evitar re-procesamiento
 *
 * Estrategia de caché:
 * 1. Por archivo + hash de commit
 * 2. Por rango de commits (forenses)
 * 3. Por análisis completo (síntesis)
 *
 * TTL configurable por tipo de datos
 *
 * En desarrollo: node-cache (en memoria)
 * En producción: Redis (backend externo)
 */

import NodeCache from 'node-cache';
import { logger } from './logger.service';

/**
 * Tipos de datos cacheables
 */
export enum CacheType {
  MALICIA_FINDING = 'malicia:finding',
  FORENSES_TIMELINE = 'forenses:timeline',
  SINTESIS_REPORT = 'sintesis:report',
  GIT_LOG = 'git:log',
  FILE_CONTENT = 'file:content',
}

/**
 * Configuración de TTL por tipo
 * En segundos
 */
const TTL_CONFIG: Record<CacheType, number> = {
  [CacheType.MALICIA_FINDING]: 30 * 24 * 60 * 60, // 30 días
  [CacheType.FORENSES_TIMELINE]: 30 * 24 * 60 * 60, // 30 días
  [CacheType.SINTESIS_REPORT]: 7 * 24 * 60 * 60, // 7 días
  [CacheType.GIT_LOG]: 24 * 60 * 60, // 1 día
  [CacheType.FILE_CONTENT]: 24 * 60 * 60, // 1 día
};

/**
 * Servicio de Caché
 */
export class CacheService {
  /**
   * Instancia de node-cache para desarrollo
   * En producción, sería reemplazada por Redis
   */
  private cache: NodeCache;

  constructor(stdTTL: number = 300) {
    /**
     * stdTTL: Time To Live estándar (segundos)
     * checkperiod: Intervalo de limpieza automática
     */
    this.cache = new NodeCache({ stdTTL, checkperiod: 60 });
  }

  /**
   * Generar clave de caché
   * Formato: tipo:id:hash
   */
  private generateKey(type: CacheType, id: string, hash?: string): string {
    if (hash) {
      return `${type}:${id}:${hash}`;
    }
    return `${type}:${id}`;
  }

  /**
   * Obtener valor del caché
   */
  get<T>(type: CacheType, id: string, hash?: string): T | null {
    const key = this.generateKey(type, id, hash);
    const value = this.cache.get<T>(key);

    if (value) {
      logger.debug(`Caché HIT: ${key}`);
      return value;
    }

    logger.debug(`Caché MISS: ${key}`);
    return null;
  }

  /**
   * Almacenar valor en caché
   */
  set<T>(type: CacheType, id: string, value: T, hash?: string): void {
    const key = this.generateKey(type, id, hash);
    const ttl = TTL_CONFIG[type];

    this.cache.set(key, value, ttl);
    logger.debug(`Caché SET: ${key} (TTL: ${ttl}s)`);
  }

  /**
   * Eliminar valor del caché
   */
  delete(type: CacheType, id: string, hash?: string): void {
    const key = this.generateKey(type, id, hash);
    this.cache.del(key);
    logger.debug(`Caché DEL: ${key}`);
  }

  /**
   * Limpiar todo el caché de un tipo
   */
  clearByType(type: CacheType): void {
    const keys = this.cache.keys();
    const keysToDelete = keys.filter((key) => key.startsWith(type));
    keysToDelete.forEach((key) => this.cache.del(key));
    logger.info(`Caché limpiado: ${type} (${keysToDelete.length} elementos)`);
  }

  /**
   * Limpiar caché completamente
   */
  flushAll(): void {
    this.cache.flushAll();
    logger.warn('Caché completamente vaciado');
  }

  /**
   * Obtener estadísticas del caché
   */
  getStats() {
    return this.cache.getStats();
  }

  /**
   * Verificar si existe en caché
   */
  has(type: CacheType, id: string, hash?: string): boolean {
    const key = this.generateKey(type, id, hash);
    return this.cache.has(key);
  }
}

// Singleton exportado
export const cacheService = new CacheService();
