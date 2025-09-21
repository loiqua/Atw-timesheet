"use client";

import * as React from "react";
import { LogOut } from "lucide-react";
import { apiPost } from "@/lib/fetcher";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

type JwtLogoutButtonProps = Readonly<{
  className?: string;
}>;

export default function JwtLogoutButton({ className }: JwtLogoutButtonProps) {
  const userId = useAuthStore((s) => s.user?.id);
  const clear = useAuthStore((s) => s.clear);
  const [loading, setLoading] = React.useState(false);

  const onClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (userId) {
        await apiPost("/auth/logout", { userId });
      }
    } catch {
      // ignorer les erreurs réseau
    } finally {
      clear();
      window.location.href = "/auth/login";
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-4 py-2 text-left transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-800 disabled:opacity-60",
        className,
      )}
      aria-label="Déconnexion"
      disabled={loading}
    >
      <LogOut aria-hidden="true" className="h-5 w-5" />
      <span>{loading ? "Déconnexion…" : "Déconnexion"}</span>
    </button>
  );
}
