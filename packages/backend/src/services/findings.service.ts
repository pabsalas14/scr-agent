import { prisma } from './prisma.service';
import { logger } from './logger.service';
import {
  Finding,
  FindingStatus,
  RemediationStatus,
  Severity,
} from '@prisma/client';

/** Transiciones de estado permitidas */
const VALID_TRANSITIONS: Record<FindingStatus, FindingStatus[]> = {
  DETECTED:      ['IN_REVIEW', 'FALSE_POSITIVE'],
  IN_REVIEW:     ['IN_CORRECTION', 'DETECTED', 'FALSE_POSITIVE'],
  IN_CORRECTION: ['CORRECTED', 'IN_REVIEW'],
  CORRECTED:     ['VERIFIED', 'IN_CORRECTION'],
  VERIFIED:      ['CLOSED'],
  FALSE_POSITIVE:['DETECTED'],
  CLOSED:        [],
};

export class FindingsService {
  async getFindings(analysisId: string, pagination?: { page: number; limit: number }) {
    try {
      const queryOptions: any = {
        where: { analysisId },
        include: {
          assignment: true,
          statusHistory: {
            orderBy: { createdAt: 'desc' },
            include: { changedByUser: true },
          },
          remediation: true,
          forensicEvents: true,
        },
      };

      if (pagination) {
        const skip = (pagination.page - 1) * pagination.limit;
        queryOptions.skip = skip;
        queryOptions.take = pagination.limit;
      }

      const [findings, total] = await Promise.all([
        prisma.finding.findMany(queryOptions),
        pagination ? prisma.finding.count({ where: { analysisId } }) : Promise.resolve(0),
      ]);

      if (pagination) {
        const skip = (pagination.page - 1) * pagination.limit;
        return { data: findings, total, page: pagination.page, limit: pagination.limit, hasMore: skip + findings.length < total };
      }
      return findings;
    } catch (error) {
      logger.error('Error fetching findings:', error);
      throw error;
    }
  }

  async getFindingDetail(findingId: string) {
    try {
      return await prisma.finding.findUnique({
        where: { id: findingId },
        include: {
          analysis: true,
          assignment: { include: { assignedUser: true } },
          statusHistory: {
            orderBy: { createdAt: 'desc' },
            include: { changedByUser: true },
          },
          remediation: true,
          forensicEvents: {
            orderBy: { timestamp: 'desc' },
          },
        },
      });
    } catch (error) {
      logger.error('Error fetching finding detail:', error);
      throw error;
    }
  }

  async updateFindingStatus(
    findingId: string,
    newStatus: FindingStatus,
    changedBy: string,
    note?: string
  ) {
    try {
      // Validate transition
      const current = await prisma.findingStatusChange.findFirst({
        where: { findingId },
        orderBy: { createdAt: 'desc' },
      });
      const currentStatus: FindingStatus = current?.status ?? 'DETECTED';
      const allowed = VALID_TRANSITIONS[currentStatus] ?? [];
      if (!allowed.includes(newStatus)) {
        throw new Error(
          `Transición inválida: ${currentStatus} → ${newStatus}. Permitidas: [${allowed.join(', ')}]`
        );
      }

      // Create status change entry
      await prisma.findingStatusChange.create({
        data: {
          findingId,
          status: newStatus,
          changedBy,
          note,
        },
      });

      // Update finding with new status (storing in latest history)
      const updated = await prisma.finding.update({
        where: { id: findingId },
        data: {},
        include: {
          statusHistory: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { changedByUser: true },
          },
          assignment: { include: { assignedUser: true } },
          remediation: true,
        },
      });

      logger.info(`Finding ${findingId} status updated to ${newStatus}`);
      return updated;
    } catch (error) {
      logger.error('Error updating finding status:', error);
      throw error;
    }
  }

  async assignFinding(findingId: string, assignedTo: string) {
    try {
      const assignment = await prisma.findingAssignment.upsert({
        where: { findingId },
        update: { assignedTo },
        create: { findingId, assignedTo },
        include: { assignedUser: true },
      });

      logger.info(`Finding ${findingId} assigned to ${assignedTo}`);
      return assignment;
    } catch (error) {
      logger.error('Error assigning finding:', error);
      throw error;
    }
  }

  async unassignFinding(findingId: string) {
    try {
      await prisma.findingAssignment.delete({
        where: { findingId },
      });

      logger.info(`Finding ${findingId} unassigned`);
      return true;
    } catch (error) {
      logger.error('Error unassigning finding:', error);
      throw error;
    }
  }

  async createOrUpdateRemediation(
    findingId: string,
    data: {
      correctionNotes?: string;
      proofOfFixUrl?: string;
      status?: RemediationStatus;
      verificationNotes?: string;
      verifiedAt?: Date;
    }
  ) {
    try {
      const remediation = await prisma.remediationEntry.upsert({
        where: { findingId },
        update: data,
        create: { findingId, ...data },
      });

      logger.info(`Remediation for finding ${findingId} created/updated`);
      return remediation;
    } catch (error) {
      logger.error('Error creating/updating remediation:', error);
      throw error;
    }
  }

  async getRemediationDetail(findingId: string) {
    try {
      return await prisma.remediationEntry.findUnique({
        where: { findingId },
      });
    } catch (error) {
      logger.error('Error fetching remediation detail:', error);
      throw error;
    }
  }

  async getFindingsStats(analysisId: string) {
    try {
      const findings = await prisma.finding.findMany({
        where: { analysisId },
      });

      const stats = {
        total: findings.length,
        bySeverity: {
          CRITICAL: findings.filter((f) => f.severity === 'CRITICAL').length,
          HIGH: findings.filter((f) => f.severity === 'HIGH').length,
          MEDIUM: findings.filter((f) => f.severity === 'MEDIUM').length,
          LOW: findings.filter((f) => f.severity === 'LOW').length,
        },
        byRiskType: {} as Record<string, number>,
      };

      // Count by risk type
      findings.forEach((f) => {
        stats.byRiskType[f.riskType] = (stats.byRiskType[f.riskType] || 0) + 1;
      });

      return stats;
    } catch (error) {
      logger.error('Error calculating findings stats:', error);
      throw error;
    }
  }

  async getAnalysisFindingsWithAssignments(analysisId: string) {
    try {
      return await prisma.finding.findMany({
        where: { analysisId },
        include: {
          assignment: { include: { assignedUser: true } },
          remediation: true,
          statusHistory: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { changedByUser: true },
          },
        },
        orderBy: { severity: 'desc' },
      });
    } catch (error) {
      logger.error('Error fetching findings with assignments:', error);
      throw error;
    }
  }
}

export const findingsService = new FindingsService();
