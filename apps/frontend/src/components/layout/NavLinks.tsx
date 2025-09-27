"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/config/nav";
import { cn } from "@/lib/utils"; // Assuming shadcn/ui `cn` utility is available

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="px-4 space-y-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group",
              isActive
                ? "bg-yellow-500 text-black font-semibold shadow-lg transform scale-[1.02]"
                : "hover:bg-white/10 hover:translate-x-1 text-blue-100",
            )}
          >
            <item.icon className={cn(
              "h-5 w-5 transition-colors",
              isActive ? "text-black" : "text-blue-200 group-hover:text-white"
            )} />
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
