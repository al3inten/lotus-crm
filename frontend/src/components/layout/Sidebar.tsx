import { useState } from "react";
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import type { Role, ModuleKey } from "../../types";

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  module: ModuleKey;
  roles?: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: <Gauge size={18} />, module: "dashboard" },
  { to: "/leads", label: "Leads", icon: <Car size={18} />, module: "leads" },
  {
    to: "/social-inbox",
    label: "Social Inbox",
    icon: <Inbox size={18} />,
    module: "social-inbox",
    roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER", "CR_TEAM"],
  },
  { to: "/departments", label: "Departments", icon: <Building2 size={18} />, module: "departments", roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"] },
  { to: "/reports", label: "Reports", icon: <BarChart3 size={18} />, module: "reports", roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"] },
  { to: "/ai-agents", label: "AI Agents", icon: <Bot size={18} />, module: "ai-agents", roles: ["SUPER_ADMIN", "ADMIN"] },
  { to: "/media-library", label: "Media Library", icon: <Clapperboard size={18} />, module: "media-library", roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"] },
  { to: "/templates", label: "Templates", icon: <FileText size={18} />, module: "templates", roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"] },
  {
    to: "/call-campaigns",
    label: "Call Campaigns",
    icon: <PhoneCall size={18} />,
    module: "call-campaigns",
    roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER", "CR_TEAM"],
  },
  { to: "/bulk-messages", label: "Bulk Messages", icon: <Megaphone size={18} />, module: "bulk-messages", roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"] },
  { to: "/integrations", label: "Integrations", icon: <Plug size={18} />, module: "integrations", roles: ["SUPER_ADMIN", "ADMIN"] },
];

export function Sidebar() {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // A custom role's permission toggles decide what appears; users without a custom role
  // fall back to base-role defaults. SUPER_ADMIN always sees everything.
  const items = NAV_ITEMS.filter((item) => {
    if (!user) return false;
    if (user.role === "SUPER_ADMIN") return true;
    if (user.permissions) return user.permissions.includes(item.module);
    return !item.roles || item.roles.includes(user.role);
  });

  return (
    <aside
      className={clsx(
        "relative flex h-full flex-col border-r border-gray-200 bg-white transition-all duration-300",
        isCollapsed ? "w-20" : "w-60"
      )}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm hover:text-gray-900"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className="flex h-20 items-center justify-center px-4">
        <div className={clsx("flex items-center gap-2.5", isCollapsed && "justify-center")}>
          <img src="/hyundai-logo.jpg" alt="Hyundai" className="h-9 w-auto shrink-0 rounded-md object-contain" />
          {!isCollapsed && (
            <div className="overflow-hidden whitespace-nowrap leading-tight">
              <p className="text-base font-bold text-gray-900">Lotus CRM</p>
              <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Hyundai</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-x-hidden overflow-y-auto px-3 pb-4">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={isCollapsed ? item.label : undefined}
            className={({ isActive }) =>
              clsx(
                "flex items-center rounded-lg px-3 py-2 text-sm transition-colors",
                isCollapsed ? "justify-center" : "gap-3",
                isActive
                  ? "bg-blue-50 font-semibold text-blue-700"
                  : "font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )
            }
          >
            <span className="shrink-0">{item.icon}</span>
            {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
