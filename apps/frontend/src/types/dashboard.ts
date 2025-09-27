export interface DashboardStats {
  totalHoursThisMonth: number;
  completedTasks: number;
  pendingTasks: number;
  rejectedTasks: number;
  activeProjects: number;
  productivity: number; // percentage
}

export interface UserDashboardStats extends DashboardStats {
  userId: string;
  userName: string;
  userEmail: string;
}

export interface AdminDashboardStats {
  totalStats: DashboardStats;
  userStats: UserDashboardStats[];
  topPerformers: UserDashboardStats[];
}

export interface TimeEntry {
  date: string;
  hours: number;
  tasks: number;
}

export interface ProductivityData {
  week: string;
  productivity: number;
  hoursWorked: number;
  tasksCompleted: number;
}

export interface ProjectStats {
  id: string;
  name: string;
  totalHours: number;
  completedTasks: number;
  pendingTasks: number;
  progress: number; // percentage
}

export interface DashboardFilters {
  dateRange: 'week' | 'month' | 'quarter' | 'year';
  userId?: string; // for admin view
  projectId?: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  date?: string;
  hours?: number;
  tasks?: number;
  productivity?: number;
}
