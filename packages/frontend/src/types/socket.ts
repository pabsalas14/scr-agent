/**
 * ============================================================================
 * SOCKET TYPES - Tipos para eventos de WebSocket
 * ============================================================================
 */

export interface FindingStatusChangeEvent {
  findingId: string;
  newStatus: string;
  timestamp: Date;
}

export interface FindingAssignedEvent {
  findingId: string;
  assignedBy: string;
  timestamp: Date;
}

export interface RemediationUpdatedEvent {
  findingId: string;
  timestamp: Date;
}

export interface RemediationVerifiedEvent {
  findingId: string;
  timestamp: Date;
}

export interface CommentAddedEvent {
  findingId: string;
  commentId: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
}

export type SocketEvent =
  | FindingStatusChangeEvent
  | FindingAssignedEvent
  | RemediationUpdatedEvent
  | RemediationVerifiedEvent
  | CommentAddedEvent;
