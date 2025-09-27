'use client';

import * as React from 'react';
import { DashboardOverview } from '@/components/dashboard';
import { useRequireAuth } from '@/lib/use-require-auth';

const DashboardPage = () => {
  const { loading } = useRequireAuth();

  if (loading) {
    return (
      <div className="p-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={`dashboard-loading-card-${i}`} className="h-32 bg-muted rounded" />
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-80 bg-muted rounded" />
            <div className="h-80 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  return <DashboardOverview />;
};

export default DashboardPage;
