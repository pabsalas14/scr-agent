import { io, Socket } from 'socket.io-client';

/**
 * Socket Client Service
 * Manages WebSocket connection to backend for real-time notifications
 */
class SocketClientService {
  private socket: Socket | null = null;
  private connected = false;
  private userId: string | null = null;

  /**
   * Initialize socket connection
   */
  connect(serverUrl: string = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(serverUrl, {
          transports: ['polling', 'websocket'],
          reconnection: true,
          reconnectionDelay: 500,
          reconnectionDelayMax: 3000,
          reconnectionAttempts: 10,
          path: '/socket.io/',
        });

        let timeoutHandle: NodeJS.Timeout;

        this.socket.on('connect', () => {
          clearTimeout(timeoutHandle);
          this.connected = true;

          // Authenticate user — send userId + JWT so backend can verify identity
          const token = localStorage.getItem('auth_token');
          const user = localStorage.getItem('auth_user');
          if (token && user) {
            try {
              const userData = JSON.parse(user);
              this.authenticateUser(userData.id, token);
            } catch (_e) {
              // ignore malformed user data
            }
          }

          resolve();
        });

        this.socket.on('disconnect', () => {
          this.connected = false;
        });

        this.socket.on('connect_error', (_error) => {
          // connection errors handled by socket.io reconnection
        });

        // Set timeout for connection (10s)
        timeoutHandle = setTimeout(() => {
          if (!this.connected && this.socket) {
            this.socket?.disconnect();
            this.socket?.connect();
          }
        }, 10000);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Authenticate user on websocket
   */
  private authenticateUser(userId: string, token: string): void {
    this.userId = userId;
    if (this.socket) {
      this.socket.emit('auth:user', { userId, token });
    }
  }

  /**
   * Listen for finding status changes
   */
  onFindingStatusChanged(
    callback: (data: { findingId: string; newStatus: string; timestamp: Date }) => void
  ): void {
    if (this.socket) {
      this.socket.on('finding:statusChanged', (data) => {
        callback(data);
      });
    }
  }

  /**
   * Listen for finding assignments
   */
  onFindingAssigned(
    callback: (data: { findingId: string; assignedTo: string; assignedBy: string; timestamp: Date }) => void
  ): void {
    if (this.socket) {
      this.socket.on('finding:assigned', (data) => {
        callback(data);
      });
    }
  }

  /**
   * Listen for remediation updates
   */
  onRemediationUpdated(
    callback: (data: { findingId: string; timestamp: Date }) => void
  ): void {
    if (this.socket) {
      this.socket.on('remediation:updated', (data) => {
        callback(data);
      });
    }
  }

  /**
   * Listen for remediation verification
   */
  onRemediationVerified(
    callback: (data: { findingId: string; timestamp: Date }) => void
  ): void {
    if (this.socket) {
      this.socket.on('remediation:verified', (data) => {
        callback(data);
      });
    }
  }

  /**
   * Listen for new comments
   */
  onCommentAdded(
    callback: (data: {
      findingId: string;
      commentId: string;
      userId: string;
      userName: string;
      content: string;
      timestamp: Date;
    }) => void
  ): void {
    if (this.socket) {
      this.socket.on('comment:added', (data) => {
        callback(data);
      });
    }
  }

  /**
   * Listen for analysis status changes (progress updates)
   */
  onAnalysisStatusChanged(
    callback: (data: { analysisId: string; status: string; progress: number; timestamp: Date }) => void
  ): void {
    if (this.socket) {
      this.socket.on('analysis:statusChanged', callback);
    }
  }

  /**
   * Listen for new findings discovered during analysis
   */
  onFindingsDiscovered(
    callback: (data: { analysisId: string; findings: unknown[]; timestamp: Date }) => void
  ): void {
    if (this.socket) {
      this.socket.on('analysis:findingsDiscovered', callback);
    }
  }

  /**
   * Listen for analysis completion
   */
  onAnalysisCompleted(
    callback: (data: { analysisId: string; projectId: string; reportId: string; timestamp: Date }) => void
  ): void {
    if (this.socket) {
      this.socket.on('analysis:completed', callback);
    }
  }

  /**
   * Listen for analysis errors
   */
  onAnalysisError(
    callback: (data: { analysisId: string; error: string; timestamp: Date }) => void
  ): void {
    if (this.socket) {
      this.socket.on('analysis:error', callback);
    }
  }

  /**
   * Disconnect socket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.connected = false;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get current user ID
   */
  getUserId(): string | null {
    return this.userId;
  }
}

export const socketClientService = new SocketClientService();
