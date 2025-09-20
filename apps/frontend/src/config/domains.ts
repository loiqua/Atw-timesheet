import {
  Info,
  Phone,
  ClipboardList,
  UserCog,
  Briefcase,
  Calculator,
  Presentation,
  type LucideIcon,
} from "lucide-react";
import { Domain } from "@/data/tasks";

export const domainConfig: Record<Domain, { icon: LucideIcon; color: string }> =
  {
    info: {
      icon: Info,
      color: "text-sky-500",
    },
    call: {
      icon: Phone,
      color: "text-green-500",
    },
    enqueteur: {
      icon: ClipboardList,
      color: "text-yellow-500",
    },
    admin: {
      icon: UserCog,
      color: "text-slate-500",
    },
    manager: {
      icon: Briefcase,
      color: "text-red-500",
    },
    compta: {
      icon: Calculator,
      color: "text-indigo-500",
    },
    formateur: {
      icon: Presentation,
      color: "text-pink-500",
    },
  };
