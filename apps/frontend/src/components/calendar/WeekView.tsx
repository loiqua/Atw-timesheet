'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { TimeSlotCard } from './TimeSlotCard';
import { TIME_SLOTS, TASK_STATUS_COLORS } from '@/types/calendar';
import type { CalendarWeek } from '@/types/calendar';

interface WeekViewProps {
  readonly weekData?: CalendarWeek;
  readonly loading?: boolean;
  readonly canManageTasks?: boolean;
}

export const WeekView: React.FC<WeekViewProps> = ({
  weekData,
  loading = false,
  canManageTasks = false,
}) => {
  if (loading) {
    return (
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header skeleton */}
          <div className="grid grid-cols-8 border-b">
            <div className="p-3 border-r">
              <div className="h-4 w-12 bg-muted animate-pulse rounded" />
            </div>
            {Array.from({ length: 7 }, (_, i) => (
              <div key={`header-skeleton-${i}`} className="p-3 border-r last:border-r-0">
                <div className="space-y-1">
                  <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-8 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
          
          {/* Time slots skeleton */}
          {TIME_SLOTS.map((time) => (
            <div key={`time-skeleton-${time}`} className="grid grid-cols-8 border-b last:border-b-0">
              <div className="p-3 border-r bg-gray-50 dark:bg-gray-900/50">
                <div className="h-4 w-12 bg-muted animate-pulse rounded" />
              </div>
              {Array.from({ length: 7 }, (_, dayIndex) => (
                <div key={`slot-skeleton-${time}-${dayIndex}`} className="p-2 border-r last:border-r-0 min-h-[60px]">
                  {Math.random() > 0.7 && (
                    <div className="h-12 bg-muted animate-pulse rounded" />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!weekData) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <div className="text-lg font-medium">Aucune donnée disponible</div>
          <div className="text-sm">Sélectionnez une semaine pour voir les timesheets</div>
        </div>
      </div>
    );
  }

  const getTimeSlotsForDayAndTime = (dayIndex: number, timeSlot: string) => {
    const day = weekData.days[dayIndex];
    if (!day) return [];
    
    return day.timeSlots.filter(slot => {
      // Convertir les heures en minutes pour une comparaison plus précise
      const parseTime = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
      };
      
      const slotStartMinutes = parseTime(slot.startTime);
      const slotEndMinutes = parseTime(slot.endTime);
      const timeSlotMinutes = parseTime(timeSlot);
      const nextHourMinutes = timeSlotMinutes + 60;
      
      // Une tâche apparaît dans un créneau horaire si elle chevauche avec ce créneau
      // Créneau: 10:00-11:00, Tâche: 10:22-10:25 → OUI
      // Créneau: 11:00-12:00, Tâche: 10:22-10:25 → NON
      const taskOverlapsSlot = (
        slotStartMinutes < nextHourMinutes && slotEndMinutes > timeSlotMinutes
      );
      
      // Desktop filtering logs removed for production
      
      return taskOverlapsSlot;
    });
  };

  return (
    <>
      {/* Vue mobile (< 768px) */}
      <div className="block md:hidden">
        <div className="space-y-4">
          {weekData.days.map((day) => (
            <div key={`mobile-day-${day.date}`} className="border rounded-lg overflow-hidden">
              {/* Header du jour */}
              <div className={cn(
                "p-3 border-b bg-gray-50 dark:bg-gray-900/50",
                day.isToday && "bg-primary/10 border-primary/20"
              )}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className={cn(
                      "text-sm font-medium",
                      day.isToday && "text-primary"
                    )}>
                      {day.dayName}
                    </div>
                    <div className={cn(
                      "text-lg font-bold",
                      day.isToday && "text-primary"
                    )}>
                      {day.dayNumber}
                    </div>
                  </div>
                  {day.isToday && (
                    <div className="w-3 h-3 bg-primary rounded-full" />
                  )}
                </div>
              </div>
              
              {/* Créneaux du jour */}
              <div className="p-3 space-y-2">
                {day.timeSlots.length > 0 ? (
                  day.timeSlots.map((slot) => (
                    <div key={`mobile-slot-${slot.id}`} className="border rounded-md p-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {slot.startTime} - {slot.endTime}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            TASK_STATUS_COLORS[slot.status].bg,
                            TASK_STATUS_COLORS[slot.status].border,
                            TASK_STATUS_COLORS[slot.status].text,
                            "text-xs"
                          )}
                        >
                          {(() => {
                            switch (slot.status) {
                              case 'DRAFT': return 'Brouillon';
                              case 'SUBMITTED': return 'Soumis';
                              case 'APPROVED': return 'Approuvé';
                              default: return 'Rejeté';
                            }
                          })()}
                        </Badge>
                      </div>
                      <TimeSlotCard
                        timeSlot={slot}
                        canManage={canManageTasks}
                      />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="text-sm">Aucun créneau</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vue desktop (>= 768px) */}
      <div className="hidden md:block overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header avec les jours */}
          <div className="grid grid-cols-8 border-b bg-gray-50 dark:bg-gray-900/50">
            <div className="p-3 border-r font-medium text-sm text-muted-foreground">
              Heure
            </div>
            {weekData.days.map((day) => (
              <div key={`day-header-${day.date}`} className="p-3 border-r last:border-r-0">
                <div className="text-center">
                  <div className={cn(
                    "text-sm font-medium",
                    day.isToday && "text-primary"
                  )}>
                    {day.dayName}
                  </div>
                  <div className={cn(
                    "text-lg font-bold mt-1",
                    day.isToday && "text-primary"
                  )}>
                    {day.dayNumber}
                  </div>
                  {day.isToday && (
                    <div className="w-2 h-2 bg-primary rounded-full mx-auto mt-1" />
                  )}
                </div>
              </div>
            ))}
          </div>

        {/* Grille des créneaux horaires */}
        {TIME_SLOTS.map((timeSlot) => (
          <div key={`time-row-${timeSlot}`} className="grid grid-cols-8 border-b last:border-b-0">
            {/* Colonne des heures */}
            <div className="p-3 border-r bg-gray-50 dark:bg-gray-900/50 flex items-start">
              <span className="text-sm font-medium text-muted-foreground">
                {timeSlot}
              </span>
            </div>

            {/* Colonnes des jours */}
            {weekData.days.map((day, dayIndex) => {
              const timeSlots = getTimeSlotsForDayAndTime(dayIndex, timeSlot);
              
              return (
                <div 
                  key={`day-slot-${day.date}-${timeSlot}`} 
                  className="border-r last:border-r-0 min-h-[60px] p-1"
                >
                  <div className="space-y-1">
                    {timeSlots.map((slot) => (
                      <TimeSlotCard
                        key={slot.id}
                        timeSlot={slot}
                        canManage={canManageTasks}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        </div>
      </div>
    </>
  );
};
