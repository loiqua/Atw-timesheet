'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Clock, Folder, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { calendarService } from '@/services/calendar.service';
import { TASK_STATUS_COLORS } from '@/types/calendar';
import type { CalendarTimeSlot } from '@/types/calendar';

interface TimeSlotCardProps {
  readonly timeSlot: CalendarTimeSlot;
  readonly canManage?: boolean;
}

export const TimeSlotCard: React.FC<TimeSlotCardProps> = ({
  timeSlot,
  canManage = false,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const statusColors = TASK_STATUS_COLORS[timeSlot.status];

  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: 'APPROVED' | 'REJECTED' }) =>
      calendarService.updateTaskStatus(taskId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-week'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-stats'] });
    },
  });

  const handleApprove = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateStatusMutation.mutate({ taskId: timeSlot.taskId, status: 'APPROVED' });
  };

  const handleReject = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateStatusMutation.mutate({ taskId: timeSlot.taskId, status: 'REJECTED' });
  };

  const formatDuration = () => {
    const duration = calendarService.calculateDuration(timeSlot.startTime, timeSlot.endTime);
    return `${duration}h`;
  };

  const getStatusLabel = () => {
    switch (timeSlot.status) {
      case 'DRAFT': return 'Brouillon';
      case 'SUBMITTED': return 'Soumis';
      case 'APPROVED': return 'Approuvé';
      case 'REJECTED': return 'Rejeté';
      default: return timeSlot.status;
    }
  };

  return (
    <TooltipProvider>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <div
            className={cn(
              'relative p-2 rounded-md border cursor-pointer transition-all duration-200 hover:shadow-sm',
              statusColors.bg,
              statusColors.border,
              statusColors.text,
              'group'
            )}
          >
            {/* Indicateur de statut */}
            <div className="flex items-center justify-between mb-1">
              <div className={cn('w-2 h-2 rounded-full', statusColors.dot)} />
              <span className="text-xs font-medium">
                {formatDuration()}
              </span>
            </div>

            {/* Informations principales */}
            <div className="space-y-1">
              {/* Utilisateur */}
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold">
                  {timeSlot.userInitials}
                </div>
                <span className="text-xs font-medium truncate flex-1">
                  {timeSlot.userName.split(' ')[0]}
                </span>
              </div>

              {/* Projet */}
              <div className="text-xs truncate">
                {timeSlot.projectName}
              </div>

              {/* Domaine */}
              <div className="flex items-center gap-1">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: timeSlot.domainColor }}
                />
                <span className="text-xs truncate">
                  {timeSlot.domainName}
                </span>
              </div>
            </div>

            {/* Actions pour les managers/admins */}
            {canManage && timeSlot.status === 'SUBMITTED' && (
              <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="default"
                      className="h-5 w-5 p-0 bg-green-600 hover:bg-green-700"
                      onClick={handleApprove}
                      disabled={updateStatusMutation.isPending}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Approuver</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-5 w-5 p-0"
                      onClick={handleReject}
                      disabled={updateStatusMutation.isPending}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Rejeter</TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        </DialogTrigger>

        {/* Dialog avec les détails */}
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Détails du créneau
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDialogOpen(false)}
                className="h-8 w-8 p-0 hover:bg-muted"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Retour</span>
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Statut */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Statut :</span>
              <Badge 
                variant="outline" 
                className={cn(statusColors.bg, statusColors.border, statusColors.text)}
              >
                <div className={cn('w-2 h-2 rounded-full mr-2', statusColors.dot)} />
                {getStatusLabel()}
              </Badge>
            </div>

            {/* Horaires */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Horaires :</span>
              <span className="text-sm">
                {timeSlot.startTime} - {timeSlot.endTime} ({formatDuration()})
              </span>
            </div>

            {/* Utilisateur */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Utilisateur :</span>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                  {timeSlot.userInitials}
                </div>
                <span className="text-sm">{timeSlot.userName}</span>
              </div>
            </div>

            {/* Projet */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Projet :</span>
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{timeSlot.projectName}</span>
              </div>
            </div>

            {/* Domaine */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Domaine :</span>
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: timeSlot.domainColor }}
                />
                <span className="text-sm">{timeSlot.domainName}</span>
              </div>
            </div>

            {/* Description */}
            {timeSlot.description && (
              <div>
                <span className="text-sm font-medium">Description :</span>
                <p className="text-sm text-muted-foreground mt-1">
                  {timeSlot.description}
                </p>
              </div>
            )}

            {/* Actions pour les managers/admins */}
            {canManage && timeSlot.status === 'SUBMITTED' && (
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  className="flex-1"
                  onClick={handleApprove}
                  disabled={updateStatusMutation.isPending}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approuver
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleReject}
                  disabled={updateStatusMutation.isPending}
                >
                  <X className="h-4 w-4 mr-2" />
                  Rejeter
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};
