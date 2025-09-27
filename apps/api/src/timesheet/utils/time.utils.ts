/**
 * Utilitaires pour la gestion des heures et durées
 * Architecture propre pour les calculs temporels
 */

export interface TimeRange {
  startTime: string; // Format "HH:mm"
  endTime: string; // Format "HH:mm"
}

export interface TimeCalculation {
  durationMinutes: number;
  durationFormatted: string; // Ex: "1h 30min"
  timeRange: string; // Ex: "8h15 → 9h45"
}

/**
 * Convertit une heure "HH:mm" en minutes depuis minuit
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  if (
    isNaN(hours) ||
    isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new Error(`Format d'heure invalide: ${time}. Attendu: HH:mm`);
  }
  return hours * 60 + minutes;
}

/**
 * Convertit des minutes en format "HH:mm"
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Calcule la durée entre deux heures
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  if (endMinutes <= startMinutes) {
    throw new Error(
      `L'heure de fin (${endTime}) doit être après l'heure de début (${startTime})`,
    );
  }

  return endMinutes - startMinutes;
}

/**
 * Formate une durée en minutes vers un format lisible
 */
export function formatDuration(minutes: number): string {
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

/**
 * Formate un range d'heures pour l'affichage
 */
export function formatTimeRange(startTime: string, endTime: string): string {
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

/**
 * Calcule toutes les informations temporelles d'une tâche
 */
export function calculateTimeInfo(timeRange: TimeRange): TimeCalculation {
  const { startTime, endTime } = timeRange;

  const durationMinutes = calculateDuration(startTime, endTime);
  const durationFormatted = formatDuration(durationMinutes);
  const timeRangeFormatted = formatTimeRange(startTime, endTime);

  return {
    durationMinutes,
    durationFormatted,
    timeRange: timeRangeFormatted,
  };
}

/**
 * Valide un format d'heure HH:mm
 */
export function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([0-1]?\d|2[0-3]):[0-5]\d$/;
  return timeRegex.test(time);
}

/**
 * Valide une plage horaire
 */
export function isValidTimeRange(startTime: string, endTime: string): boolean {
  if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
    return false;
  }

  try {
    calculateDuration(startTime, endTime);
    return true;
  } catch {
    return false;
  }
}
