import Link from 'next/link';
import { Folder } from 'lucide-react';
import { NavLinks } from './NavLinks';
import ClientLogoutButton from './ClientLogoutButton';

const MobileSidebar = () => {
  return (
    <aside aria-label="Menu de navigation mobile" className="flex flex-col bg-blue-800 text-white h-dvh">
      <div className="p-6 border-b border-blue-700/50">
        <Link href="/dashboard" className="flex items-center gap-3" aria-label="Tableau de bord">
          <Folder className="h-8 w-8 text-yellow-400" />
          <div>
            <h1 className="text-xl font-bold">ATW</h1>
            <p className="text-xs text-blue-200">TimeSheet</p>
          </div>
        </Link>
      </div>
      <NavLinks />
      <div className="p-4 mt-auto border-t border-blue-700/50">
        <ClientLogoutButton />
      </div>
    </aside>
  );
};

export default MobileSidebar;
