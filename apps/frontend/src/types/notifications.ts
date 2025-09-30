export type NotificationType =
  | 'TASK_APPROVED'
  | 'TASK_REJECTED'
  | 'TASK_NEEDS_REVISION'
  | 'DEADLINE_REMINDER'
  | 'SYSTEM_ANNOUNCEMENT';

export interface Notification {
  readonly id: string;
  readonly userId: string;
  readonly type: NotificationType;
  readonly title: string;
  readonly message: string;
  readonly isRead: boolean;
  readonly relatedTaskId?: string;
  readonly metadata?: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface NotificationResponse {
  readonly notifications: readonly Notification[];
  readonly total: number;
  readonly unreadCount: number;
}

export interface CreateNotificationRequest {
  readonly userId: string;
  readonly type: NotificationType;
  readonly title: string;
  readonly message: string;
  readonly relatedTaskId?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface MarkAsReadRequest {
  readonly notificationIds?: readonly string[];
}
