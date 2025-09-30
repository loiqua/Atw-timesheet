'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NotificationsService } from '@/services/notifications.service';
import type { Notification, NotificationResponse } from '@/types/notifications';

export const NOTIFICATIONS_QUERY_KEY = 'notifications';
export const UNREAD_COUNT_QUERY_KEY = 'notifications-unread-count';

/**
 * Hook for fetching user notifications
 */
export function useNotifications(options: {
  readonly page?: number;
  readonly limit?: number;
  readonly unreadOnly?: boolean;
} = {}) {
  return useQuery({
    queryKey: [NOTIFICATIONS_QUERY_KEY, options],
    queryFn: () => NotificationsService.getUserNotifications(options),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

/**
 * Hook for fetching unread notifications count
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: [UNREAD_COUNT_QUERY_KEY],
    queryFn: () => NotificationsService.getUnreadCount(),
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
}

/**
 * Hook for marking notifications as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: NotificationsService.markAsRead,
    onSuccess: () => {
      // Invalidate and refetch notifications and unread count
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [UNREAD_COUNT_QUERY_KEY] });
    },
  });
}

/**
 * Hook for marking a single notification as read
 */
export function useMarkSingleAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: NotificationsService.markSingleAsRead,
    onSuccess: (updatedNotification: Notification) => {
      
      // Invalidate queries to force refetch
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [UNREAD_COUNT_QUERY_KEY] });
      
      // Also update the cache optimistically
      queryClient.setQueryData<NotificationResponse>(
        [NOTIFICATIONS_QUERY_KEY],
        (oldData) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            notifications: oldData.notifications.map((notification) =>
              notification.id === updatedNotification.id
                ? updatedNotification
                : notification
            ),
            unreadCount: Math.max(0, oldData.unreadCount - 1),
          };
        }
      );

      // Update unread count
      queryClient.setQueryData<{ count: number }>(
        [UNREAD_COUNT_QUERY_KEY],
        (oldData) => {
          if (!oldData) return oldData;
          return { count: Math.max(0, oldData.count - 1) };
        }
      );
    },
  });
}

/**
 * Hook for marking all notifications as read
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: NotificationsService.markAllAsRead,
    onSuccess: () => {
      // Update all notifications to read in cache
      queryClient.setQueryData<NotificationResponse>(
        [NOTIFICATIONS_QUERY_KEY],
        (oldData) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            notifications: oldData.notifications.map((notification) => ({
              ...notification,
              isRead: true,
            })),
            unreadCount: 0,
          };
        }
      );

      // Reset unread count to 0
      queryClient.setQueryData<{ count: number }>(
        [UNREAD_COUNT_QUERY_KEY],
        { count: 0 }
      );
    },
  });
}
