"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function Layout({ children }: { readonly children: React.ReactNode }) {
  return (
    <AuthGuard>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthGuard>
  );
}
