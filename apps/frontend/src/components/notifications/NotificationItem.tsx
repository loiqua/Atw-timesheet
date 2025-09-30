'use client';

import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  Clock, 
  Bell,
  ExternalLink 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Notification, NotificationType } from '@/types/notifications';

interface NotificationItemProps {
  readonly notification: Notification;
  readonly onMarkAsRead?: (notificationId: string) => void;
  readonly onViewTask?: (taskId: string) => void;
  readonly className?: string;
}

const NOTIFICATION_ICONS: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  TASK_APPROVED: CheckCircle,
  TASK_REJECTED: XCircle,
  TASK_NEEDS_REVISION: RotateCcw,
  DEADLINE_REMINDER: Clock,
  SYSTEM_ANNOUNCEMENT: Bell,
};

const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  TASK_APPROVED: 'text-green-600 bg-green-50',
  TASK_REJECTED: 'text-red-600 bg-red-50',
  TASK_NEEDS_REVISION: 'text-orange-600 bg-orange-50',
  DEADLINE_REMINDER: 'text-blue-600 bg-blue-50',
  SYSTEM_ANNOUNCEMENT: 'text-purple-600 bg-purple-50',
};

const NOTIFICATION_BADGES: Record<NotificationType, { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  TASK_APPROVED: { text: 'Approuvée', variant: 'default' },
  TASK_REJECTED: { text: 'Rejetée', variant: 'destructive' },
  TASK_NEEDS_REVISION: { text: 'Révision', variant: 'secondary' },
  DEADLINE_REMINDER: { text: 'Rappel', variant: 'outline' },
  SYSTEM_ANNOUNCEMENT: { text: 'Annonce', variant: 'outline' },
};

export function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onViewTask,
  className 
}: NotificationItemProps) {
  const Icon = NOTIFICATION_ICONS[notification.type];
  const colorClass = NOTIFICATION_COLORS[notification.type];
  const badge = NOTIFICATION_BADGES[notification.type];
  
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: fr,
  });

  const handleMarkAsRead = () => {
    console.log('🔍 Notification Debug:', {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      isRead: notification.isRead,
      hasCallback: !!onMarkAsRead
    });
    
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  const handleViewTask = () => {
    if (notification.relatedTaskId && onViewTask) {
      onViewTask(notification.relatedTaskId);
      handleMarkAsRead();
    }
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors',
        !notification.isRead && 'bg-blue-50/30 border-blue-100',
        className
      )}
    >
      {/* Icon */}
      <div className={cn('flex-shrink-0 p-2 rounded-full', colorClass)}>
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {notification.title}
            </h4>
            <Badge variant={badge.variant} className="text-xs">
              {badge.text}
            </Badge>
          </div>
          {!notification.isRead && (
            <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full" />
          )}
        </div>

        {/* Message */}
        <p className="text-sm text-gray-600 line-clamp-2">
          {notification.message}
        </p>

        {/* Metadata - Temporarily disabled for debugging */}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">{timeAgo}</span>
          
          <div className="flex items-center gap-2">
            {notification.relatedTaskId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleViewTask}
                className="h-7 px-2 text-xs"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Voir la tâche
              </Button>
            )}
            
            {!notification.isRead && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAsRead}
                className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700"
              >
                Marquer comme lu
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
