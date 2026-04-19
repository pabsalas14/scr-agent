/**
 * Finding Lifecycle Service (PHASE 3)
 * Handles state transitions and auditing for findings
 * States: DETECTED → IN_CORRECTION → CORRECTED → VERIFIED → CLOSED
 */

import { prisma } from './prisma.service';
import { logger } from './logger.service';

export enum FindingStatus {
  DETECTED = 'DETECTED',
  IN_REVIEW = 'IN_REVIEW',
  IN_CORRECTION = 'IN_CORRECTION',
  CORRECTED = 'CORRECTED',
  VERIFIED = 'VERIFIED',
  FALSE_POSITIVE = 'FALSE_POSITIVE',
  CLOSED = 'CLOSED',
}

interface StatusTransition {
  findingId: string;
  newStatus: FindingStatus;
  changedBy: string;
  comment?: string;
}

/**
 * Allowed status transitions
 * Maps current status to allowed next statuses
 */
const ALLOWED_TRANSITIONS: Record<FindingStatus, FindingStatus[]> = {
  [FindingStatus.DETECTED]: [
    FindingStatus.IN_REVIEW,
    FindingStatus.IN_CORRECTION,
    FindingStatus.FALSE_POSITIVE,
  ],
  [FindingStatus.IN_REVIEW]: [
    FindingStatus.IN_CORRECTION,
    FindingStatus.FALSE_POSITIVE,
  ],
  [FindingStatus.IN_CORRECTION]: [
    FindingStatus.CORRECTED,
    FindingStatus.FALSE_POSITIVE,
  ],
  [FindingStatus.CORRECTED]: [
    FindingStatus.VERIFIED,
    FindingStatus.IN_CORRECTION,
    FindingStatus.FALSE_POSITIVE,
  ],
  [FindingStatus.VERIFIED]: [
    FindingStatus.CLOSED,
    FindingStatus.IN_CORRECTION,
  ],
  [FindingStatus.FALSE_POSITIVE]: [
    FindingStatus.DETECTED, // Allow re-opening false positives
  ],
  [FindingStatus.CLOSED]: [
    FindingStatus.IN_CORRECTION, // Allow reopening if needed
  ],
};

/**
 * Get the current status of a finding
 */
export async function getCurrentStatus(
  findingId: string
): Promise<FindingStatus | null> {
  const latest = await prisma.findingStatusChange.findFirst({
    where: { findingId },
    orderBy: { createdAt: 'desc' },
  });

  return (latest?.status as FindingStatus) || null;
}

/**
 * Validate status transition
 */
export function isValidTransition(
  currentStatus: FindingStatus,
  newStatus: FindingStatus
): boolean {
  const allowed = ALLOWED_TRANSITIONS[currentStatus];
  return allowed?.includes(newStatus) ?? false;
}

/**
 * Change finding status with validation and auditing
 */
export async function changeStatus(data: StatusTransition): Promise<void> {
  const { findingId, newStatus, changedBy, comment } = data;

  // Get current status
  const currentStatus = await getCurrentStatus(findingId);
  const current = currentStatus || FindingStatus.DETECTED;

  // Validate transition
  if (!isValidTransition(current, newStatus)) {
    throw new Error(
      `Invalid status transition: ${current} → ${newStatus}. Allowed: ${ALLOWED_TRANSITIONS[current]?.join(', ')}`
    );
  }

  // Start transaction
  const finding = await prisma.finding.findUnique({
    where: { id: findingId },
  });

  if (!finding) {
    throw new Error('Finding not found');
  }

  // Calculate MTTC (Mean Time To Correction) when moving to CORRECTED
  let mttc: number | null = null;
  const updateData: any = { updatedAt: new Date() };

  if (newStatus === FindingStatus.CORRECTED) {
    mttc = Date.now() - finding.createdAt.getTime();
    updateData.correctionTime = new Date();
    updateData.mttc = mttc;
  }

  if (newStatus === FindingStatus.VERIFIED) {
    updateData.verificationTime = new Date();
  }

  if (newStatus === FindingStatus.CLOSED) {
    updateData.closedAt = new Date();
  }

  // Record status change
  await prisma.findingStatusChange.create({
    data: {
      findingId,
      status: newStatus,
      changedBy,
      note: comment,
    },
  });

  // Create audit record
  await prisma.findingAudit.create({
    data: {
      findingId,
      changedBy,
      action: 'STATUS_CHANGE',
      oldValue: current,
      newValue: newStatus,
      comment,
    },
  });

  // Update finding with lifecycle timestamps
  await prisma.finding.update({
    where: { id: findingId },
    data: updateData,
  });

  logger.info(
    `Finding status changed: ${findingId} (${current} → ${newStatus}) by ${changedBy}`
  );
}

/**
 * Get finding lifecycle summary
 */
export async function getLifecycleSummary(
  findingId: string
): Promise<{
  currentStatus: FindingStatus;
  history: Array<{
    status: FindingStatus;
    changedAt: string;
    changedBy: string;
    note?: string;
  }>;
  timestamps: {
    detected: string;
    corrected?: string;
    verified?: string;
    closed?: string;
  };
  mttc?: number; // milliseconds
}> {
  const finding = await prisma.finding.findUnique({
    where: { id: findingId },
    include: {
      statusHistory: {
        orderBy: { createdAt: 'desc' },
        include: {
          changedByUser: {
            select: { name: true, email: true },
          },
        },
      },
    },
  });

  if (!finding) {
    throw new Error('Finding not found');
  }

  const currentStatus =
    finding.statusHistory[0]?.status || FindingStatus.DETECTED;

  return {
    currentStatus: currentStatus as FindingStatus,
    history: finding.statusHistory.map((h) => ({
      status: h.status as FindingStatus,
      changedAt: h.createdAt.toISOString(),
      changedBy: h.changedByUser?.name || h.changedBy,
      note: h.note || undefined,
    })),
    timestamps: {
      detected: finding.createdAt.toISOString(),
      corrected: finding.correctionTime?.toISOString(),
      verified: finding.verificationTime?.toISOString(),
      closed: finding.closedAt?.toISOString(),
    },
    mttc: finding.mttc || undefined,
  };
}

/**
 * Get audit trail for a finding
 */
export async function getAuditTrail(findingId: string) {
  const audits = await prisma.findingAudit.findMany({
    where: { findingId },
    orderBy: { createdAt: 'desc' },
    include: {
      changedByUser: {
        select: { name: true, email: true, avatar: true },
      },
    },
  });

  return audits.map((a) => ({
    id: a.id,
    action: a.action,
    changedBy: a.changedByUser?.name || a.changedBy,
    oldValue: a.oldValue,
    newValue: a.newValue,
    comment: a.comment,
    timestamp: a.createdAt.toISOString(),
  }));
}
