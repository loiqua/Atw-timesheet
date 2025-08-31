import DashboardLayout from '@/components/layout/DashboardLayout';

interface LayoutProps {
  readonly children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
