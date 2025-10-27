export type TaskStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface CalendarTimeSlot {
  readonly id: string;
  readonly taskId: string;
  readonly userId: string;
  readonly userName: string;
  readonly userInitials: string;
  readonly projectId: string;
  readonly projectName: string;
  readonly domainId: string;
  readonly domainName: string;
  readonly domainColor: string;
  readonly startTime: string; // Format: "HH:mm"
  readonly endTime: string;   // Format: "HH:mm"
  readonly date: string;      // Format: "YYYY-MM-DD"
  readonly status: TaskStatus;
  readonly description?: string;
  readonly hoursWorked: number;
}

export interface CalendarDay {
  readonly date: string;
  readonly dayName: string;
  readonly dayNumber: number;
  readonly isToday: boolean;
  readonly timeSlots: readonly CalendarTimeSlot[];
}

export interface CalendarWeek {
  readonly weekNumber: number;
  readonly startDate: string;
  readonly endDate: string;
  readonly days: readonly CalendarDay[];
}

export interface CalendarFilters {
  readonly weekStartDate: string;
  readonly userId?: string;
  readonly domainId?: string;
  readonly status?: TaskStatus;
}

export interface CalendarUser {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly initials: string;
}

export interface CalendarDomain {
  readonly id: string;
  readonly name: string;
  readonly color: string;
}

export interface CalendarStats {
  readonly totalHours: number;
  readonly draftTasks: number;
  readonly submittedTasks: number;
  readonly approvedTasks: number;
  readonly rejectedTasks: number;
}

export const TASK_STATUS_COLORS = {
  DRAFT: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    border: 'border-gray-300 dark:border-gray-600',
    text: 'text-gray-700 dark:text-gray-300',
    dot: 'bg-gray-400'
  },
  SUBMITTED: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    border: 'border-blue-300 dark:border-blue-600',
    text: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500'
  },
  APPROVED: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    border: 'border-green-300 dark:border-green-600',
    text: 'text-green-700 dark:text-green-300',
    dot: 'bg-green-500'
  },
  REJECTED: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    border: 'border-red-300 dark:border-red-600',
    text: 'text-red-700 dark:text-red-300',
    dot: 'bg-red-500'
  }
} as const;

export const TIME_SLOTS = [
  '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
  '21:00', '22:00'
] as const;
