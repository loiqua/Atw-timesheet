import {
  Clock,
  Calendar,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "TimeSheet",
    icon: Clock,
  },
  {
    href: "/dashboard/calendar",
    label: "Calendrier",
    icon: Calendar,
  },
  {
    href: "/dashboard/reports",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
];
