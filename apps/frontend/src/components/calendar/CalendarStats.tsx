'use client';

import React from 'react';
import { Clock, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CalendarStats } from '@/types/calendar';

interface CalendarStatsProps {
  readonly stats: CalendarStats;
}

export const CalendarStats: React.FC<CalendarStatsProps> = ({ stats }) => {
  const statsItems = [
    {
      icon: Clock,
      label: 'Total heures',
      value: `${stats.totalHours}h`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      icon: FileText,
      label: 'Brouillons',
      value: stats.draftTasks,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100 dark:bg-gray-800'
    },
    {
      icon: AlertCircle,
      label: 'Soumis',
      value: stats.submittedTasks,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      icon: CheckCircle,
      label: 'Approuvés',
      value: stats.approvedTasks,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30'
    },
    {
      icon: XCircle,
      label: 'Rejetés',
      value: stats.rejectedTasks,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/30'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      {statsItems.map(({ icon: Icon, label, value, color, bgColor }) => (
        <Card key={label} className="transition-all duration-200 hover:shadow-md">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-full ${bgColor}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <Badge variant="outline" className="text-xs">
                Semaine
              </Badge>
            </div>
            
            <div className="space-y-1">
              <div className="text-xl sm:text-2xl font-bold">
                {value}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                {label}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
