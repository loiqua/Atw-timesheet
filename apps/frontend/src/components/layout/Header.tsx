import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"; // Assuming shadcn/ui sheet is set up
import { Menu } from "lucide-react";
import Image from "next/image";
import MobileSidebar from "./MobileSidebar";

const Header = () => {
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
        <div>
          <p className="font-semibold">Arthstorm Name</p>
          <p className="text-xs text-gray-500">info</p>
        </div>
        <Image
          src="https://i.pravatar.cc/40?u=a042581f4e29026704d"
          alt="User avatar"
          width={40}
          height={40}
          className="rounded-full"
        />
      </div>
    </header>
  );
};

export default Header;
