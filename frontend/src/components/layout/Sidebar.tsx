import { NavLink } from "react-router-dom";
import clsx from "clsx";
import type { ReactNode } from "react";
import {
  Gauge,
  Car,
  Inbox,
  Building2,
  BarChart3,
  Bot,
  Clapperboard,
  FileText,
  PhoneCall,
  Megaphone,
  Plug,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import type { Role } from "../../types";

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  roles?: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: <Gauge size={18} /> },
  { to: "/leads", label: "Leads", icon: <Car size={18} /> },
  {
    to: "/social-inbox",
    label: "Social Inbox",
    icon: <Inbox size={18} />,
    roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER", "CR_TEAM"],
  },
  { to: "/departments", label: "Departments", icon: <Building2 size={18} />, roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"] },
  { to: "/reports", label: "Reports", icon: <BarChart3 size={18} />, roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"] },
  { to: "/ai-agents", label: "AI Agents", icon: <Bot size={18} />, roles: ["SUPER_ADMIN", "ADMIN"] },
  { to: "/media-library", label: "Media Library", icon: <Clapperboard size={18} />, roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"] },
  { to: "/templates", label: "Templates", icon: <FileText size={18} />, roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"] },
  {
    to: "/call-campaigns",
    label: "Call Campaigns",
    icon: <PhoneCall size={18} />,
    roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER", "CR_TEAM"],
  },
  { to: "/bulk-messages", label: "Bulk Messages", icon: <Megaphone size={18} />, roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"] },
  { to: "/integrations", label: "Integrations", icon: <Plug size={18} />, roles: ["SUPER_ADMIN", "ADMIN"] },
];

export function Sidebar() {
  const { user } = useAuth();

  const items = NAV_ITEMS.filter((item) => !item.roles || (user && item.roles.includes(user.role)));

  return (
    <aside className="flex h-full w-60 flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <img src="/hyundai-logo.jpg" alt="Hyundai" className="h-9 w-auto rounded-md object-contain" />
        <div className="leading-tight">
          <p className="text-base font-bold text-gray-900">Lotus CRM</p>
          <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Hyundai</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-4">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
