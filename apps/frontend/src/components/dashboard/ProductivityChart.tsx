'use client';

import React from 'react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { ProductivityData } from '@/types/dashboard';

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    color: string;
    dataKey: string;
    value: number;
  }>;
  label?: string;
}

const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium">{`Semaine: ${label}`}</p>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <p key={`tooltip-${entry.dataKey}-${index}`} style={{ color: entry.color }} className="text-sm">
              {entry.dataKey === 'productivity' && `Productivité: ${entry.value}%`}
              {entry.dataKey === 'hoursWorked' && `Heures: ${entry.value}h`}
              {entry.dataKey === 'tasksCompleted' && `Tâches: ${entry.value}`}
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

interface ProductivityChartProps {
  data: ProductivityData[];
  loading?: boolean;
}

export const ProductivityChart: React.FC<ProductivityChartProps> = ({
  data,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="h-80 w-full flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full">
          <div className="h-4 bg-muted rounded w-1/4" />
          <div className="space-y-2">
            <div className="h-2 bg-muted rounded" />
            <div className="h-2 bg-muted rounded w-5/6" />
            <div className="h-2 bg-muted rounded w-4/6" />
            <div className="h-2 bg-muted rounded w-3/6" />
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-80 w-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <div className="text-lg font-medium">Aucune donnée disponible</div>
          <div className="text-sm">Commencez à suivre votre temps pour voir les tendances de productivité</div>
        </div>
      </div>
    );
  }


  return (
    <div className="h-56 sm:h-72 lg:h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 5,
            left: -10,
            bottom: 5,
          }}
        >
          <defs>
            <linearGradient id="productivityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="week" 
            className="text-xs fill-muted-foreground"
            tick={{ fontSize: 10 }}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            className="text-xs fill-muted-foreground"
            tick={{ fontSize: 10 }}
            width={30}
          />
          <Tooltip content={<CustomTooltip />} />
          
          <Area
            type="monotone"
            dataKey="productivity"
            stroke="hsl(var(--primary))"
            fillOpacity={1}
            fill="url(#productivityGradient)"
            strokeWidth={2}
          />
          
          <Line
            type="monotone"
            dataKey="hoursWorked"
            stroke="hsl(var(--chart-2))"
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--chart-2))', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: 'hsl(var(--chart-2))', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 mt-4 text-xs sm:text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-muted-foreground">Productivité %</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-2))' }} />
          <span className="text-muted-foreground">Heures travaillées</span>
        </div>
      </div>
    </div>
  );
};
