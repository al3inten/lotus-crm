import { useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import clsx from "clsx";
import {
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Coffee,
  Loader2,
} from "lucide-react";
import { useNavGroups } from "./navConfig";
import { useAuth } from "../../context/AuthContext";
import { useSetBreak } from "../../hooks/useUsers";
import { Avatar } from "../common/Avatar";
import { LogoutConfirmModal } from "../common/LogoutConfirmModal";

interface SidebarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (val: boolean) => void;
}

export function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const groups = useNavGroups();
  const { user, logout, patchUser } = useAuth();

  const setBreak = useSetBreak();

  const toggleBreak = async () => {
    if (!user) return;
    const updated = await setBreak.mutateAsync(!user.onBreak);
    patchUser({ onBreak: updated.onBreak, isAvailableForRouting: updated.isAvailableForRouting });
  };

  const handleLogoutConfirm = () => {
    setIsLogoutModalOpen(false);
    logout();
  };

  return (
    <>
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 transition-opacity md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={clsx(
          // Deep corporate slate/blue background with bright default text
          "fixed inset-y-0 left-0 z-50 flex h-[100dvh] flex-col bg-slate-900 text-slate-200 transition-all duration-300 ease-in-out dark:bg-[#0f172a]",
          "border-r border-slate-700/50 shadow-xl shadow-slate-900/20",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          "md:relative md:translate-x-0",
          isCollapsed ? "w-64 md:w-[72px]" : "w-72 md:w-64"
        )}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3.5 top-5 z-50 hidden h-7 w-7 items-center justify-center rounded-full border border-slate-600 bg-slate-800 text-slate-300 shadow-sm transition-all hover:border-primary-400 hover:text-primary-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 md:flex"
        >
          {isCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
        </button>

        {/* Header / Logo */}
        <div className="flex h-16 shrink-0 items-center px-4">
          <div className={clsx("flex w-full items-center gap-3", isCollapsed ? "justify-center" : "px-1")}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white shadow-sm">
              <img src="/hyundai-logo.jpg" alt="Hyundai" className="h-full w-full object-contain p-0.5" />
            </div>
            {!isCollapsed && (
              <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <span className="truncate text-[15px] font-bold tracking-tight text-white leading-tight">
                  Lotus D-CRM
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        <div className="flex min-h-0 flex-1 flex-col px-3 py-2 overflow-hidden hover:overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Nav Groups */}
          <nav className="flex flex-col gap-5">
            {groups.map((section) => (
              <div key={section.group} className="flex flex-col gap-0.5">
                {isCollapsed ? (
                  <div className="mx-auto mb-2 mt-1 h-px w-6 bg-slate-700" />
                ) : (
                  <p className="mb-1 px-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {section.label}
                  </p>
                )}

                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end
                    title={isCollapsed ? item.label : undefined}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      clsx(
                        "group relative flex items-center rounded-md px-2 py-1.5 text-[13px] font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40",
                        isCollapsed ? "justify-center" : "gap-3",
                        isActive
                          ? "bg-primary-500/20 text-primary-300"
                          : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {/* Zoho style active indicator rail on the left */}
                        {isActive && (
                          <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full bg-primary-400" />
                        )}
                        <span
                          className={clsx(
                            "flex h-6 w-6 shrink-0 items-center justify-center transition-colors duration-150",
                            isActive
                              ? "text-primary-300"
                              : "text-slate-400 group-hover:text-slate-200"
                          )}
                        >
                          <item.icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                        </span>
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
        <div className="shrink-0 border-t border-slate-700/50 bg-slate-900/90 p-3">
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-3">
              <span className="relative" title={user ? `${user.name} · ${user.role.replaceAll("_", " ")}` : undefined}>
                <Avatar name={user?.name ?? "?"} size="sm" src={user?.avatarUrl} />
              </span>
              <button
                type="button"
                onClick={toggleBreak}
                disabled={setBreak.isPending}
                title={user?.onBreak ? "End break — I'm back" : "Go on break"}
                className={clsx(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors disabled:opacity-60",
                  user?.onBreak
                    ? "text-emerald-400 hover:bg-emerald-500/10"
                    : "text-amber-400 hover:bg-amber-500/10"
                )}
              >
                {setBreak.isPending ? <Loader2 size={16} className="animate-spin" /> : <Coffee size={16} />}
              </button>
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(true)}
                aria-label="Log out"
                title="Log out"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-rose-500/20 hover:text-rose-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-3">
                <span className="relative">
                  <Avatar name={user?.name ?? "?"} size="sm" src={user?.avatarUrl} />
                </span>
                <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                  <span className="truncate text-[13px] font-semibold leading-tight text-white">
                    {user?.name ?? "Guest"}
                  </span>
                  {user?.role && (
                    <span className="truncate text-[11px] text-slate-400">
                      {user.role.replaceAll("_", " ")}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsLogoutModalOpen(true)}
                  aria-label="Log out"
                  title="Log out"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-rose-500/20 hover:text-rose-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40"
                >
                  <LogOut size={16} />
                </button>
              </div>

              <button
                type="button"
                onClick={toggleBreak}
                disabled={setBreak.isPending}
                className={clsx(
                  "flex w-full items-center justify-between gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-60",
                  user?.onBreak
                    ? "text-emerald-400 hover:bg-emerald-500/10"
                    : "text-amber-400 hover:bg-amber-500/10"
                )}
              >
                <span className="flex items-center gap-2">
                  {setBreak.isPending ? <Loader2 size={14} className="animate-spin" /> : <Coffee size={14} />}
                  {user?.onBreak ? "End break — I'm back" : "Go on break"}
                </span>
                <span
                  className={clsx(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                    user?.onBreak
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-emerald-500/20 text-emerald-300"
                  )}
                >
                  {user?.onBreak ? "On break" : "Working"}
                </span>
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