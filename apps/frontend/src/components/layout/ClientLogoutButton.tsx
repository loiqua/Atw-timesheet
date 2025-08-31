'use client';

import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function ClientLogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-left transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-800"
    >
      <LogOut aria-hidden="true" className="h-5 w-5" />
      <span>Déconnexion</span>
    </button>
  );
}
