import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { Search, Bell, HelpCircle, Menu, Sun, Moon, BellOff, CheckCheck, User, Car, CalendarClock, Cake, PartyPopper, ArrowRight, X } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { useNavItems } from "./navConfig";
import { useGlobalSearch } from "../../hooks/useGlobalSearch";
import { useNotifications, useMarkNotificationAsRead, useReminders } from "../../hooks/useNotifications";
import type { AppNotification, Reminder } from "../../types";

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
  const navigate = useNavigate();
  const navItems = useNavItems();
  const { toggle: toggleTheme } = useTheme();

  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  // The search box is hidden below md to save space; this toggles it into view on small
  // screens (tap the search icon) since it would otherwise be completely unreachable there.
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: notifications } = useNotifications();
  const { data: reminders } = useReminders();
  const markRead = useMarkNotificationAsRead();
  const unreadCount = notifications?.length ?? 0;
  const reminderCount = reminders?.length ?? 0;
  const badgeCount = unreadCount + reminderCount;

  const openNotification = (n: AppNotification) => {
    markRead.mutate(n.id);
    setIsNotificationsOpen(false);
    if (n.linkUrl) navigate(n.linkUrl);
  };

  // Reminders are computed live (not stored) — just navigate to the lead, no mark-read.
  const openReminder = (r: Reminder) => {
    setIsNotificationsOpen(false);
    navigate(r.linkUrl);
  };

  const reminderIcon = (type: Reminder["type"]) =>
    type === "BIRTHDAY" ? Cake : type === "ANNIVERSARY" ? PartyPopper : CalendarClock;

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
        setShowMobileSearch(true);
        // The input is hidden until the mobile-search state above renders it, so wait a tick.
        setTimeout(() => searchInputRef.current?.focus(), 0);
      }
      if (e.key === "Escape") {
        searchInputRef.current?.blur();
        setShowResults(false);
        setShowMobileSearch(false);
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

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-slate-200/50 bg-white/40 px-4 backdrop-blur-xl transition-colors dark:border-white/5 dark:bg-white/[0.02] sm:px-8">
        {/* Left: mobile menu + quick-nav search */}
        <div className="flex flex-1 items-center gap-4">
          {!showMobileSearch && (
            <button
              onClick={onMenuToggle}
              aria-label="Open menu"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white md:hidden"
            >
              <Menu size={20} />
            </button>
          )}

          {/* Below md the search box is hidden by default (no room in the header) — this
              button reveals it in its place so search stays reachable on small screens. */}
          {!showMobileSearch && (
            <button
              onClick={() => {
                setShowMobileSearch(true);
                setTimeout(() => searchInputRef.current?.focus(), 0);
              }}
              aria-label="Open search"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white md:hidden"
            >
              <Search size={18} />
            </button>
          )}

          <div className={clsx("relative w-full max-w-md", showMobileSearch ? "flex" : "hidden", "md:flex")}>
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
                          className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-primary-50 hover:text-primary-700 dark:text-slate-300 dark:hover:bg-primary-500/10 dark:hover:text-primary-400"
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
                          className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-primary-50 hover:text-primary-700 dark:text-slate-300 dark:hover:bg-primary-500/10 dark:hover:text-primary-400"
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
                          className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-primary-50 hover:text-primary-700 dark:text-slate-300 dark:hover:bg-primary-500/10 dark:hover:text-primary-400"
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

          {showMobileSearch && (
            <button
              onClick={() => {
                setShowMobileSearch(false);
                setQuery("");
                setShowResults(false);
              }}
              aria-label="Close search"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white md:hidden"
            >
              <X size={18} />
            </button>
          )}
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
                aria-label={`Notifications${badgeCount ? `, ${badgeCount} new` : ""}`}
                className="relative flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-white/5 dark:hover:text-slate-300"
              >
                <Bell size={15} />
                {badgeCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white dark:ring-[#0a0a0a]">
                    {badgeCount > 9 ? "9+" : badgeCount}
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
                          className="flex items-center gap-1 text-xs font-medium text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400"
                        >
                          <CheckCheck size={13} /> Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-[22rem] overflow-y-auto">
                      {/* Reminders for today — follow-ups due, birthdays, delivery anniversaries. */}
                      {reminderCount > 0 && (
                        <div>
                          <p className="bg-slate-50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:bg-slate-800/60 dark:text-slate-500">
                            Reminders for today
                          </p>
                          {reminders!.map((r) => {
                            const Icon = reminderIcon(r.type);
                            return (
                              <div
                                key={r.id}
                                className="flex items-start gap-3 border-b border-slate-50 px-4 py-3 dark:border-slate-800/60"
                              >
                                <span
                                  className={clsx(
                                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                                    r.isOverdue
                                      ? "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400"
                                      : "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
                                  )}
                                >
                                  <Icon size={14} />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">{r.title}</span>
                                  <span className="mt-0.5 block text-xs leading-snug text-slate-500 dark:text-slate-400">{r.body}</span>
                                  <button
                                    onClick={() => openReminder(r)}
                                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400"
                                  >
                                    View <ArrowRight size={12} />
                                  </button>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {badgeCount === 0 ? (
                        <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                          <BellOff size={22} className="text-slate-300 dark:text-slate-600" />
                          <p className="text-sm text-slate-400 dark:text-slate-500">You're all caught up.</p>
                        </div>
                      ) : (
                        notifications?.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => openNotification(n)}
                            className="flex w-full gap-3 border-b border-slate-50 px-4 py-3 text-left transition-colors last:border-0 hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/50"
                          >
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-500" />
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

          </div>
        </div>
      </header>
    </>
  );
}
