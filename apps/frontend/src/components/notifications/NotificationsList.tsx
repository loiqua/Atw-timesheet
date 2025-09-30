'use client';

import { useState } from 'react';
import { Bell, BellOff, Check, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NotificationItem } from './NotificationItem';
import { 
  useNotifications, 
  useMarkSingleAsRead, 
  useMarkAllAsRead 
} from '@/hooks/useNotifications';

interface NotificationsListProps {
  readonly onViewTask?: (taskId: string) => void;
  readonly onClose?: () => void;
}

export function NotificationsList({ onViewTask, onClose }: NotificationsListProps) {
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  
  const { 
    data: notificationsData, 
    isLoading, 
    error,
    refetch 
  } = useNotifications({ 
    unreadOnly: showUnreadOnly,
    limit: 50 
  });

  const markSingleAsReadMutation = useMarkSingleAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();

  const handleMarkAsRead = (notificationId: string) => {
    markSingleAsReadMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleViewTask = (taskId: string) => {
    if (onViewTask) {
      onViewTask(taskId);
    }
    if (onClose) {
      onClose();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Chargement des notifications...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 mb-2">
          <Bell className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm font-medium">Erreur de chargement</p>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Impossible de charger les notifications
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="text-xs"
        >
          Réessayer
        </Button>
      </div>
    );
  }

  const notifications = notificationsData?.notifications ?? [];
  const unreadCount = notificationsData?.unreadCount ?? 0;

  if (notifications.length === 0) {
    return (
      <div className="w-full max-w-md">
        {/* Header avec bouton fermer */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Notifications</h3>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
              aria-label="Fermer les notifications"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Contenu vide */}
        <div className="p-6 text-center bg-white">
          <BellOff className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm font-medium text-gray-600 mb-1">
            {showUnreadOnly ? 'Aucune notification non lue' : 'Aucune notification'}
          </p>
          <p className="text-xs text-gray-500">
            {showUnreadOnly 
              ? 'Toutes vos notifications ont été lues' 
              : 'Vous recevrez ici les notifications importantes'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-gray-600" />
          <h3 className="font-medium text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            className={`text-xs ${showUnreadOnly ? 'bg-blue-100 text-blue-700' : ''}`}
          >
            {showUnreadOnly ? 'Toutes' : 'Non lues'}
          </Button>
          
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              {markAllAsReadMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Check className="h-3 w-3 mr-1" />
              )}
              Tout marquer
            </Button>
          )}

          {/* Close button */}
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
              aria-label="Fermer les notifications"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto bg-white">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={handleMarkAsRead}
            onViewTask={handleViewTask}
          />
        ))}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
          <p className="text-xs text-gray-500">
            {notifications.length} notification{notifications.length > 1 ? 's' : ''} affichée{notifications.length > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
