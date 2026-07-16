import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { LogOut, Search, Bell, HelpCircle, Menu, ChevronDown, Sun, Moon, BellOff, CheckCheck, Camera, Coffee, Loader2, User, Car } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../hooks/useTheme";
import { useNavItems } from "./navConfig";
import { useGlobalSearch } from "../../hooks/useGlobalSearch";
import { useNotifications, useMarkNotificationAsRead } from "../../hooks/useNotifications";
import { useUploadAvatar, useSetBreak } from "../../hooks/useUsers";
import type { AppNotification } from "../../types";
import { Avatar } from "../common/Avatar";
import { LogoutConfirmModal } from "../common/LogoutConfirmModal";

/** Compact relative time, e.g. "just now", "5m", "3h", "2d". */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export function Topbar({ onMenuToggle }: { onMenuToggle: () => void }) {
  const { user, logout, patchUser } = useAuth();
  const navigate = useNavigate();
  const navItems = useNavItems();
  const { toggle: toggleTheme } = useTheme();

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const uploadAvatar = useUploadAvatar();
  const setBreak = useSetBreak();

  const onPickAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    const updated = await uploadAvatar.mutateAsync({ userId: user.id, file });
    patchUser({ avatarUrl: updated.avatarUrl });
  };

  const toggleBreak = async () => {
    if (!user) return;
    const updated = await setBreak.mutateAsync(!user.onBreak);
    patchUser({ onBreak: updated.onBreak, isAvailableForRouting: updated.isAvailableForRouting });
  };

  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: notifications } = useNotifications();
  const markRead = useMarkNotificationAsRead();
  const unreadCount = notifications?.length ?? 0;

  const openNotification = (n: AppNotification) => {
    markRead.mutate(n.id);
    setIsNotificationsOpen(false);
    if (n.linkUrl) navigate(n.linkUrl);
  };

  const trimmedQuery = query.trim();
  const results = trimmedQuery
    ? navItems.filter((item) => item.label.toLowerCase().includes(trimmedQuery.toLowerCase()))
    : [];
  const { data: searchData, isFetching: isSearching } = useGlobalSearch(trimmedQuery);
  const leadResults = searchData?.leads ?? [];
  const vehicleResults = searchData?.vehicles ?? [];
  const hasAnyResults = results.length > 0 || leadResults.length > 0 || vehicleResults.length > 0;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape") {
        searchInputRef.current?.blur();
        setShowResults(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const goToResult = (to: string) => {
    navigate(to);
    setQuery("");
    setShowResults(false);
    searchInputRef.current?.blur();
  };

  const handleLogoutConfirm = () => {
    setIsLogoutModalOpen(false);
    setIsProfileMenuOpen(false);
    logout();
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-slate-200/50 bg-white/40 px-4 backdrop-blur-xl transition-colors dark:border-white/5 dark:bg-white/[0.02] sm:px-8">
        {/* Left: mobile menu + quick-nav search */}
        <div className="flex flex-1 items-center gap-4">
          <button
            onClick={onMenuToggle}
            aria-label="Open menu"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white md:hidden"
          >
            <Menu size={20} />
          </button>

          <div className="relative hidden w-full max-w-md md:block">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search size={14} className="text-slate-400 dark:text-slate-500" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              placeholder="Search..."
              className="h-8 w-full rounded-md border border-slate-200/50 bg-white/50 py-1 pl-9 pr-4 text-[13px] text-slate-900 placeholder-slate-400 transition-colors focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:placeholder-slate-500 dark:focus:border-white/20 dark:focus:bg-white/10 dark:focus:ring-white/10"
            />
            {/* Quick search shortcut hint */}
            <div className="pointer-events-none absolute inset-y-0 right-0 hidden items-center pr-2 md:flex">
              <kbd className="hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500 sm:block">
                ⌘K
              </kbd>
            </div>

            {/* Quick Search Dropdown */}
            {showResults && trimmedQuery && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowResults(false)} />
                <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-xl border border-slate-200/80 bg-white py-1.5 shadow-xl ring-1 ring-black/5 dark:border-slate-800/80 dark:bg-slate-900 dark:ring-white/10">
                  {results.length > 0 && (
                    <div className="pb-1.5">
                      {results.map((item) => (
                        <button
                          key={item.to}
                          onClick={() => goToResult(item.to)}
                          className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
                        >
                          <item.icon size={15} className="shrink-0 text-slate-400" />
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {leadResults.length > 0 && (
                    <div className="border-t border-slate-100 py-1.5 dark:border-slate-800">
                      <p className="px-3.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Leads</p>
                      {leadResults.map((lead) => (
                        <button
                          key={lead.enquiryId}
                          onClick={() => goToResult(`/leads/${lead.leadId}/enquiries/${lead.enquiryId}`)}
                          className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
                        >
                          <User size={15} className="shrink-0 text-slate-400" />
                          <span className="min-w-0 flex-1 truncate">
                            {lead.name} <span className="text-slate-400">· {lead.phone}</span>
                          </span>
                          <span className="shrink-0 truncate text-xs text-slate-400">{lead.carModel}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {vehicleResults.length > 0 && (
                    <div className="border-t border-slate-100 py-1.5 dark:border-slate-800">
                      <p className="px-3.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Vehicles</p>
                      {vehicleResults.map((vehicle) => (
                        <button
                          key={vehicle.id}
                          onClick={() => goToResult(`/vehicles?q=${encodeURIComponent(vehicle.name)}`)}
                          className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
                        >
                          <Car size={15} className="shrink-0 text-slate-400" />
                          {vehicle.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {!hasAnyResults && (
                    <p className="px-3.5 py-2 text-sm text-slate-400 dark:text-slate-500">
                      {isSearching ? "Searching..." : `No results for "${query}"`}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Actions & Profile */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1">
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="relative flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-white/5 dark:hover:text-slate-300"
            >
              <Sun size={15} className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon size={15} className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </button>
            
            <button className="hidden h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-white/5 dark:hover:text-slate-300 sm:flex">
              <HelpCircle size={15} />
            </button>
            
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
                className="relative flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-white/5 dark:hover:text-slate-300"
              >
                <Bell size={15} />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white dark:ring-[#0a0a0a]">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification inbox */}
              {isNotificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-2 w-80 origin-top-right overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-xl ring-1 ring-black/5 dark:border-slate-800/70 dark:bg-slate-900 dark:ring-white/10 sm:w-96">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => notifications?.forEach((n) => markRead.mutate(n.id))}
                          className="flex items-center gap-1 text-xs font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400"
                        >
                          <CheckCheck size={13} /> Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-[22rem] overflow-y-auto">
                      {unreadCount === 0 ? (
                        <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                          <BellOff size={22} className="text-slate-300 dark:text-slate-600" />
                          <p className="text-sm text-slate-400 dark:text-slate-500">You're all caught up.</p>
                        </div>
                      ) : (
                        notifications!.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => openNotification(n)}
                            className="flex w-full gap-3 border-b border-slate-50 px-4 py-3 text-left transition-colors last:border-0 hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/50"
                          >
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center justify-between gap-2">
                                <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">{n.title}</span>
                                <span className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500">{timeAgo(n.createdAt)}</span>
                              </span>
                              <span className="mt-0.5 block text-xs leading-snug text-slate-500 dark:text-slate-400">{n.body}</span>
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="h-4 w-px bg-slate-200 dark:bg-white/10 mx-2 hidden sm:block"></div>
            
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 rounded-md p-1 transition-colors hover:bg-slate-100 dark:hover:bg-white/5"
              >
                <span className="relative">
                  <Avatar name={user?.name ?? "?"} size="sm" src={user?.avatarUrl} />
                  {user?.onBreak && (
                    <span
                      title="On break"
                      className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-amber-500 ring-2 ring-white dark:ring-[#0a0a0a]"
                    >
                      <Coffee size={7} className="text-white" />
                    </span>
                  )}
                </span>
                <ChevronDown
                  size={15}
                  className={`hidden text-slate-400 transition-transform sm:block ${isProfileMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Profile Dropdown */}
              {isProfileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-2 w-72 origin-top-right rounded-2xl border border-slate-200/70 bg-white p-2 shadow-xl ring-1 ring-black/5 dark:border-slate-800/70 dark:bg-slate-900 dark:ring-white/10">
                    <div className="flex items-center gap-3 rounded-xl px-2.5 py-2.5">
                      <span className="relative">
                        <Avatar name={user?.name ?? "?"} size="md" src={user?.avatarUrl} />
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          disabled={uploadAvatar.isPending}
                          title="Change photo"
                          className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-white transition-colors hover:bg-slate-700 disabled:opacity-60 dark:border-slate-900 dark:bg-white dark:text-slate-900"
                        >
                          {uploadAvatar.isPending ? <Loader2 size={11} className="animate-spin" /> : <Camera size={11} />}
                        </button>
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{user?.name}</p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {user?.role.replaceAll("_", " ")}
                          {user?.branch ? ` · ${user.branch.name}` : ""}
                        </p>
                      </div>
                    </div>

                    <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={onPickAvatar} />

                    <div className="my-1.5 h-px bg-slate-100 dark:bg-slate-800" />

                    {/* Break toggle — going on break pauses new lead assignment. */}
                    <button
                      onClick={toggleBreak}
                      disabled={setBreak.isPending}
                      className={clsx(
                        "flex w-full items-center justify-between gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors disabled:opacity-60",
                        user?.onBreak
                          ? "text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                          : "text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10"
                      )}
                    >
                      <span className="flex items-center gap-2.5">
                        {setBreak.isPending ? <Loader2 size={16} className="animate-spin" /> : <Coffee size={16} />}
                        {user?.onBreak ? "End break — I'm back" : "Go on break"}
                      </span>
                      <span
                        className={clsx(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                          user?.onBreak
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                        )}
                      >
                        {user?.onBreak ? "On break" : "Working"}
                      </span>
                    </button>

                    <div className="my-1.5 h-px bg-slate-100 dark:bg-slate-800" />
                    <button
                      onClick={() => setIsLogoutModalOpen(true)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                    >
                      <LogOut size={16} />
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogoutConfirm}
      />
    </>
  );
}
