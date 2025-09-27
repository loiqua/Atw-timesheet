import { 
  DashboardStats, 
  UserDashboardStats, 
  AdminDashboardStats, 
  ProductivityData, 
  ProjectStats,
  DashboardFilters 
} from '@/types/dashboard';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

class DashboardService {
  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('accessToken');
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getUserDashboardStats(filters: DashboardFilters = { dateRange: 'month' }): Promise<DashboardStats> {
    const params = new URLSearchParams({
      dateRange: filters.dateRange,
      ...(filters.projectId && { projectId: filters.projectId }),
    });

    console.log('Fetching user dashboard stats:', `${API_BASE_URL}/dashboard/stats?${params}`);
    return this.fetchWithAuth(`/dashboard/stats?${params}`);
  }

  async getAdminDashboardStats(filters: DashboardFilters = { dateRange: 'month' }): Promise<AdminDashboardStats> {
    const params = new URLSearchParams({
      dateRange: filters.dateRange,
      ...(filters.userId && { userId: filters.userId }),
      ...(filters.projectId && { projectId: filters.projectId }),
    });

    return this.fetchWithAuth(`/dashboard/admin/stats?${params}`);
  }

  async getProductivityData(filters: DashboardFilters = { dateRange: 'month' }): Promise<ProductivityData[]> {
    const params = new URLSearchParams({
      dateRange: filters.dateRange,
      ...(filters.userId && { userId: filters.userId }),
    });

    return this.fetchWithAuth(`/dashboard/productivity?${params}`);
  }

  async getProjectStats(filters: DashboardFilters = { dateRange: 'month' }): Promise<ProjectStats[]> {
    const params = new URLSearchParams({
      dateRange: filters.dateRange,
      ...(filters.userId && { userId: filters.userId }),
    });

    return this.fetchWithAuth(`/dashboard/projects?${params}`);
  }

  async getUsersList(): Promise<UserDashboardStats[]> {
    return this.fetchWithAuth('/dashboard/admin/users');
  }

  async exportDashboardData(filters: DashboardFilters): Promise<Blob> {
    const params = new URLSearchParams({
      dateRange: filters.dateRange,
      ...(filters.userId && { userId: filters.userId }),
      ...(filters.projectId && { projectId: filters.projectId }),
    });

    const response = await fetch(`${API_BASE_URL}/dashboard/export?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Export Error: ${response.status} ${response.statusText}`);
    }

    return response.blob();
  }
}

export const dashboardService = new DashboardService();
