import { io, Socket } from 'socket.io-client';

/**
 * Socket Client Service
 * Manages WebSocket connection to backend for real-time notifications
 */
class SocketClientService {
  private socket: Socket | null = null;
  private connected = false;
  private userId: string | null = null;
  // BUG FIX #16: Track registered listeners to prevent memory leaks
  private listeners = new Map<string, Function>();

  /**
   * Initialize socket connection
   */
  connect(serverUrl: string = import.meta.env['VITE_SOCKET_URL'] || ''): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(serverUrl, {
          transports: ['polling', 'websocket'],
          reconnection: true,
          reconnectionDelay: 500,
          reconnectionDelayMax: 3000,
          reconnectionAttempts: 10,
          path: '/socket.io',
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
   * BUG FIX #1: Update token when JWT is refreshed
   * Called by AuthProvider when token is renewed to prevent silent disconnections
   */
  updateToken(newToken: string): void {
    if (!this.socket || !this.userId) return;

    // Send updated token to backend for re-validation
    this.socket.emit('auth:refresh', { userId: this.userId, token: newToken });
  }

  /**
   * Helper method to register a listener with proper cleanup tracking
   * BUG FIX #16: Prevents memory leaks by removing old listeners before registering new ones
   */
  private registerListener<T>(eventName: string, callback: (data: T) => void): void {
    if (!this.socket) return;

    // Remove previous listener if it exists
    const oldListener = this.listeners.get(eventName);
    if (oldListener) {
      this.socket.off(eventName, oldListener as any);
    }

    // Register new listener and track it
    this.socket.on(eventName, callback);
    this.listeners.set(eventName, callback);
  }

  /**
   * Listen for finding status changes
   */
  onFindingStatusChanged(
    callback: (data: { findingId: string; newStatus: string; timestamp: Date }) => void
  ): void {
    this.registerListener('finding:statusChanged', callback);
  }

  /**
   * Listen for finding assignments
   */
  onFindingAssigned(
    callback: (data: { findingId: string; assignedTo: string; assignedBy: string; timestamp: Date }) => void
  ): void {
    this.registerListener('finding:assigned', callback);
  }

  /**
   * Listen for remediation updates
   */
  onRemediationUpdated(
    callback: (data: { findingId: string; timestamp: Date }) => void
  ): void {
    this.registerListener('remediation:updated', callback);
  }

  /**
   * Listen for remediation verification
   */
  onRemediationVerified(
    callback: (data: { findingId: string; timestamp: Date }) => void
  ): void {
    this.registerListener('remediation:verified', callback);
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
    this.registerListener('comment:added', callback);
  }

  /**
   * Listen for analysis status changes (progress updates)
   */
  onAnalysisStatusChanged(
    callback: (data: { analysisId: string; status: string; progress: number; timestamp: Date }) => void
  ): void {
    this.registerListener('analysis:statusChanged', callback);
  }

  /**
   * Listen for new findings discovered during analysis
   */
  onFindingsDiscovered(
    callback: (data: { analysisId: string; findings: unknown[]; timestamp: Date }) => void
  ): void {
    this.registerListener('analysis:findingsDiscovered', callback);
  }

  /**
   * Listen for analysis completion
   */
  onAnalysisCompleted(
    callback: (data: { analysisId: string; projectId: string; reportId: string; timestamp: Date }) => void
  ): void {
    this.registerListener('analysis:completed', callback);
  }

  /**
   * Listen for analysis errors
   */
  onAnalysisError(
    callback: (data: { analysisId: string; error: string; timestamp: Date }) => void
  ): void {
    this.registerListener('analysis:error', callback);
  }

  /**
   * Disconnect socket and clean up all listeners
   * BUG FIX #16: Ensure all listeners are properly cleaned up
   */
  disconnect(): void {
    // Remove all registered listeners
    for (const [eventName, callback] of this.listeners.entries()) {
      if (this.socket) {
        this.socket.off(eventName, callback as any);
      }
    }
    this.listeners.clear();

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
