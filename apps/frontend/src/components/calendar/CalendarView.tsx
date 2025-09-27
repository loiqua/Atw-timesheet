'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Users,
  Filter,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { WeekView } from './WeekView';
import { StatusLegend } from './StatusLegend';
import { CalendarStats } from './CalendarStats';
import { calendarService } from '@/services/calendar.service';
import { useAuthStore } from '@/lib/auth-store';
import type { CalendarFilters, TaskStatus } from '@/types/calendar';

export const CalendarView: React.FC = () => {
  const { user } = useAuthStore();
  const [filters, setFilters] = useState<CalendarFilters>({
    weekStartDate: calendarService.getCurrentWeekStart(),
  });

  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER';
  const canViewAllUsers = isAdmin || isManager;

  // Queries
  const { data: weekData, isLoading: weekLoading } = useQuery({
    queryKey: ['calendar-week', filters],
    queryFn: () => calendarService.getWeekData(filters),
  });

  const { data: users } = useQuery({
    queryKey: ['calendar-users'],
    queryFn: () => calendarService.getUsers(),
    enabled: canViewAllUsers,
  });

  const { data: domains } = useQuery({
    queryKey: ['calendar-domains'],
    queryFn: () => calendarService.getDomains(),
  });

  const { data: stats } = useQuery({
    queryKey: ['calendar-stats', filters],
    queryFn: () => calendarService.getWeekStats(filters),
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

  const handleToday = () => {
    setFilters(prev => ({
      ...prev,
      weekStartDate: calendarService.getCurrentWeekStart()
    }));
  };

  const formatWeekRange = (startDate: string): string => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    
    return `${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  return (
    <div className="space-y-4 md:space-y-6 p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            Calendrier des Timesheets
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">
            Visualisation hebdomadaire des créneaux de travail
          </p>
        </div>

        {/* Navigation et Filtres */}
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Navigation de semaine */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
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

            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              className="text-xs"
            >
              Aujourd&apos;hui
            </Button>
          </div>

          {/* Filtres */}
          <div className="flex flex-col gap-3">
            {/* Ligne 1: Filtre utilisateur (admin seulement) */}
            {canViewAllUsers && (
              <Select
                value={filters.userId ?? "all"}
                onValueChange={(value) => 
                  setFilters(prev => ({ 
                    ...prev, 
                    userId: value === "all" ? undefined : value 
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tous les utilisateurs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Tous les utilisateurs
                    </div>
                  </SelectItem>
                  {users?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                          {user.initials}
                        </div>
                        {user.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Ligne 2: Filtres domaine et statut */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Filtre domaine */}
              <Select
                value={filters.domainId ?? "all"}
                onValueChange={(value) => 
                  setFilters(prev => ({ 
                    ...prev, 
                    domainId: value === "all" ? undefined : value 
                  }))
                }
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Tous les domaines" />
                </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Tous les domaines
                  </div>
                </SelectItem>
                {domains?.map((domain) => (
                  <SelectItem key={domain.id} value={domain.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: domain.color }}
                      />
                      {domain.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtre statut */}
            <Select
              value={filters.status ?? "all"}
              onValueChange={(value) => 
                setFilters(prev => ({ 
                  ...prev, 
                  status: value === "all" ? undefined : value as TaskStatus 
                }))
              }
            >
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="DRAFT">Brouillon</SelectItem>
                <SelectItem value="SUBMITTED">Soumis</SelectItem>
                <SelectItem value="APPROVED">Approuvé</SelectItem>
                <SelectItem value="REJECTED">Rejeté</SelectItem>
              </SelectContent>
            </Select>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Statistiques */}
      {stats && (
        <CalendarStats stats={stats} />
      )}

      {/* Légende des statuts */}
      <StatusLegend />

      {/* Vue du calendrier */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-sm sm:text-base lg:text-lg">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Planning Hebdomadaire
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <WeekView 
            weekData={weekData} 
            loading={weekLoading}
            canManageTasks={canViewAllUsers}
          />
        </CardContent>
      </Card>
    </div>
  );
};
