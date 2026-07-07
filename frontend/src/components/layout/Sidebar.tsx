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

interface SidebarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (val: boolean) => void;
}

export function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen }: SidebarProps) {
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
    <>
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-slate-200 bg-white transition-all duration-300 md:relative md:z-0 dark:border-slate-800 dark:bg-slate-900",
          isCollapsed ? "w-20" : "w-64",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-6 z-20 hidden h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition-colors hover:text-slate-900 md:flex dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500 dark:hover:text-white"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className="flex h-16 items-center justify-center px-4 shrink-0">
          <div className={clsx("flex items-center gap-3", isCollapsed && "justify-center")}>
            <img src="/hyundai-logo.jpg" alt="Hyundai" className="h-8 w-8 shrink-0 rounded-lg object-contain shadow-sm bg-white" />
            {!isCollapsed && (
              <div className="overflow-hidden whitespace-nowrap leading-tight">
                <p className="text-base font-bold tracking-tight text-slate-900 dark:text-white">Lotus CRM</p>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Hyundai</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1.5 overflow-x-hidden overflow-y-auto px-3 pb-4 pt-4">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={isCollapsed ? item.label : undefined}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                clsx(
                  "flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isCollapsed ? "justify-center" : "gap-3",
                  isActive
                    ? "bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white"
                )
              }
            >
              <span className={clsx("shrink-0", isCollapsed ? "scale-110" : "")}>{item.icon}</span>
              {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
