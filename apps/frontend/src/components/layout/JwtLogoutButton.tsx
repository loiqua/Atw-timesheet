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
        "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-200 hover:bg-red-500/20 hover:text-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-800 disabled:opacity-60 text-blue-100 group",
        className,
      )}
      aria-label="Déconnexion"
      disabled={loading}
    >
      <LogOut aria-hidden="true" className="h-5 w-5 group-hover:text-red-300 transition-colors" />
      <span className="font-medium">{loading ? "Déconnexion…" : "Déconnexion"}</span>
    </button>
  );
}
