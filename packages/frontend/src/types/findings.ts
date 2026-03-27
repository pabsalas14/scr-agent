export type FindingStatus =
  | 'DETECTED'
  | 'IN_REVIEW'
  | 'IN_CORRECTION'
  | 'CORRECTED'
  | 'VERIFIED'
  | 'FALSE_POSITIVE'
  | 'CLOSED';

export type RemediationStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'VERIFIED'
  | 'REJECTED';

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RiskType =
  | 'BACKDOOR'
  | 'INJECTION'
  | 'LOGIC_BOMB'
  | 'OBFUSCATION'
  | 'SUSPICIOUS'
  | 'ERROR_HANDLING'
  | 'HARDCODED_VALUES';

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
}

export interface FindingStatusChange {
  id: string;
  status: FindingStatus;
  changedBy: string;
  changedByUser?: User;
  note?: string;
  createdAt: string;
}

export interface RemediationEntry {
  id: string;
  findingId: string;
  correctionNotes?: string;
  proofOfFixUrl?: string;
  status: RemediationStatus;
  verifiedAt?: string;
  verificationNotes?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FindingAssignment {
  id: string;
  findingId: string;
  assignedTo: string;
  assignedUser?: User;
  assignedAt: string;
  updatedAt: string;
}

export interface Finding {
  id: string;
  analysisId: string;
  file: string;
  function?: string;
  lineRange: string;
  severity: Severity;
  riskType: RiskType;
  confidence: number;
  codeSnippet?: string;
  whySuspicious: string;
  remediationSteps: string[];
  createdAt: string;
  updatedAt: string;
  // Relations
  assignment?: FindingAssignment;
  statusHistory?: FindingStatusChange[];
  remediation?: RemediationEntry;
}

export interface FindingsStats {
  total: number;
  bySeverity: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  byRiskType: Record<string, number>;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'status_change' | 'assignment' | 'remediation' | 'verification';
  title: string;
  message: string;
  severity: 'info' | 'success' | 'warning' | 'error';
  findingId?: string;
  metadata?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

export interface FindingDetailResponse {
  success: boolean;
  data: Finding;
}

export interface FindingsListResponse {
  success: boolean;
  data: Finding[];
}

export interface FindingsStatsResponse {
  success: boolean;
  data: FindingsStats;
}

export interface NotificationsResponse {
  success: boolean;
  data: Notification[];
}

export interface UnreadCountResponse {
  success: boolean;
  data: { unreadCount: number };
}
