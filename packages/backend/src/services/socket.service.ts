import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { logger } from './logger.service';

const JWT_SECRET = process.env['JWT_SECRET'] || '';

/**
 * WebSocket Service
 * Manages real-time connections and event broadcasting for notifications
 */
class SocketService {
  private io: SocketIOServer | null = null;
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  /**
   * Initialize Socket.io server with HTTP server
   */
  init(httpServer: HTTPServer, corsOrigins: string[]): SocketIOServer {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: corsOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      maxHttpBufferSize: 10 * 1000 * 1000, // 10MB
      pingInterval: 25000,
      pingTimeout: 60000,
    });

    this.setupConnectionHandlers();
    logger.info('Socket.io server initialized');
    return this.io;
  }

  /**
   * Setup connection and disconnection handlers
   */
  private setupConnectionHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      logger.info(`User connected: ${socket.id}`);

      // Listen for user authentication — validate JWT token to prevent spoofing
      socket.on('auth:user', (payload: { userId: string; token: string } | string) => {
        try {
          // Support both legacy string format and new { userId, token } format
          if (typeof payload === 'string') {
            // Legacy: no token provided — only register if JWT_SECRET is not configured
            if (!JWT_SECRET) {
              this.registerUserSocket(payload, socket.id);
              socket.join(`user:${payload}`);
              logger.warn(`User ${payload} authenticated without JWT verification`);
            } else {
              logger.warn(`Socket auth:user rejected — token required (socketId: ${socket.id})`);
            }
            return;
          }

          const { userId, token } = payload;
          if (!userId || !token) {
            logger.warn(`Socket auth:user rejected — missing fields (socketId: ${socket.id})`);
            return;
          }

          const decoded = jwt.verify(token, JWT_SECRET) as { id?: string; sub?: string };
          const tokenUserId = decoded.id || decoded.sub;

          if (tokenUserId !== userId) {
            logger.warn(`Socket auth:user rejected — userId mismatch (claimed: ${userId}, token: ${tokenUserId})`);
            return;
          }

          this.registerUserSocket(userId, socket.id);
          socket.join(`user:${userId}`);
          logger.info(`User ${userId} authenticated on socket ${socket.id}`);
        } catch (err) {
          logger.warn(`Socket auth:user rejected — invalid token (socketId: ${socket.id}): ${err}`);
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.unregisterUserSocket(socket.id);
        logger.info(`User disconnected: ${socket.id}`);
      });

      // Handle errors
      socket.on('error', (error) => {
        logger.error(`Socket error: ${error}`);
      });
    });
  }

  /**
   * Register a socket to a user
   */
  private registerUserSocket(userId: string, socketId: string): void {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);
  }

  /**
   * Unregister a socket from all users
   */
  private unregisterUserSocket(socketId: string): void {
    this.userSockets.forEach((sockets) => {
      sockets.delete(socketId);
    });
  }

  /**
   * Emit notification to specific user
   */
  notifyUser(
    userId: string,
    event: string,
    data: any
  ): void {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit(event, data);
    logger.info(`Notification sent to user ${userId}: ${event}`);
  }

  /**
   * Emit notification to multiple users
   */
  notifyUsers(
    userIds: string[],
    event: string,
    data: any
  ): void {
    if (!this.io) return;
    userIds.forEach((userId) => this.notifyUser(userId, event, data));
  }

  /**
   * Broadcast to all connected users
   */
  broadcast(event: string, data: any): void {
    if (!this.io) return;
    this.io.emit(event, data);
    logger.info(`Broadcast sent: ${event}`);
  }

  /**
   * Emit when finding status changes
   */
  emitFindingStatusChanged(
    findingId: string,
    newStatus: string,
    assignedUserId?: string
  ): void {
    const event = 'finding:statusChanged';
    const data = { findingId, newStatus, timestamp: new Date() };

    if (assignedUserId) {
      this.notifyUser(assignedUserId, event, data);
    } else {
      this.broadcast(event, data);
    }
  }

  /**
   * Emit when finding is assigned
   */
  emitFindingAssigned(
    findingId: string,
    assignedUserId: string,
    assignedByUser: string
  ): void {
    this.notifyUser(assignedUserId, 'finding:assigned', {
      findingId,
      assignedTo: assignedUserId,
      assignedBy: assignedByUser,
      timestamp: new Date(),
    });
  }

  /**
   * Emit when remediation is updated
   */
  emitRemediationUpdated(
    findingId: string,
    assignedUserId: string
  ): void {
    this.notifyUser(assignedUserId, 'remediation:updated', {
      findingId,
      timestamp: new Date(),
    });
  }

  /**
   * Emit when remediation is verified
   */
  emitRemediationVerified(
    findingId: string,
    assignedUserId: string
  ): void {
    this.notifyUser(assignedUserId, 'remediation:verified', {
      findingId,
      timestamp: new Date(),
    });
  }

  /**
   * Emit when comment is added
   */
  emitCommentAdded(
    findingId: string,
    commentId: string,
    userId: string,
    userName: string,
    content: string,
    mentions: string[] = []
  ): void {
    const event = 'comment:added';
    const data = {
      findingId,
      commentId,
      userId,
      userName,
      content,
      mentions,
      timestamp: new Date(),
    };

    // Notificar a todos los usuarios conectados sobre el nuevo comentario
    // (Las menciones se notificarán con un evento separado)
    if (!this.io) return;
    this.io.emit(event, data);
    logger.info(`Comentario agregado al hallazgo ${findingId}: ${commentId}`);
  }

  /**
   * Emit when user is mentioned in comment
   */
  emitCommentMentioned(commentId: string, mentionedUserId: string): void {
    const event = 'comment:mentioned';
    const data = {
      commentId,
      mentionedUserId,
      timestamp: new Date(),
    };

    this.notifyUser(mentionedUserId, event, data);
    logger.info(`Usuario ${mentionedUserId} mencionado en comentario ${commentId}`);
  }

  /**
   * Emit when comment is updated
   */
  emitCommentUpdated(findingId: string, commentId: string, content: string): void {
    const event = 'comment:updated';
    const data = {
      commentId,
      findingId,
      content,
      timestamp: new Date(),
    };

    if (!this.io) return;
    this.io.emit(event, data);
    logger.info(`Comentario actualizado: ${commentId}`);
  }

  /**
   * Emit when comment is deleted
   */
  emitCommentDeleted(findingId: string, commentId: string): void {
    const event = 'comment:deleted';
    const data = {
      commentId,
      findingId,
      timestamp: new Date(),
    };

    if (!this.io) return;
    this.io.emit(event, data);
    logger.info(`Comentario borrado: ${commentId}`);
  }

  /**
   * Emit when analysis status changes
   */
  emitAnalysisStatusChanged(
    analysisId: string,
    projectId: string,
    newStatus: string,
    progress: number,
    userId?: string
  ): void {
    if (!this.io) return;

    const event = 'analysis:statusChanged';
    const data = {
      analysisId,
      projectId,
      newStatus,
      progress,
      timestamp: new Date(),
    };

    if (userId) {
      this.notifyUser(userId, event, data);
    } else {
      this.broadcast(event, data);
    }
    logger.info(`Analysis ${analysisId} status changed to ${newStatus}`);
  }

  /**
   * Emit when findings are discovered during analysis
   */
  emitAnalysisFindingsDiscovered(
    analysisId: string,
    projectId: string,
    findingCount: number,
    userId: string
  ): void {
    if (!this.io) return;

    const event = 'analysis:findingsDiscovered';
    const data = {
      analysisId,
      projectId,
      findingCount,
      timestamp: new Date(),
    };

    this.notifyUser(userId, event, data);
    logger.info(`Analysis ${analysisId} discovered ${findingCount} findings`);
  }

  /**
   * Emit when analysis is completed
   */
  emitAnalysisCompleted(
    analysisId: string,
    projectId: string,
    summary: any,
    userId: string
  ): void {
    if (!this.io) return;

    const event = 'analysis:completed';
    const data = {
      analysisId,
      projectId,
      summary,
      timestamp: new Date(),
    };

    this.notifyUser(userId, event, data);
    logger.info(`Analysis ${analysisId} completed`);
  }

  /**
   * Emit when analysis encounters an error
   */
  emitAnalysisError(
    analysisId: string,
    projectId: string,
    errorMessage: string,
    userId: string
  ): void {
    if (!this.io) return;

    const event = 'analysis:error';
    const data = {
      analysisId,
      projectId,
      errorMessage,
      timestamp: new Date(),
    };

    this.notifyUser(userId, event, data);
    logger.error(`Analysis ${analysisId} error: ${errorMessage}`);
  }

  /**
   * Get user socket connection status
   */
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId) && (this.userSockets.get(userId)?.size ?? 0) > 0;
  }

  /**
   * Get number of connected sockets for user
   */
  getUserConnectionCount(userId: string): number {
    return this.userSockets.get(userId)?.size ?? 0;
  }

  /**
   * Get total connected users
   */
  getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  /**
   * Get Socket.io server instance
   */
  getIO(): SocketIOServer | null {
    return this.io;
  }
}

export const socketService = new SocketService();
