'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { calendarService } from '@/services/calendar.service';
import { TASK_STATUS_COLORS } from '@/types/calendar';
import type { CalendarFilters, CalendarTimeSlot } from '@/types/calendar';

interface MobileTimeSlotCardProps {
  readonly timeSlot: CalendarTimeSlot;
}

const MobileTimeSlotCard: React.FC<MobileTimeSlotCardProps> = ({ timeSlot }) => {
  const statusColors = TASK_STATUS_COLORS[timeSlot.status];

  return (
    <Card className={`mb-3 ${statusColors.bg} ${statusColors.border}`}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {timeSlot.userInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-sm">{timeSlot.userName}</div>
              <div className="text-xs text-muted-foreground">{timeSlot.projectName}</div>
            </div>
          </div>
          <Badge variant="outline" className={`${statusColors.text} text-xs`}>
            {timeSlot.status}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{timeSlot.startTime} - {timeSlot.endTime}</span>
          </div>
          <div className="flex items-center gap-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: timeSlot.domainColor }}
            />
            <span>{timeSlot.domainName}</span>
          </div>
        </div>

        {timeSlot.description && (
          <div className="mt-2 text-xs text-muted-foreground">
            {timeSlot.description}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const MobileCalendarView: React.FC = () => {
  const [filters, setFilters] = useState<CalendarFilters>({
    weekStartDate: calendarService.getCurrentWeekStart(),
  });

  const { data: weekData, isLoading } = useQuery({
    queryKey: ['calendar-week-mobile', filters],
    queryFn: () => calendarService.getWeekData(filters),
  });

  const handlePreviousWeek = () => {
    setFilters(prev => ({
      ...prev,
      weekStartDate: calendarService.getPreviousWeek(prev.weekStartDate)
    }));
  };

  const handleNextWeek = () => {
    setFilters(prev => ({
      ...prev,
      weekStartDate: calendarService.getNextWeek(prev.weekStartDate)
    }));
  };

  const formatWeekRange = (startDate: string): string => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    
    return `${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        {Array.from({ length: 5 }, (_, i) => (
          <Card key={`mobile-loading-${i}`} className="mb-3">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
                <div className="space-y-1 flex-1">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="h-3 bg-muted animate-pulse rounded" />
                <div className="h-3 bg-muted animate-pulse rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviousWeek}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-md">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {formatWeekRange(filters.weekStartDate)}
          </span>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextWeek}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Jours de la semaine */}
      {weekData?.days.map((day) => (
        <div key={day.date}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`text-lg font-bold ${day.isToday ? 'text-primary' : ''}`}>
              {day.dayNumber}
            </div>
            <div className={`text-sm font-medium ${day.isToday ? 'text-primary' : ''}`}>
              {day.dayName}
            </div>
            {day.isToday && (
              <div className="w-2 h-2 bg-primary rounded-full" />
            )}
          </div>

          {day.timeSlots.length > 0 ? (
            <div className="space-y-2 ml-4">
              {day.timeSlots.map((timeSlot) => (
                <MobileTimeSlotCard key={timeSlot.id} timeSlot={timeSlot} />
              ))}
            </div>
          ) : (
            <div className="ml-4 text-sm text-muted-foreground py-4">
              Aucun créneau planifié
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
