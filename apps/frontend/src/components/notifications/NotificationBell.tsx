'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { NotificationsList } from './NotificationsList';
import { useUnreadCount } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  readonly onViewTask?: (taskId: string) => void;
  readonly className?: string;
}

export function NotificationBell({ onViewTask, className }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const previousCountRef = useRef<number>(0);
  
  const { data: unreadData, isLoading } = useUnreadCount();
  const unreadCount = unreadData?.count ?? 0;

  // Detect new notifications
  useEffect(() => {
    if (!isLoading && unreadCount > previousCountRef.current && previousCountRef.current > 0) {
      setHasNewNotification(true);
      
      // Auto-hide the animation after 3 seconds
      const timer = setTimeout(() => {
        setHasNewNotification(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
    
    if (!isLoading) {
      previousCountRef.current = unreadCount;
    }
  }, [unreadCount, isLoading]);

  // Reset animation when popover opens
  useEffect(() => {
    if (isOpen) {
      setHasNewNotification(false);
    }
  }, [isOpen]);

  const handleViewTask = (taskId: string) => {
    setIsOpen(false);
    if (onViewTask) {
      onViewTask(taskId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'relative p-2 hover:bg-gray-100 transition-colors',
            hasNewNotification && 'animate-pulse',
            className
          )}
          aria-label={
            unreadCount > 0 
              ? `Notifications (${unreadCount} non lues)` 
              : 'Notifications'
          }
        >
          <Bell 
            className={cn(
              'h-5 w-5 transition-colors',
              unreadCount > 0 ? 'text-blue-600' : 'text-gray-600',
              hasNewNotification && 'text-blue-700'
            )} 
          />
          
          {/* Unread count badge */}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className={cn(
                'absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold',
                'min-w-[1.25rem] rounded-full',
                hasNewNotification && 'animate-bounce'
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}

          {/* New notification indicator */}
          {hasNewNotification && (
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping" />
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md sm:max-w-lg p-0 gap-0 rounded-lg shadow-xl">
        <NotificationsList
          onViewTask={handleViewTask}
          onClose={() => setIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
