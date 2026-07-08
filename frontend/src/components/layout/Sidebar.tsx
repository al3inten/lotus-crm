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
          "fixed z-50 flex flex-col bg-white/90 backdrop-blur-xl transition-transform duration-300 dark:bg-slate-950/90 shadow-2xl",
          // Mobile: Bottom sheet
          "inset-x-0 bottom-0 max-h-[85vh] rounded-t-3xl border-t border-slate-200/60 dark:border-slate-800/50",
          isMobileMenuOpen ? "translate-y-0" : "translate-y-full",
          // Desktop: Left sidebar
          "md:relative md:z-0 md:inset-y-0 md:left-0 md:h-full md:max-h-full md:rounded-none md:border-r md:border-t-0 md:translate-y-0 md:shadow-none",
          isCollapsed ? "md:w-20" : "md:w-64"
        )}
      >
        {/* Mobile Drag Handle */}
        <div className="flex h-6 w-full items-center justify-center md:hidden pt-3 pb-1 shrink-0">
          <div className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-6 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 hover:text-slate-800 hover:border-slate-300 hover:shadow-sm md:flex transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Logo header (hidden on mobile to save space for the sheet content) */}
        <div className="hidden md:flex h-[72px] items-center justify-center px-4 shrink-0 border-b border-slate-100/60 dark:border-slate-800/50">
          <div className={clsx("flex items-center gap-4 w-full", isCollapsed ? "justify-center" : "px-3")}>
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.25rem] bg-white shadow-md ring-1 ring-slate-200/50 overflow-hidden dark:ring-slate-800 dark:bg-slate-950">
              <img src="/hyundai-logo.jpg" alt="Hyundai" className="h-8 w-8 object-contain" />
            </div>
            {!isCollapsed && (
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-500 bg-clip-text text-transparent dark:from-blue-400 dark:via-sky-400 dark:to-cyan-300 leading-none pb-1">
                  Lotus CRM
                </span>
                <span className="mt-1 flex items-center gap-2 truncate text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 leading-none">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
                  Hyundai
                </span>
              </div>
            )}
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1.5 overflow-x-hidden overflow-y-auto px-3 py-3 md:py-4">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={isCollapsed ? item.label : undefined}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                clsx(
                  "group relative flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 overflow-hidden",
                  isCollapsed ? "justify-center" : "gap-3",
                  isActive
                    ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-inset ring-blue-600/10 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20"
                    : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200 hover:shadow-sm"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active indicator dot/bar */}
                  {isActive && !isCollapsed && (
                    <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-blue-600 dark:bg-blue-500" />
                  )}
                  
                  <span className={clsx("shrink-0 transition-all duration-300 group-hover:scale-110", isCollapsed ? "scale-110" : "")}>
                    <item.icon size={18} className={clsx(isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300")} />
                  </span>
                  {!isCollapsed && <span className="whitespace-nowrap font-medium">{item.label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
