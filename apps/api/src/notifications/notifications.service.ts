import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType, Prisma } from '@prisma/client';
import { CreateNotificationDto, NotificationResponseDto } from './dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new notification
   */
  async createNotification(
    dto: CreateNotificationDto,
  ): Promise<NotificationResponseDto> {
    try {
      this.logger.log(
        `Creating notification for user ${dto.userId} of type ${dto.type}`,
      );

      const notification = await this.prisma.notification.create({
        data: {
          userId: dto.userId,
          type: dto.type,
          title: dto.title,
          message: dto.message,
          relatedTaskId: dto.relatedTaskId,
          metadata: dto.metadata
            ? (dto.metadata as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        },
      });

      this.logger.log(
        `Notification created successfully with ID: ${notification.id}`,
      );
      return this.mapToResponseDto(notification);
    } catch (error) {
      this.logger.error(
        `Failed to create notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Get all notifications for a user with pagination
   */
  async getUserNotifications(
    userId: string,
    options: {
      readonly page?: number;
      readonly limit?: number;
      readonly unreadOnly?: boolean;
    } = {},
  ): Promise<{
    readonly notifications: readonly NotificationResponseDto[];
    readonly total: number;
    readonly unreadCount: number;
  }> {
    const { page = 1, limit = 20, unreadOnly = false } = options;
    const skip = (page - 1) * limit;

    const whereClause: Prisma.NotificationWhereInput = {
      userId,
      ...(unreadOnly && { isRead: false }),
    };

    try {
      const [notifications, total, unreadCount] = await Promise.all([
        this.prisma.notification.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            relatedTask: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        }),
        this.prisma.notification.count({ where: { userId } }),
        this.prisma.notification.count({ where: { userId, isRead: false } }),
      ]);

      return {
        notifications: notifications.map((notification) =>
          this.mapToResponseDto(notification),
        ),
        total,
        unreadCount,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get notifications for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Mark notifications as read
   */
  async markAsRead(
    userId: string,
    notificationIds?: readonly string[],
  ): Promise<{ readonly updatedCount: number }> {
    try {
      const whereClause: Prisma.NotificationWhereInput = {
        userId,
        isRead: false,
        ...(notificationIds && { id: { in: [...notificationIds] } }),
      };

      const result = await this.prisma.notification.updateMany({
        where: whereClause,
        data: { isRead: true },
      });

      this.logger.log(
        `Marked ${result.count} notifications as read for user ${userId}`,
      );
      return { updatedCount: result.count };
    } catch (error) {
      this.logger.error(
        `Failed to mark notifications as read: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Mark a single notification as read
   */
  async markSingleAsRead(
    userId: string,
    notificationId: string,
  ): Promise<NotificationResponseDto> {
    try {
      console.log('🔍 NotificationService.markSingleAsRead:', {
        userId,
        notificationId,
      });

      const notification = await this.prisma.notification.findFirst({
        where: { id: notificationId, userId },
      });

      console.log('🔍 Notification found:', notification ? 'YES' : 'NO', {
        notificationExists: !!notification,
        notificationUserId: notification?.userId,
        requestUserId: userId,
        notificationIsRead: notification?.isRead,
      });

      if (!notification) {
        throw new NotFoundException(
          `Notification with ID ${notificationId} not found for user ${userId}`,
        );
      }

      const updatedNotification = await this.prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });

      console.log('🔍 Notification updated successfully:', {
        id: updatedNotification.id,
        isRead: updatedNotification.isRead,
      });

      this.logger.log(`Notification ${notificationId} marked as read`);
      return this.mapToResponseDto(updatedNotification);
    } catch (error) {
      console.error('❌ Error in markSingleAsRead:', error);
      this.logger.error(
        `Failed to mark notification ${notificationId} as read: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Get unread notifications count for a user
   */
  async getUnreadCount(userId: string): Promise<{ readonly count: number }> {
    try {
      const count = await this.prisma.notification.count({
        where: { userId, isRead: false },
      });

      return { count };
    } catch (error) {
      this.logger.error(
        `Failed to get unread count for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Delete old notifications (cleanup job)
   */
  async deleteOldNotifications(
    daysOld = 30,
  ): Promise<{ readonly deletedCount: number }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await this.prisma.notification.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
          isRead: true,
        },
      });

      this.logger.log(`Deleted ${result.count} old notifications`);
      return { deletedCount: result.count };
    } catch (error) {
      this.logger.error(
        `Failed to delete old notifications: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Create task-related notifications with smart content
   */
  async createTaskNotification(
    userId: string,
    type: NotificationType,
    taskId: string,
    taskTitle: string,
    adminNote?: string,
    adminName?: string,
  ): Promise<NotificationResponseDto> {
    const notificationContent = this.generateTaskNotificationContent(
      type,
      taskTitle,
      adminNote,
      adminName,
    );

    return this.createNotification({
      userId,
      type,
      title: notificationContent.title,
      message: notificationContent.message,
      relatedTaskId: taskId,
      metadata: {
        taskTitle,
        adminNote,
        adminName,
      },
    });
  }

  /**
   * Generate smart notification content based on type
   */
  private generateTaskNotificationContent(
    type: NotificationType,
    taskTitle: string,
    adminNote?: string,
    adminName?: string,
  ): { readonly title: string; readonly message: string } {
    const adminInfo = adminName ? ` par ${adminName}` : '';

    switch (type) {
      case NotificationType.TASK_APPROVED:
        return {
          title: '✅ Tâche approuvée',
          message: `Votre tâche "${taskTitle}" a été approuvée${adminInfo}. Elle est maintenant comptabilisée.`,
        };

      case NotificationType.TASK_REJECTED:
        return {
          title: '❌ Tâche rejetée',
          message: adminNote
            ? `Votre tâche "${taskTitle}" a été rejetée${adminInfo}. Raison: ${adminNote}`
            : `Votre tâche "${taskTitle}" a été rejetée${adminInfo}. Merci de créer une nouvelle tâche.`,
        };

      case NotificationType.TASK_NEEDS_REVISION:
        return {
          title: '🔄 Révision demandée',
          message: adminNote
            ? `Votre tâche "${taskTitle}" nécessite des modifications${adminInfo}. ${adminNote}`
            : `Votre tâche "${taskTitle}" nécessite des modifications${adminInfo}. Merci de la corriger et la resoumettre.`,
        };

      default:
        return {
          title: 'Notification',
          message: `Mise à jour concernant votre tâche "${taskTitle}".`,
        };
    }
  }

  /**
   * Map Prisma notification to response DTO
   */
  private mapToResponseDto(notification: {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    relatedTaskId: string | null;
    metadata: Prisma.JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
  }): NotificationResponseDto {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      relatedTaskId: notification.relatedTaskId ?? undefined,
      metadata: (notification.metadata as Record<string, unknown>) ?? undefined,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  }
}
