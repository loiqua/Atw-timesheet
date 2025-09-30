import { apiClient } from '@/lib/api-client';
import type { 
  Notification, 
  NotificationResponse, 
  MarkAsReadRequest 
} from '@/types/notifications';

export class NotificationsService {
  private static readonly BASE_PATH = '/notifications';

  /**
   * Get user notifications with pagination
   */
  static async getUserNotifications(options: {
    readonly page?: number;
    readonly limit?: number;
    readonly unreadOnly?: boolean;
  } = {}): Promise<NotificationResponse> {
    const { page = 1, limit = 20, unreadOnly = false } = options;
    
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      unreadOnly: unreadOnly.toString(),
    });

    const response = await apiClient.get<NotificationResponse>(
      `${NotificationsService.BASE_PATH}?${searchParams.toString()}`
    );
    
    return response.data;
  }

  /**
   * Get unread notifications count
   */
  static async getUnreadCount(): Promise<{ readonly count: number }> {
    const response = await apiClient.get<{ count: number }>(
      `${NotificationsService.BASE_PATH}/unread-count`
    );
    
    return response.data;
  }

  /**
   * Mark notifications as read
   */
  static async markAsRead(request: MarkAsReadRequest = {}): Promise<{ readonly updatedCount: number }> {
    const response = await apiClient.patch<MarkAsReadRequest, { updatedCount: number }>(
      `${NotificationsService.BASE_PATH}/mark-as-read`,
      request
    );
    
    return response.data;
  }

  /**
   * Mark a single notification as read
   */
  static async markSingleAsRead(notificationId: string): Promise<Notification> {
    console.log('🔍 NotificationsService.markSingleAsRead called:', {
      notificationId,
      url: `${NotificationsService.BASE_PATH}/${notificationId}/read`,
    });

    try {
      const response = await apiClient.patch<Record<string, never>, Notification>(
        `${NotificationsService.BASE_PATH}/${notificationId}/read`,
        {}
      );
      
      console.log('✅ NotificationsService.markSingleAsRead success:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ NotificationsService.markSingleAsRead error:', error);
      throw error;
    }
  }

  /**
   * Mark all unread notifications as read
   */
  static async markAllAsRead(): Promise<{ readonly updatedCount: number }> {
    return this.markAsRead();
  }
}
