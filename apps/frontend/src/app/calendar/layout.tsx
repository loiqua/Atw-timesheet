"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { AuthGuard } from "@/components/auth/AuthGuard";

interface LayoutProps {
  readonly children: React.ReactNode;
}

export default function CalendarLayout({ children }: LayoutProps) {
  return (
    <AuthGuard>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthGuard>
  );
}
