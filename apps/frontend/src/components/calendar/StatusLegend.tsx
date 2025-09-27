'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TASK_STATUS_COLORS } from '@/types/calendar';

export const StatusLegend: React.FC = () => {
  const statusItems = [
    {
      status: 'DRAFT' as const,
      label: 'Brouillon',
      description: 'Tâche en cours de rédaction'
    },
    {
      status: 'SUBMITTED' as const,
      label: 'Soumis',
      description: 'En attente de validation'
    },
    {
      status: 'APPROVED' as const,
      label: 'Approuvé',
      description: 'Validé par le manager'
    },
    {
      status: 'REJECTED' as const,
      label: 'Rejeté',
      description: 'Nécessite des corrections'
    }
  ];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            Légende des statuts :
          </span>
          
          <div className="flex flex-wrap gap-3">
            {statusItems.map(({ status, label, description }) => {
              const colors = TASK_STATUS_COLORS[status];
              
              return (
                <div key={status} className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className={cn('w-3 h-3 rounded-full', colors.dot)} />
                    <Badge 
                      variant="outline" 
                      className={cn(
                        'text-xs px-2 py-0.5',
                        colors.bg,
                        colors.border,
                        colors.text
                      )}
                    >
                      {label}
                    </Badge>
                  </div>
                  
                  <span className="text-xs text-muted-foreground hidden lg:inline">
                    {description}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
