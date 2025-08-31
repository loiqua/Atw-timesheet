'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navItems } from '@/config/nav';
import { cn } from '@/lib/utils'; // Assuming shadcn/ui `cn` utility is available

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-4 py-2 space-y-2">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors',
              isActive
                ? 'bg-yellow-400 text-blue-900 font-semibold'
                : 'hover:bg-blue-700'
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
