/**
 * ============================================================================
 * TESTS: CacheService
 * ============================================================================
 *
 * Pruebas del servicio de caché en memoria
 * Verifica almacenamiento, recuperación, TTL y limpieza
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CacheService, CacheType } from '../../src/services/cache.service';

describe('CacheService', () => {
  let cache: CacheService;

  beforeEach(() => {
    // Instancia fresca por test
    cache = new CacheService(60); // TTL 60s
  });

  it('almacena y recupera un valor', () => {
    const valor = { hallazgos: [], resumen: 'ok' };
    cache.set(CacheType.MALICIA_FINDING, 'test-id', valor, 'abc123');

    const recuperado = cache.get(CacheType.MALICIA_FINDING, 'test-id', 'abc123');
    expect(recuperado).toEqual(valor);
  });

  it('retorna null cuando no existe la clave', () => {
    const resultado = cache.get(CacheType.MALICIA_FINDING, 'no-existe', 'hash');
    expect(resultado).toBeNull();
  });

  it('verifica existencia con has()', () => {
    cache.set(CacheType.GIT_LOG, 'repo-1', ['commit1', 'commit2']);

    expect(cache.has(CacheType.GIT_LOG, 'repo-1')).toBe(true);
    expect(cache.has(CacheType.GIT_LOG, 'repo-no-existe')).toBe(false);
  });

  it('elimina un valor específico', () => {
    cache.set(CacheType.SINTESIS_REPORT, 'analisis-1', { puntuacion: 80 });
    cache.delete(CacheType.SINTESIS_REPORT, 'analisis-1');

    expect(cache.get(CacheType.SINTESIS_REPORT, 'analisis-1')).toBeNull();
  });

  it('limpia todo el caché de un tipo', () => {
    cache.set(CacheType.MALICIA_FINDING, 'id-1', { data: 'a' });
    cache.set(CacheType.MALICIA_FINDING, 'id-2', { data: 'b' });
    cache.set(CacheType.GIT_LOG, 'id-3', { data: 'c' }); // Otro tipo

    cache.clearByType(CacheType.MALICIA_FINDING);

    expect(cache.get(CacheType.MALICIA_FINDING, 'id-1')).toBeNull();
    expect(cache.get(CacheType.MALICIA_FINDING, 'id-2')).toBeNull();
    // El de otro tipo no debe verse afectado
    expect(cache.get(CacheType.GIT_LOG, 'id-3')).not.toBeNull();
  });

  it('flushAll limpia todo el caché', () => {
    cache.set(CacheType.MALICIA_FINDING, 'id-1', { data: 'a' });
    cache.set(CacheType.GIT_LOG, 'id-2', { data: 'b' });

    cache.flushAll();

    expect(cache.get(CacheType.MALICIA_FINDING, 'id-1')).toBeNull();
    expect(cache.get(CacheType.GIT_LOG, 'id-2')).toBeNull();
  });

  it('retorna estadísticas correctas', () => {
    cache.set(CacheType.MALICIA_FINDING, 'test', { data: 'x' });
    cache.get(CacheType.MALICIA_FINDING, 'test'); // HIT
    cache.get(CacheType.MALICIA_FINDING, 'no-existe'); // MISS

    const stats = cache.getStats();
    expect(stats.hits).toBeGreaterThan(0);
    expect(stats.misses).toBeGreaterThan(0);
  });

  it('genera claves únicas para distintos tipos', () => {
    const valor1 = { tipo: 'malicia' };
    const valor2 = { tipo: 'git' };

    // Mismo ID pero diferente tipo
    cache.set(CacheType.MALICIA_FINDING, 'mismo-id', valor1);
    cache.set(CacheType.GIT_LOG, 'mismo-id', valor2);

    expect(cache.get(CacheType.MALICIA_FINDING, 'mismo-id')).toEqual(valor1);
    expect(cache.get(CacheType.GIT_LOG, 'mismo-id')).toEqual(valor2);
  });
});
