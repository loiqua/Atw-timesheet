import { apiClient } from '@/lib/api-client';
import type { Task, TaskStatus, CreateTaskData, UpdateTaskData } from '@/types/timesheet';

interface TaskFilters {
  userId?: string;
  domainId?: string;
  status?: TaskStatus;
  startDate?: string;
  endDate?: string;
}

interface TasksResponse {
  tasks: Task[];
  total: number;
  page: number;
  pageSize: number;
}

interface TaskStatsResponse {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  totalHours: number;
  statusDistribution: Record<TaskStatus, number>;
}

class TimesheetService {
  async getTasks(filters: TaskFilters = {}): Promise<TasksResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value);
      }
    });

    const response = await apiClient.get<TasksResponse>(`/timesheet/tasks?${params}`);
    return response.data;
  }

  async getTask(id: string): Promise<Task> {
    const response = await apiClient.get<Task>(`/timesheet/tasks/${id}`);
    return response.data;
  }

  async createTask(data: CreateTaskData): Promise<Task> {
    const response = await apiClient.post<CreateTaskData, Task>('/timesheet/tasks', data);
    return response.data;
  }

  async updateTask(id: string, data: UpdateTaskData): Promise<Task> {
    const response = await apiClient.patch<UpdateTaskData, Task>(`/timesheet/tasks/${id}`, data);
    return response.data;
  }

  async deleteTask(id: string): Promise<void> {
    await apiClient.delete(`/timesheet/tasks/${id}`);
  }

  async submitTask(id: string): Promise<Task> {
    const response = await apiClient.post<Record<string, never>, Task>(`/timesheet/tasks/${id}/submit`, {});
    return response.data;
  }

  async approveTask(id: string): Promise<Task> {
    const response = await apiClient.post<Record<string, never>, Task>(`/timesheet/tasks/${id}/approve`, {});
    return response.data;
  }

  async rejectTask(id: string, reason?: string): Promise<Task> {
    const response = await apiClient.post<{ reason?: string }, Task>(`/timesheet/tasks/${id}/reject`, { reason });
    return response.data;
  }

  async getTaskStats(filters: TaskFilters = {}): Promise<TaskStatsResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value);
      }
    });

    const response = await apiClient.get<TaskStatsResponse>(`/timesheet/stats?${params}`);
    return response.data;
  }

  async generatePDF(filters: TaskFilters = {}): Promise<Blob> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value);
      }
    });

    const response = await fetch(`/api/timesheet/pdf?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to generate PDF');
    }

    return response.blob();
  }
}

export const timesheetService = new TimesheetService();
