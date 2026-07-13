import { useState } from "react";
import { NavLink } from "react-router-dom";
import clsx from "clsx";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  LogOut,
} from "lucide-react";
import { useNavGroups } from "./navConfig";
import { useAuth } from "../../context/AuthContext";
import { Avatar } from "../common/Avatar";
import { LogoutConfirmModal } from "../common/LogoutConfirmModal";

interface SidebarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (val: boolean) => void;
}

/** Dispatches the same Cmd/Ctrl+K the Topbar's search input listens for, so the
 * sidebar's "Search..." trigger opens the real quick-nav search instead of
 * being a dead button. */
function openCommandSearch() {
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, metaKey: true, bubbles: true }));
}

export function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const groups = useNavGroups();
  const { user, logout } = useAuth();

  const handleLogoutConfirm = () => {
    setIsLogoutModalOpen(false);
    logout();
  };

  return (
    <>
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm transition-opacity md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex h-[100dvh] flex-col bg-white shadow-2xl transition-all duration-300 ease-in-out dark:bg-slate-950 dark:shadow-slate-900/50",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          "md:relative md:translate-x-0 md:border-r md:border-slate-200 md:shadow-none dark:md:border-slate-800",
          isCollapsed ? "w-64 md:w-20" : "w-72 md:w-72"
        )}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3.5 top-7 z-50 hidden h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition-all hover:border-slate-300 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 md:flex dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-200"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Header / Logo */}
        <div className="flex h-14 shrink-0 items-center border-b border-slate-100 px-4 transition-all dark:border-slate-800/60">
          <div className={clsx("flex w-full items-center gap-3", isCollapsed ? "justify-center" : "px-2")}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-200/70 dark:ring-slate-700">
              <img src="/hyundai-logo.jpg" alt="Hyundai" className="h-full w-full object-contain" />
            </div>
            {!isCollapsed && (
              <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <span className="truncate text-[14px] font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                  Lotus CRM
                </span>
                <span className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight">
                  Hyundai Motors
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Main Navigation - Compacted spacing */}
        <div className="flex min-h-0 flex-1 flex-col px-3 py-3 overflow-hidden hover:overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

          <button
            type="button"
            onClick={openCommandSearch}
            aria-label="Search"
            title={isCollapsed ? "Search (Ctrl/⌘K)" : undefined}
            className={clsx(
              "group mb-4 flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200",
              isCollapsed ? "justify-center" : "gap-3"
            )}
          >
            <Search size={16} className="shrink-0" />
            {!isCollapsed && (
              <div className="flex flex-1 items-center justify-between">
                <span>Search...</span>
                <kbd className="hidden rounded bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 shadow-sm md:block dark:bg-slate-800 dark:text-slate-500">
                  ⌘K
                </kbd>
              </div>
            )}
          </button>

          {/* Nav Groups - Reduced gaps */}
          <nav className="flex flex-col gap-3">
            {groups.map((section) => (
              <div key={section.group} className="flex flex-col gap-0.5">
                {isCollapsed ? (
                  <div className="mx-auto mb-1 h-px w-6 bg-slate-200 dark:bg-slate-800" />
                ) : (
                  <p className="mb-0.5 px-2 text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500">
                    {section.label}
                  </p>
                )}

                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    title={isCollapsed ? item.label : undefined}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      clsx(
                        "group relative flex items-center rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50",
                        isCollapsed ? "justify-center" : "gap-3",
                        isActive
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute left-0 top-1/2 h-3/5 w-1 -translate-y-1/2 rounded-r-md bg-blue-600 dark:bg-blue-500" />
                        )}
                        <item.icon
                          size={16}
                          strokeWidth={isActive ? 2.5 : 2}
                          className={clsx(
                            "shrink-0 transition-transform duration-200",
                            isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300",
                            isCollapsed && "group-hover:scale-110"
                          )}
                        />
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
        </div>

        {/* Footer / User Profile + Log out */}
        <div className="shrink-0 border-t border-slate-100 p-2 dark:border-slate-800/60">
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div title={user ? `${user.name} · ${user.role.replaceAll("_", " ")}` : undefined}>
                <Avatar name={user?.name ?? "?"} size="sm" />
              </div>
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(true)}
                aria-label="Log out"
                title="Log out"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 rounded-lg p-1.5">
              <Avatar name={user?.name ?? "?"} size="sm" />
              <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <span className="truncate text-[13px] font-semibold leading-tight text-slate-900 dark:text-slate-200">
                  {user?.name ?? "Guest"}
                </span>
                <span className="truncate text-[11px] font-medium leading-tight text-slate-500 dark:text-slate-400">
                  {user?.role ? user.role.replaceAll("_", " ") : ""}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(true)}
                aria-label="Log out"
                title="Log out"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>

      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogoutConfirm}
      />
    </>
  );
}