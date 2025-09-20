"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

type LogoutButtonProps = Readonly<{
  className?: string;
}>;

export default function LogoutButton({ className }: LogoutButtonProps) {
  const handleSignOut = async () => {
    try {
      await signOut({
        callbackUrl: "/auth/signin",
        redirect: true,
      });
    } catch (error) {
      console.error("Error signing out:", error);
      // Optionally show error toast/notification to user
    }
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className={cn(
        "flex items-center gap-3 w-full text-left transition-colors",
        className,
      )}
      aria-label="Déconnexion"
    >
      <LogOut className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
      <span>Déconnexion</span>
    </button>
  );
}
