"use client";
import * as React from 'react';
import { useAuthStore, type UserProfile } from '@/lib/auth-store';

type Role = UserProfile['role'];

export function RoleGuard({ allowed, children }: { readonly allowed: readonly Role[]; readonly children: React.ReactNode }) {
  const role = useAuthStore((s) => s.user?.role);
  if (!role) return null;
  return allowed.includes(role) ? <>{children}</> : null;
}
