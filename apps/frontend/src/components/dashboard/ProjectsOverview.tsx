'use client';

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ProjectStats } from '@/types/dashboard';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface ProjectsOverviewProps {
  projects: ProjectStats[];
  loading?: boolean;
}

export const ProjectsOverview: React.FC<ProjectsOverviewProps> = ({
  projects,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={`projects-loading-skeleton-${index}`} className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-6 w-16 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-2 w-full bg-muted animate-pulse rounded" />
            <div className="flex justify-between">
              <div className="h-3 w-20 bg-muted animate-pulse rounded" />
              <div className="h-3 w-20 bg-muted animate-pulse rounded" />
              <div className="h-3 w-20 bg-muted animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <div className="text-lg font-medium">Aucun projet actif</div>
        <div className="text-sm">Commencez à travailler sur des projets pour les voir ici</div>
      </div>
    );
  }


  return (
    <div className="space-y-3 sm:space-y-4 max-h-80 overflow-y-auto">
      {projects.map((project) => (
        <div
          key={project.id}
          className="space-y-3 p-3 sm:p-4 border rounded-lg hover:shadow-sm transition-shadow"
        >
          {/* Project Header */}
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-medium text-sm sm:text-base truncate flex-1">
              {project.name}
            </h4>
            <Badge 
              variant={project.progress >= 50 ? 'default' : 'secondary'}
              className="text-xs px-2 py-1 flex-shrink-0"
            >
              {project.progress}%
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <Progress 
              value={project.progress} 
              className="h-2 sm:h-3"
            />
          </div>

          {/* Project Stats */}
          <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-1 justify-center sm:justify-start">
              <Clock className="h-3 w-3" />
              <span>{project.totalHours}h</span>
            </div>
            
            <div className="flex items-center space-x-1 justify-center sm:justify-start">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span>{project.completedTasks}</span>
            </div>
            
            <div className="flex items-center space-x-1 justify-center sm:justify-start">
              <AlertCircle className="h-3 w-3 text-orange-600" />
              <span>{project.pendingTasks}</span>
            </div>
          </div>

          {/* Additional Info */}
          <div className="text-xs text-muted-foreground text-center sm:text-left">
            Total: {project.completedTasks + project.pendingTasks} tâches
          </div>
        </div>
      ))}
    </div>
  );
};
