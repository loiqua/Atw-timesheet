import Link from "next/link";
import { Folder } from "lucide-react";
import { NavLinks } from "./NavLinks";
import JwtLogoutButton from "./JwtLogoutButton";

const Sidebar = () => {
  return (
    <aside
      aria-label="Menu de navigation"
      className="hidden lg:flex flex-col w-64 bg-gradient-to-b from-[#1e3a8a] via-[#1e40af] to-[#1d4ed8] text-white h-dvh fixed shadow-2xl"
      style={{
        background: 'linear-gradient(180deg, #2563eb 0%, #1d4ed8 50%, #1e40af 100%)'
      }}
    >
      {/* Header avec logo */}
      <div className="p-6 border-b border-white/20">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 group"
          aria-label="Tableau de bord"
        >
          <div className="p-2 bg-yellow-400 rounded-lg group-hover:bg-yellow-300 transition-colors">
            <Folder className="h-6 w-6 text-[#1d4ed8]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">ATW</h1>
            <p className="text-sm text-blue-100 font-medium">TimeSheet</p>
          </div>
        </Link>
      </div>
      
      {/* Navigation */}
      <div className="flex-1 py-4">
        <NavLinks />
      </div>
      
      {/* Footer avec déconnexion */}
      <div className="p-4 border-t border-white/20 bg-black/10">
        <JwtLogoutButton />
      </div>
    </aside>
  );
};

export default Sidebar;
