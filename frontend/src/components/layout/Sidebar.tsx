import { useState } from "react";
import { NavLink } from "react-router-dom";
import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavItems } from "./navConfig";

interface SidebarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (val: boolean) => void;
}

export function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const items = useNavItems();

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
          "fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-slate-200/60 bg-white/80 backdrop-blur-xl transition-all duration-300 md:relative md:z-0 dark:border-slate-800/50 dark:bg-slate-950/80",
          isCollapsed ? "w-20" : "w-64",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-6 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 hover:text-slate-800 hover:border-slate-300 hover:shadow-sm md:flex transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className="flex h-[72px] items-center justify-center px-4 shrink-0 mb-2 mt-1">
          <div className={clsx("flex items-center gap-3 w-full", isCollapsed ? "justify-center" : "px-2")}>
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/50 overflow-hidden dark:ring-slate-800 dark:bg-slate-950">
              <img src="/hyundai-logo.jpg" alt="Hyundai" className="h-7 w-7 object-contain" />
            </div>
            {!isCollapsed && (
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[15px] font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                  Lotus CRM
                </span>
                <span className="mt-1.5 truncate text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 leading-none">
                  Hyundai
                </span>
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
                  "group relative flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isCollapsed ? "justify-center" : "gap-3",
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold text-white shadow-[0_4px_12px_rgba(37,99,235,0.25)] dark:from-blue-600 dark:to-indigo-600"
                    : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white"
                )
              }
            >
              <span className={clsx("shrink-0", isCollapsed ? "scale-110" : "")}>
                <item.icon size={18} />
              </span>
              {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
