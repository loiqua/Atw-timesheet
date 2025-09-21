"use client";
import * as React from 'react';
import { useRequireAuth } from '@/lib/use-require-auth';

export function AuthGuard({ children }: { readonly children: React.ReactNode }) {
  const { user, loading } = useRequireAuth();

  if (loading) {
    return (
      <div className="p-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="mt-6 h-24 bg-muted rounded" />
      </div>
    );
  }

  if (!user) return null;
  return <>{children}</>;
}
