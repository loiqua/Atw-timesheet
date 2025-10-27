"use client";

import React, { useState, useEffect } from 'react';
import { Input } from './input';
import { Label } from './label';
import { Badge } from './badge';
import { Clock } from 'lucide-react';

export interface TimeRange {
  startTime: string;
  endTime: string;
}

interface TimeRangeInputProps {
  readonly value?: TimeRange;
  readonly onChange: (timeRange: TimeRange | null) => void;
  readonly disabled?: boolean;
  readonly className?: string;
}

/**
 * Composant de saisie de plage horaire avec calcul automatique de durée
 * Architecture propre avec validation et feedback utilisateur
 */
export function TimeRangeInput({ 
  value, 
  onChange, 
  disabled = false, 
  className = "" 
}: TimeRangeInputProps) {
  const [startTime, setStartTime] = useState(value?.startTime ?? '');
  const [endTime, setEndTime] = useState(value?.endTime ?? '');
  const [duration, setDuration] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Calcul de la durée et validation
  useEffect(() => {
    if (!startTime || !endTime) {
      setDuration(null);
      setError(null);
      onChange(null);
      return;
    }

    try {
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = timeToMinutes(endTime);

      if (endMinutes <= startMinutes) {
        setError("L'heure de fin doit être après l'heure de début");
        setDuration(null);
        onChange(null);
        return;
      }

      const durationMinutes = endMinutes - startMinutes;
      const formattedDuration = formatDuration(durationMinutes);
      const timeRangeDisplay = formatTimeRange(startTime, endTime);

      setDuration(`${formattedDuration} (${timeRangeDisplay})`);
      setError(null);
      onChange({ startTime, endTime });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Format d\'heure invalide');
      setDuration(null);
      onChange(null);
    }
  }, [startTime, endTime, onChange]);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start-time" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Heure de début
          </Label>
          <Input
            id="start-time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            disabled={disabled}
            className="font-mono"
            min="05:00"
            max="21:59"
            step={60}
            placeholder="05:00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end-time" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Heure de fin
          </Label>
          <Input
            id="end-time"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            disabled={disabled}
            className="font-mono"
            min="05:01"
            max="22:00"
            step={60}
            placeholder="22:00"
          />
        </div>
      </div>

      {/* Feedback visuel */}
      <div className="min-h-[24px]">
        {error && (
          <Badge variant="destructive" className="text-xs">
            {error}
          </Badge>
        )}
        {duration && !error && (
          <Badge variant="secondary" className="text-xs font-mono">
            Durée : {duration}
          </Badge>
        )}
      </div>
    </div>
  );
}

// Utilitaires (répliqués du backend pour cohérence)
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`Format d'heure invalide: ${time}`);
  }
  return hours * 60 + minutes;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}min`;
}

function formatTimeRange(startTime: string, endTime: string): string {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const m = parseInt(minutes);
    
    if (m === 0) {
      return `${h}h`;
    }
    return `${h}h${m.toString().padStart(2, '0')}`;
  };
  
  return `${formatTime(startTime)} → ${formatTime(endTime)}`;
}
