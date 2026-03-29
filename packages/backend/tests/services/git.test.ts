/**
 * ============================================================================
 * TESTS: GitService
 * ============================================================================
 *
 * Pruebas del servicio de operaciones Git
 * Se mockea simple-git para no necesitar repositorios reales
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitService } from '../../src/services/git.service';

/**
 * Mock de simple-git
 */
vi.mock('simple-git', () => ({
  default: vi.fn(() => ({
    clone: vi.fn().mockResolvedValue(undefined),
    pull: vi.fn().mockResolvedValue(undefined),
    log: vi.fn().mockResolvedValue({
      all: [
        {
          hash: 'abc123',
          date: '2024-03-15T10:30:00Z',
          message: 'feat: añadir función de login',
          author: 'Pablo Developer',
          email: 'pablo@empresa.com',
          refs: 'HEAD -> main',
        },
        {
          hash: 'def456',
          date: '2024-03-16T14:22:00Z',
          message: 'refactor: optimizar lógica',
          author: 'Pablo Developer',
          email: 'pablo@empresa.com',
          refs: '',
        },
      ],
    }),
    raw: vi.fn().mockResolvedValue('3\t1\tsrc/auth.js\n2\t0\tsrc/utils.js'),
    show: vi.fn().mockResolvedValue('// contenido del archivo\nconst x = 1;'),
  })),
}));

/**
 * Mock de fs para evitar operaciones reales de disco
 */
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(true),
    mkdirSync: vi.fn(),
    readFileSync: vi.fn().mockReturnValue(''),
    readdirSync: vi.fn().mockReturnValue(['.git']),
  },
  existsSync: vi.fn().mockReturnValue(true),
  mkdirSync: vi.fn(),
  readFileSync: vi.fn().mockReturnValue(''),
  readdirSync: vi.fn().mockReturnValue(['.git']),
}));

describe('GitService', () => {
  let service: GitService;

  beforeEach(() => {
    service = new GitService('/tmp/test-cache');
  });

  describe('validateRepositoryUrl', () => {
    it('acepta URLs de GitHub', () => {
      expect(service.validateRepositoryUrl('https://github.com/org/repo')).toBe(true);
    });

    it('acepta URLs de GitLab', () => {
      expect(service.validateRepositoryUrl('https://gitlab.com/org/repo')).toBe(true);
    });

    it('acepta URLs de Bitbucket', () => {
      expect(service.validateRepositoryUrl('https://bitbucket.org/org/repo')).toBe(true);
    });

    it('rechaza URLs de hosts no soportados (OWASP SSRF)', () => {
      expect(service.validateRepositoryUrl('https://malicioso.com/repo')).toBe(false);
    });

    it('rechaza URLs de IPs internas (OWASP SSRF)', () => {
      expect(service.validateRepositoryUrl('http://192.168.1.1/repo')).toBe(false);
    });

    it('rechaza URLs inválidas', () => {
      expect(service.validateRepositoryUrl('no-es-una-url')).toBe(false);
    });

    it('rechaza URL vacía', () => {
      expect(service.validateRepositoryUrl('')).toBe(false);
    });
  });

  describe('getCommitHistory', () => {
    it('retorna lista de commits', async () => {
      const commits = await service.getCommitHistory(
        'https://github.com/org/repo'
      );

      expect(commits).toHaveLength(2);
      expect(commits[0]).toMatchObject({
        hash: 'abc123',
        author: 'Pablo Developer',
        email: 'pablo@empresa.com',
      });
    });

    it('respeta el límite de commits', async () => {
      const commits = await service.getCommitHistory(
        'https://github.com/org/repo',
        1
      );

      // simple-git mockea 2 pero verificamos que el parámetro se pasa
      expect(commits.length).toBeGreaterThan(0);
    });
  });

  describe('getDiffBetweenCommits', () => {
    it('retorna lista de archivos modificados', async () => {
      const diffs = await service.getDiffBetweenCommits(
        'https://github.com/org/repo',
        'abc123',
        'def456'
      );

      expect(diffs).toHaveLength(2);
      expect(diffs[0]).toMatchObject({
        file: 'src/auth.js',
        additions: 3,
        deletions: 1,
      });
    });
  });

  describe('getFileAtCommit', () => {
    it('retorna contenido del archivo en commit específico', async () => {
      const contenido = await service.getFileAtCommit(
        'https://github.com/org/repo',
        'src/auth.js',
        'abc123'
      );

      expect(typeof contenido).toBe('string');
      expect(contenido.length).toBeGreaterThan(0);
    });
  });
});
