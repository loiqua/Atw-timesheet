import { apiClient } from '@/lib/api-client';
import type {
  CalendarWeek,
  CalendarFilters,
  CalendarUser,
  CalendarDomain,
  CalendarStats,
  CalendarTimeSlot
} from '@/types/calendar';

class CalendarService {
  /**
   * Récupère les données du calendrier pour une semaine donnée
   */
  async getWeekData(filters: CalendarFilters): Promise<CalendarWeek> {
    const params = new URLSearchParams({
      weekStartDate: filters.weekStartDate,
      ...(filters.userId && { userId: filters.userId }),
      ...(filters.domainId && { domainId: filters.domainId }),
      ...(filters.status && { status: filters.status })
    });

    const response = await apiClient.get<CalendarWeek>(`/calendar/week?${params}`);
    return response.data;
  }

  /**
   * Récupère la liste des utilisateurs (pour les admins)
   */
  async getUsers(): Promise<CalendarUser[]> {
    const response = await apiClient.get<CalendarUser[]>('/calendar/users');
    return response.data;
  }

  /**
   * Récupère la liste des domaines
   */
  async getDomains(): Promise<CalendarDomain[]> {
    const response = await apiClient.get<CalendarDomain[]>('/calendar/domains');
    return response.data;
  }

  /**
   * Récupère les statistiques de la semaine
   */
  async getWeekStats(filters: CalendarFilters): Promise<CalendarStats> {
    const params = new URLSearchParams({
      weekStartDate: filters.weekStartDate,
      ...(filters.userId && { userId: filters.userId }),
      ...(filters.domainId && { domainId: filters.domainId })
    });

    const response = await apiClient.get<CalendarStats>(`/calendar/stats?${params}`);
    return response.data;
  }

  /**
   * Met à jour le statut d'une tâche
   */
  async updateTaskStatus(taskId: string, status: 'APPROVED' | 'REJECTED'): Promise<void> {
    await apiClient.patch(`/calendar/tasks/${taskId}/status`, { status });
  }

  /**
   * Récupère les détails d'un créneau horaire
   */
  async getTimeSlotDetails(timeSlotId: string): Promise<CalendarTimeSlot> {
    const response = await apiClient.get<CalendarTimeSlot>(`/calendar/timeslots/${timeSlotId}`);
    return response.data;
  }

  /**
   * Génère les initiales à partir d'un nom
   */
  generateInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  /**
   * Formate une date pour l'affichage
   */
  formatDate(date: string): string {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).format(new Date(date));
  }

  /**
   * Calcule la semaine précédente
   */
  getPreviousWeek(currentWeekStart: string): string {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  }

  /**
   * Calcule la semaine suivante
   */
  getNextWeek(currentWeekStart: string): string {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  }

  /**
   * Obtient le début de la semaine courante
   */
  getCurrentWeekStart(): string {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    
    return monday.toISOString().split('T')[0];
  }

  /**
   * Vérifie si une date est aujourd'hui
   */
  isToday(date: string): boolean {
    const today = new Date().toISOString().split('T')[0];
    return date === today;
  }

  /**
   * Calcule la durée en heures entre deux créneaux horaires
   */
  calculateDuration(startTime: string, endTime: string): number {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    return (endMinutes - startMinutes) / 60;
  }
}

export const calendarService = new CalendarService();
