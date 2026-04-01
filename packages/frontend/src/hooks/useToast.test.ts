/**
 * ============================================================================
 * TESTS: useToast hook
 * ============================================================================
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useToast } from './useToast';

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('expone los métodos success, error, warning e info', () => {
    const toast = useToast();
    expect(typeof toast.success).toBe('function');
    expect(typeof toast.error).toBe('function');
    expect(typeof toast.warning).toBe('function');
    expect(typeof toast.info).toBe('function');
  });

  it('success() no lanza error al llamarse', () => {
    const toast = useToast();
    expect(() => toast.success('Operación exitosa')).not.toThrow();
  });

  it('error() no lanza error al llamarse', () => {
    const toast = useToast();
    expect(() => toast.error('Algo salió mal')).not.toThrow();
  });

  it('warning() no lanza error al llamarse', () => {
    const toast = useToast();
    expect(() => toast.warning('Advertencia')).not.toThrow();
  });

  it('info() no lanza error al llamarse', () => {
    const toast = useToast();
    expect(() => toast.info('Información')).not.toThrow();
  });

  it('acepta duración personalizada sin lanzar error', () => {
    const toast = useToast();
    expect(() => toast.success('Con duración', 5000)).not.toThrow();
  });

  it('puede llamarse múltiples veces seguidas', () => {
    const toast = useToast();
    expect(() => {
      toast.success('Primero');
      toast.error('Segundo');
      toast.info('Tercero');
    }).not.toThrow();
  });
});
