"use client";

import { useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"; // Assuming shadcn/ui sheet is set up
import { Menu } from "lucide-react";
import MobileSidebar from "./MobileSidebar";
import { useAuthStore } from "@/lib/auth-store";
import { toInitials, roleLabel } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications";

const Header = () => {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const handleViewTask = (taskId: string) => {
    router.push(`/timesheet?taskId=${taskId}`);
  };

  return (
    <header className="flex items-center justify-between lg:justify-end h-16 px-4 lg:px-8 bg-white border-b">
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Ouvrir le menu de navigation"
              className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="left"
            aria-label="Mobile navigation drawer"
            className="p-0 w-64 bg-blue-800 border-r-0"
          >
            <MobileSidebar />
          </SheetContent>
        </Sheet>
      </div>
      <div className="flex items-center gap-4">
        {/* Notifications Bell */}
        <NotificationBell onViewTask={handleViewTask} />
        
        <div
          className="h-10 w-10 rounded-full bg-blue-600 text-white grid place-items-center font-semibold"
          aria-label="Avatar utilisateur"
        >
          {toInitials(user?.fullName ?? user?.username ?? user?.email ?? "")}
        </div>
        <div className="min-w-0">
          <p className="font-semibold truncate">
            {user?.username ?? user?.email ?? "Utilisateur"}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {[
              user?.role ? roleLabel(user.role) : undefined,
              user?.domain?.name ?? undefined,
            ]
              .filter(Boolean)
              .join(" | ")}
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;
