/**
 * ============================================================================
 * TESTS: FindingsService
 * ============================================================================
 *
 * Pruebas unitarias del servicio de hallazgos
 * Verifica lógica de negocio: transiciones de estado, asignaciones, remediación
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FindingsService } from '../../src/services/findings.service';

// ── Mock de Prisma ────────────────────────────────────────────────────────────
vi.mock('../../src/services/prisma.service', () => ({
  prisma: {
    finding: {
      findMany:   vi.fn(),
      findUnique: vi.fn(),
      count:      vi.fn(),
      update:     vi.fn(),
    },
    findingStatusChange: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    findingAssignment: {
      upsert: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    remediationEntry: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock('../../src/services/logger.service', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

// ── Importar después del mock ────────────────────────────────────────────────
import { prisma } from '../../src/services/prisma.service';

const mockPrisma = prisma as any;

// ── Fixtures ─────────────────────────────────────────────────────────────────
const makeFinding = (overrides = {}) => ({
  id: 'finding-1',
  analysisId: 'analysis-1',
  file: 'src/auth.ts',
  function: 'login',
  lineRange: '45-52',
  severity: 'HIGH',
  riskType: 'INJECTION',
  confidence: 0.85,
  whySuspicious: 'Posible SQL injection en parámetro sin sanitizar',
  remediationSteps: ['Usar prepared statements', 'Validar inputs'],
  createdAt: new Date(),
  updatedAt: new Date(),
  statusHistory: [],
  assignment: null,
  remediation: null,
  forensicEvents: [],
  ...overrides,
});

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('FindingsService', () => {
  let service: FindingsService;

  beforeEach(() => {
    service = new FindingsService();
    vi.clearAllMocks();
  });

  // ── getFindings ─────────────────────────────────────────────────────────────
  describe('getFindings()', () => {
    it('retorna todos los hallazgos sin paginación', async () => {
      const findings = [makeFinding(), makeFinding({ id: 'finding-2' })];
      mockPrisma.finding.findMany.mockResolvedValueOnce(findings);

      const result = await service.getFindings('analysis-1');

      expect(result).toEqual(findings);
      expect(mockPrisma.finding.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { analysisId: 'analysis-1' } })
      );
    });

    it('aplica skip y take cuando se pasa paginación', async () => {
      const findings = [makeFinding()];
      mockPrisma.finding.findMany.mockResolvedValueOnce(findings);
      mockPrisma.finding.count.mockResolvedValueOnce(15);

      const result = await service.getFindings('analysis-1', { page: 2, limit: 5 });

      expect(mockPrisma.finding.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 })
      );
      expect(result).toMatchObject({ data: findings, total: 15, page: 2, limit: 5 });
    });

    it('calcula hasMore correctamente', async () => {
      mockPrisma.finding.findMany.mockResolvedValueOnce([makeFinding(), makeFinding({ id: '2' })]);
      mockPrisma.finding.count.mockResolvedValueOnce(10);

      const result = await service.getFindings('analysis-1', { page: 1, limit: 2 }) as any;

      expect(result.hasMore).toBe(true);
    });

    it('hasMore es false en la última página', async () => {
      mockPrisma.finding.findMany.mockResolvedValueOnce([makeFinding()]);
      mockPrisma.finding.count.mockResolvedValueOnce(5);

      const result = await service.getFindings('analysis-1', { page: 3, limit: 2 }) as any;

      expect(result.hasMore).toBe(false);
    });
  });

  // ── updateFindingStatus ─────────────────────────────────────────────────────
  describe('updateFindingStatus()', () => {
    it('permite transición válida DETECTED → IN_REVIEW', async () => {
      const finding = makeFinding();
      mockPrisma.findingStatusChange.findFirst.mockResolvedValueOnce({ status: 'DETECTED', createdAt: new Date() });
      mockPrisma.findingStatusChange.create.mockResolvedValueOnce({});
      mockPrisma.finding.update.mockResolvedValueOnce({ ...finding, statusHistory: [{ status: 'IN_REVIEW' }] });

      await expect(
        service.updateFindingStatus('finding-1', 'IN_REVIEW', 'user-1', 'Iniciando revisión')
      ).resolves.not.toThrow();
    });

    it('rechaza transición inválida CLOSED → IN_REVIEW', async () => {
      mockPrisma.findingStatusChange.findFirst.mockResolvedValueOnce({ status: 'CLOSED', createdAt: new Date() });

      await expect(
        service.updateFindingStatus('finding-1', 'IN_REVIEW', 'user-1')
      ).rejects.toThrow();
    });

  });

  // ── assignFinding ───────────────────────────────────────────────────────────
  describe('assignFinding()', () => {
    it('crea o actualiza la asignación con upsert', async () => {
      const assignment = { id: 'assign-1', findingId: 'finding-1', assignedTo: 'user-1' };
      mockPrisma.findingAssignment.upsert.mockResolvedValueOnce(assignment);

      const result = await service.assignFinding('finding-1', 'user-1');

      expect(mockPrisma.findingAssignment.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { findingId: 'finding-1' },
          create: expect.objectContaining({ findingId: 'finding-1', assignedTo: 'user-1' }),
          update: expect.objectContaining({ assignedTo: 'user-1' }),
        })
      );
      expect(result).toEqual(assignment);
    });
  });

  // ── unassignFinding ─────────────────────────────────────────────────────────
  describe('unassignFinding()', () => {
    it('elimina la asignación cuando existe', async () => {
      mockPrisma.findingAssignment.findUnique.mockResolvedValueOnce({ id: 'assign-1' });
      mockPrisma.findingAssignment.delete.mockResolvedValueOnce({});

      await service.unassignFinding('finding-1');

      expect(mockPrisma.findingAssignment.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { findingId: 'finding-1' } })
      );
    });

    it('no lanza error cuando no hay asignación', async () => {
      mockPrisma.findingAssignment.findUnique.mockResolvedValueOnce(null);

      await expect(service.unassignFinding('finding-1')).resolves.not.toThrow();
      expect(mockPrisma.findingAssignment.delete).not.toHaveBeenCalled();
    });
  });

  // ── getFindingsStats ────────────────────────────────────────────────────────
  describe('getFindingsStats()', () => {
    it('calcula estadísticas correctamente', async () => {
      const findings = [
        makeFinding({ severity: 'CRITICAL', riskType: 'BACKDOOR' }),
        makeFinding({ id: '2', severity: 'HIGH',     riskType: 'INJECTION' }),
        makeFinding({ id: '3', severity: 'CRITICAL', riskType: 'BACKDOOR' }),
        makeFinding({ id: '4', severity: 'LOW',      riskType: 'HARDCODED_VALUES' }),
      ];
      mockPrisma.finding.findMany.mockResolvedValueOnce(findings);

      const stats = await service.getFindingsStats('analysis-1') as any;

      expect(stats.total).toBe(4);
      expect(stats.bySeverity.CRITICAL).toBe(2);
      expect(stats.bySeverity.HIGH).toBe(1);
      expect(stats.bySeverity.LOW).toBe(1);
    });
  });

  // ── createOrUpdateRemediation ───────────────────────────────────────────────
  describe('createOrUpdateRemediation()', () => {
    it('llama a upsert con los datos correctos', async () => {
      const remediation = { id: 'rem-1', findingId: 'finding-1', status: 'IN_PROGRESS' };
      mockPrisma.remediationEntry.upsert.mockResolvedValueOnce(remediation);

      const result = await service.createOrUpdateRemediation('finding-1', {
        correctionNotes: 'Se corrigió la inyección SQL',
        status: 'IN_PROGRESS' as any,
      });

      expect(mockPrisma.remediationEntry.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { findingId: 'finding-1' },
          create: expect.objectContaining({ findingId: 'finding-1', status: 'IN_PROGRESS' }),
        })
      );
      expect(result).toEqual(remediation);
    });
  });
});
