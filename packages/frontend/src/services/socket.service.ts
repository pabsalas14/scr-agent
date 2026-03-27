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
  connect(serverUrl: string = 'http://localhost:3001'): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`🔌 Attempting to connect to Socket.io at: ${serverUrl}`);

        this.socket = io(serverUrl, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
        });

        let timeoutHandle: NodeJS.Timeout;

        this.socket.on('connect', () => {
          clearTimeout(timeoutHandle);
          console.log('✅ WebSocket connected');
          this.connected = true;

          // Authenticate user if available
          const token = localStorage.getItem('auth_token');
          const user = localStorage.getItem('auth_user');
          if (token && user) {
            try {
              const userData = JSON.parse(user);
              this.authenticateUser(userData.id);
            } catch (e) {
              console.warn('Failed to parse user data:', e);
            }
          }

          resolve();
        });

        this.socket.on('disconnect', () => {
          console.log('❌ WebSocket disconnected');
          this.connected = false;
        });

        this.socket.on('connect_error', (error) => {
          console.error('🔴 Socket connection error:', error);
        });

        this.socket.on('error', (error) => {
          console.error('🔴 Socket error:', error);
        });

        // Set timeout for connection (increased to 10s)
        timeoutHandle = setTimeout(() => {
          if (!this.connected && this.socket) {
            console.warn('⚠️ Socket connection timeout - attempting reconnection');
            // Try to reconnect with fallback transports
            this.socket?.disconnect();
            this.socket?.connect();
          }
        }, 10000);
      } catch (error) {
        console.error('🔴 Socket initialization error:', error);
        reject(error);
      }
    });
  }

  /**
   * Authenticate user on websocket
   */
  private authenticateUser(userId: string): void {
    this.userId = userId;
    if (this.socket) {
      this.socket.emit('auth:user', userId);
      console.log(`🔐 User ${userId} authenticated on WebSocket`);
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
        console.log('📢 Finding status changed:', data);
        callback(data);
      });
    }
  }

  /**
   * Listen for finding assignments
   */
  onFindingAssigned(
    callback: (data: { findingId: string; assignedBy: string; timestamp: Date }) => void
  ): void {
    if (this.socket) {
      this.socket.on('finding:assigned', (data) => {
        console.log('📢 Finding assigned:', data);
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
        console.log('📢 Remediation updated:', data);
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
        console.log('📢 Remediation verified:', data);
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
        console.log('📢 Comment added:', data);
        callback(data);
      });
    }
  }

  /**
   * Disconnect socket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.connected = false;
      console.log('🔌 Socket disconnected');
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
