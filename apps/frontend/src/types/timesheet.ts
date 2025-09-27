export type TaskStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface Task {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly date: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly status: TaskStatus;
  readonly userId: string;
  readonly domainId: string;
  readonly projectId?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly user?: User;
  readonly domain?: Domain;
  readonly project?: Project;
}

export interface User {
  readonly id: string;
  readonly fullName: string;
  readonly email: string;
  readonly role: string;
}

export interface Domain {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly description?: string;
}

export interface Project {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly color?: string;
  readonly domainId: string;
  readonly domain?: Domain;
}

export interface CreateTaskData {
  readonly title: string;
  readonly description?: string;
  readonly date: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly domainId: string;
  readonly projectId?: string;
}

export interface UpdateTaskData {
  readonly title?: string;
  readonly description?: string;
  readonly startTime?: string;
  readonly endTime?: string;
  readonly domainId?: string;
  readonly projectId?: string;
}

export interface TaskFilters {
  readonly userId?: string;
  readonly domainId?: string;
  readonly status?: TaskStatus;
  readonly startDate?: string;
  readonly endDate?: string;
}

export interface TaskStats {
  readonly totalTasks: number;
  readonly completedTasks: number;
  readonly pendingTasks: number;
  readonly totalHours: number;
  readonly statusDistribution: Record<TaskStatus, number>;
}

// Constants
export const TASK_STATUS_COLORS = {
  DRAFT: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-800 dark:text-gray-200',
    border: 'border-gray-200 dark:border-gray-700',
    dot: 'bg-gray-500',
  },
  SUBMITTED: {
    bg: 'bg-blue-100 dark:bg-blue-900/20',
    text: 'text-blue-800 dark:text-blue-200',
    border: 'border-blue-200 dark:border-blue-700',
    dot: 'bg-blue-500',
  },
  APPROVED: {
    bg: 'bg-green-100 dark:bg-green-900/20',
    text: 'text-green-800 dark:text-green-200',
    border: 'border-green-200 dark:border-green-700',
    dot: 'bg-green-500',
  },
  REJECTED: {
    bg: 'bg-red-100 dark:bg-red-900/20',
    text: 'text-red-800 dark:text-red-200',
    border: 'border-red-200 dark:border-red-700',
    dot: 'bg-red-500',
  },
} as const;
