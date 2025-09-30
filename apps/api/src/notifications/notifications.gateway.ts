import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NotificationResponseDto } from './dto';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private readonly connectedUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds
  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract JWT token from handshake auth
      const authToken: unknown = client.handshake.auth?.token;
      const headerToken: unknown = client.handshake.headers?.authorization;
      const token =
        (typeof authToken === 'string' ? authToken : null) ??
        (typeof headerToken === 'string'
          ? headerToken.replace('Bearer ', '')
          : null);

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload: unknown = await this.jwtService.verifyAsync(token);
      const userId =
        typeof payload === 'object' && payload !== null && 'sub' in payload
          ? (payload as { sub: string }).sub
          : null;

      if (!userId) {
        this.logger.warn(`Client ${client.id} connected with invalid token`);
        client.disconnect();
        return;
      }

      // Associate socket with user
      client.userId = userId;

      // Track user connections
      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, new Set());
      }
      this.connectedUsers.get(userId)!.add(client.id);

      // Join user-specific room
      await client.join(`user:${userId}`);

      this.logger.log(`User ${userId} connected with socket ${client.id}`);

      // Send connection confirmation
      client.emit('connected', {
        message: 'Successfully connected to notifications',
      });
    } catch (error) {
      this.logger.error(
        `Failed to authenticate client ${client.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const userSockets = this.connectedUsers.get(client.userId);
      if (userSockets) {
        userSockets.delete(client.id);
        if (userSockets.size === 0) {
          this.connectedUsers.delete(client.userId);
        }
      }
      this.logger.log(`User ${client.userId} disconnected socket ${client.id}`);
    } else {
      this.logger.log(`Anonymous client ${client.id} disconnected`);
    }
  }

  @SubscribeMessage('join-notifications')
  async handleJoinNotifications(
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (client.userId) {
      await client.join(`user:${client.userId}`);
      client.emit('joined-notifications', {
        message: 'Joined notifications room',
      });
      this.logger.log(`User ${client.userId} joined notifications room`);
    }
  }

  @SubscribeMessage('mark-notification-read')
  handleMarkAsRead(
    @MessageBody() data: { notificationId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (client.userId) {
      // Broadcast to all user's connected devices
      this.server.to(`user:${client.userId}`).emit('notification-marked-read', {
        notificationId: data.notificationId,
      });
      this.logger.log(
        `Notification ${data.notificationId} marked as read for user ${client.userId}`,
      );
    }
  }

  /**
   * Send notification to a specific user
   */
  sendNotificationToUser(
    userId: string,
    notification: NotificationResponseDto,
  ) {
    try {
      const userSockets = this.connectedUsers.get(userId);

      if (userSockets && userSockets.size > 0) {
        // Send to user's room (all connected devices)
        this.server.to(`user:${userId}`).emit('new-notification', notification);
        this.logger.log(
          `Notification sent to user ${userId} on ${userSockets.size} device(s)`,
        );
        return true;
      } else {
        this.logger.log(
          `User ${userId} is not connected, notification will be stored for later`,
        );
        return false;
      }
    } catch (error) {
      this.logger.error(
        `Failed to send notification to user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return false;
    }
  }

  /**
   * Send unread count update to user
   */
  sendUnreadCountUpdate(userId: string, count: number) {
    try {
      const userSockets = this.connectedUsers.get(userId);

      if (userSockets && userSockets.size > 0) {
        this.server
          .to(`user:${userId}`)
          .emit('unread-count-updated', { count });
        this.logger.log(`Unread count (${count}) sent to user ${userId}`);
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(
        `Failed to send unread count to user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return false;
    }
  }

  /**
   * Get connected users count (for monitoring)
   */
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Get total connections count (for monitoring)
   */
  getTotalConnectionsCount(): number {
    let total = 0;
    for (const sockets of this.connectedUsers.values()) {
      total += sockets.size;
    }
    return total;
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId: string): boolean {
    const userSockets = this.connectedUsers.get(userId);
    return userSockets ? userSockets.size > 0 : false;
  }
}
