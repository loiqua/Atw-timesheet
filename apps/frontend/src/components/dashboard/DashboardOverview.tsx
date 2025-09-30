'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  FolderOpen, 
  TrendingUp,
  Download,
  Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { StatsCard } from './StatsCard';
import { ProductivityChart } from './ProductivityChart';
import { ProjectsOverview } from './ProjectsOverview';
import { UserPerformanceTable } from './UserPerformanceTable';
import { dashboardService } from '@/services/dashboard.service';
import { DashboardFilters } from '@/types/dashboard';
import { useAuthStore } from '@/lib/auth-store';

export const DashboardOverview: React.FC = () => {
  const { user } = useAuthStore();
  const [filters, setFilters] = useState<DashboardFilters>({ dateRange: 'month' });
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [exportLoading, setExportLoading] = useState(false);

  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER';
  const canViewAllUsers = isAdmin || isManager;


  // Queries
  const { data: userStats, isLoading: userStatsLoading } = useQuery({
    queryKey: ['dashboard-stats', filters],
    queryFn: () => dashboardService.getUserDashboardStats(filters),
    enabled: !canViewAllUsers || !selectedUser,
  });

  const { data: adminStats, isLoading: adminStatsLoading } = useQuery({
    queryKey: ['admin-dashboard-stats', filters, selectedUser],
    queryFn: () => dashboardService.getAdminDashboardStats({
      ...filters,
      userId: selectedUser || undefined,
    }),
    enabled: canViewAllUsers,
  });

  const { data: productivityData, isLoading: productivityLoading } = useQuery({
    queryKey: ['productivity-data', filters, selectedUser],
    queryFn: () => dashboardService.getProductivityData({
      ...filters,
      userId: selectedUser || undefined,
    }),
  });

  const { data: projectStats, isLoading: projectStatsLoading } = useQuery({
    queryKey: ['project-stats', filters, selectedUser],
    queryFn: () => dashboardService.getProjectStats({
      ...filters,
      userId: selectedUser || undefined,
    }),
  });

  const { data: usersList } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => dashboardService.getUsersList(),
    enabled: canViewAllUsers,
  });

  const getCurrentStats = () => {
    if (canViewAllUsers && adminStats) {
      if (selectedUser) {
        return adminStats.userStats.find(u => u.userId === selectedUser) || adminStats.totalStats;
      }
      return adminStats.totalStats;
    }
    return userStats;
  };
  
  const currentStats = getCurrentStats();

  const handleExport = async () => {
    try {
      setExportLoading(true);
      const blob = await dashboardService.exportDashboardData({
        ...filters,
        userId: selectedUser,
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const isLoading = userStatsLoading || adminStatsLoading;

  return (
    <div className="space-y-4 md:space-y-6 p-3 sm:p-4 md:p-6">
      {/* Header avec filtres */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            Tableau de bord
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">
            Vue d&apos;ensemble des performances et de la productivité de l&apos;équipe
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {/* Ligne 1: Filtres */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Filtre par période */}
            <Select
              value={filters.dateRange}
              onValueChange={(value: 'week' | 'month' | 'quarter' | 'year') =>
                setFilters(prev => ({ ...prev, dateRange: value }))
              }
            >
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
                <SelectItem value="quarter">Ce trimestre</SelectItem>
                <SelectItem value="year">Cette année</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtre par utilisateur (admin seulement) */}
            {canViewAllUsers && (
              <Select
                value={selectedUser || "all"}
                onValueChange={(value: string) => setSelectedUser(value === "all" ? "" : value)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Tous les utilisateurs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les utilisateurs</SelectItem>
                  {usersList?.map((user) => (
                    <SelectItem key={user.userId} value={user.userId}>
                      {user.userName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Ligne 2: Bouton Export (temporairement masqué) */}
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exportLoading}
            className="w-full sm:w-auto sm:self-start hidden"
          >
            <Download className="h-4 w-4 mr-2" />
            {exportLoading ? 'Export...' : 'Exporter'}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        <StatsCard
          title="Total heures ce mois"
          value={currentStats?.totalHoursThisMonth ? `${currentStats.totalHoursThisMonth}h` : '0h'}
          description="depuis le mois dernier"
          icon={Clock}
          loading={isLoading}
          trend={{
            value: 12,
            isPositive: true,
          }}
        />
        <StatsCard
          title="Tâches terminées"
          value={currentStats?.completedTasks ?? 0}
          description="tâches finies"
          icon={CheckCircle}
          loading={isLoading}
          trend={{
            value: 8,
            isPositive: true,
          }}
        />
        <StatsCard
          title="Tâches en attente"
          value={currentStats?.pendingTasks ?? 0}
          description="en attente de finalisation"
          icon={AlertCircle}
          loading={isLoading}
        />
        <StatsCard
          title="Projets actifs"
          value={currentStats?.activeProjects ?? 0}
          description="en cours"
          icon={FolderOpen}
          loading={isLoading}
        />
        <StatsCard
          title="Tâches rejetées"
          value={currentStats?.rejectedTasks ?? 0}
          description="nécessitent une correction"
          icon={AlertCircle}
          loading={isLoading}
          className="border-red-200 bg-red-50"
        />
      </div>

      {/* Charts and Tables */}
      <div className="space-y-4 sm:space-y-6 lg:grid lg:gap-6 lg:grid-cols-2 lg:space-y-0">
        {/* Productivity Chart */}
        <Card>
          <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="flex items-center text-sm sm:text-base lg:text-lg">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Tendances de productivité
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <ProductivityChart 
              data={productivityData ?? []} 
              loading={productivityLoading}
            />
          </CardContent>
        </Card>

        {/* Projects Overview */}
        <Card>
          <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="flex items-center text-sm sm:text-base lg:text-lg">
              <FolderOpen className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Aperçu des projets
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <ProjectsOverview 
              projects={projectStats ?? []} 
              loading={projectStatsLoading}
            />
          </CardContent>
        </Card>
      </div>

      {/* Admin-only: User Performance Table */}
      {canViewAllUsers && adminStats && (
        <Card>
          <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="flex items-center text-sm sm:text-base lg:text-lg">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Performance de l&apos;équipe
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <UserPerformanceTable 
              users={adminStats.userStats} 
              loading={adminStatsLoading}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
