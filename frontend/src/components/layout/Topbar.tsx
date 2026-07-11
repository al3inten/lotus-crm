import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Search, Bell, HelpCircle, Menu, ChevronDown, AtSign, Check, Sun, Moon } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../hooks/useTheme";
import { useNavItems } from "./navConfig";
import { useReminders } from "../../hooks/useLeads";
import { useNotifications, useMarkNotificationAsRead } from "../../hooks/useNotifications";
import { Avatar } from "../common/Avatar";
import { Button } from "../common/Button";
import { Modal } from "../common/Modal";

export function Topbar({ onMenuToggle }: { onMenuToggle: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = useNavItems();
  const { theme, toggle: toggleTheme } = useTheme();

  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMentionsOpen, setIsMentionsOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: appNotifications } = useNotifications();
  const { mutate: markRead } = useMarkNotificationAsRead();
  const unreadNotifications = appNotifications?.filter(n => !n.isRead) ?? [];

  const { data: reminders } = useReminders();
  const overdueReminders = reminders?.filter(r => {
    if (!r.followUpDueAt) return false;
    const due = new Date(r.followUpDueAt);
    const now = new Date();
    return due < now && due.toDateString() !== now.toDateString();
  }) ?? [];
  const todayReminders = reminders?.filter(r => {
    if (!r.followUpDueAt) return false;
    return new Date(r.followUpDueAt).toDateString() === new Date().toDateString();
  }) ?? [];
  const reminderCount = overdueReminders.length + todayReminders.length;

  const results = query.trim()
    ? navItems.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase()))
    : [];

  // ⌘K / Ctrl+K focuses the quick-nav search from anywhere on the page.
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
      <header className="sticky top-0 z-40 flex h-[72px] items-center gap-4 border-b border-slate-200/70 bg-white/85 px-4 backdrop-blur-xl transition-colors dark:border-slate-800/60 dark:bg-slate-950/85 sm:px-6">
        {/* Left: mobile menu + quick-nav search */}
        <div className="flex flex-1 items-center gap-3">
          <button
            onClick={onMenuToggle}
            aria-label="Open menu"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white md:hidden"
          >
            <Menu size={20} />
          </button>

          <div className="relative hidden w-full max-w-md md:block">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Search size={16} className="text-slate-400 dark:text-slate-500" />
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
              placeholder="Jump to a page…"
              aria-label="Quick navigation"
              className="block w-full rounded-xl border border-transparent bg-slate-100 py-2.5 pl-10 pr-14 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15 dark:bg-slate-800/60 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-900"
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
              <kbd className="inline-flex items-center gap-0.5 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-sans text-[10px] font-medium text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500">
                Ctrl K
              </kbd>
            </div>

            {showResults && query.trim() && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowResults(false)} />
                <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-slate-200/80 bg-white py-1.5 shadow-xl ring-1 ring-black/5 dark:border-slate-800/80 dark:bg-slate-900 dark:ring-white/10">
                  {results.length > 0 ? (
                    results.map((item) => (
                      <button
                        key={item.to}
                        onClick={() => goToResult(item.to)}
                        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
                      >
                        <item.icon size={15} className="shrink-0 text-slate-400" />
                        {item.label}
                      </button>
                    ))
                  ) : (
                    <p className="px-3.5 py-2 text-sm text-slate-400 dark:text-slate-500">No pages match "{query}"</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: notifications, help, profile */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="relative">
            <button
              onClick={() => {
                setIsMentionsOpen(v => !v);
                setIsNotificationsOpen(false);
              }}
              aria-label="Mentions"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            >
              <AtSign size={18} />
              {unreadNotifications.length > 0 && (
                <span className="absolute right-2 top-2 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
                </span>
              )}
            </button>

            {isMentionsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsMentionsOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-2 w-80 origin-top-right overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-xl ring-1 ring-black/5 dark:border-slate-800/70 dark:bg-slate-900 dark:ring-white/10">
                  <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
                    <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {unreadNotifications.length === 0 ? (
                      <p className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">No new mentions.</p>
                    ) : (
                      <div className="flex flex-col">
                        {unreadNotifications.map(n => (
                          <div
                            key={n.id}
                            className="group flex flex-col gap-1 border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                          >
                            <div className="flex items-start justify-between">
                              <button
                                onClick={() => {
                                  markRead(n.id);
                                  setIsMentionsOpen(false);
                                  if (n.linkUrl) navigate(n.linkUrl);
                                }}
                                className="flex-1 text-left"
                              >
                                <span className="font-medium text-slate-900 dark:text-slate-200">{n.title}</span>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{n.body}</p>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markRead(n.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 transition-opacity"
                                title="Mark as read"
                              >
                                <Check size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setIsNotificationsOpen(v => !v);
                setIsMentionsOpen(false);
              }}
              aria-label="Notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            >
              <Bell size={18} />
              {reminderCount > 0 && (
                <span className="absolute right-2 top-2 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-2 w-80 origin-top-right overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-xl ring-1 ring-black/5 dark:border-slate-800/70 dark:bg-slate-900 dark:ring-white/10">
                  <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
                    <h3 className="font-semibold text-slate-900 dark:text-white">Pending Follow-ups</h3>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {reminderCount === 0 ? (
                      <p className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">All caught up! 🎉</p>
                    ) : (
                      <div className="flex flex-col">
                        {overdueReminders.map(r => (
                          <button
                            key={r.id}
                            onClick={() => {
                              setIsNotificationsOpen(false);
                              navigate(`/leads/${r.leadId}`);
                            }}
                            className="flex flex-col gap-1 border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-slate-900 dark:text-slate-200">{r.lead.name}</span>
                              <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-rose-700 dark:bg-rose-500/20 dark:text-rose-400">Overdue</span>
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400">{r.carModel} • {r.status}</span>
                          </button>
                        ))}
                        {todayReminders.map(r => (
                          <button
                            key={r.id}
                            onClick={() => {
                              setIsNotificationsOpen(false);
                              navigate(`/leads/${r.leadId}`);
                            }}
                            className="flex flex-col gap-1 border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-slate-900 dark:text-slate-200">{r.lead.name}</span>
                              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">Due Today</span>
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400">{r.carModel} • {r.status}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            aria-label="Help"
            className="hidden h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300 sm:flex"
          >
            <HelpCircle size={18} />
          </button>

          <div className="hidden h-6 w-px bg-slate-200 dark:bg-slate-700 sm:block" />

          {/* Unified profile menu — avatar, account summary, and sign-out live in one place */}
          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen((v) => !v)}
              aria-haspopup="true"
              aria-expanded={isProfileMenuOpen}
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:hover:bg-slate-800 sm:pr-3"
            >
              <Avatar name={user?.name ?? "?"} size="sm" />
              <span className="hidden flex-col items-start gap-0.5 leading-none sm:flex">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{user?.name}</span>
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  {user?.role.replaceAll("_", " ")}
                  {user?.branch ? ` · ${user.branch.name}` : ""}
                </span>
              </span>
              <ChevronDown
                size={15}
                className={`hidden text-slate-400 transition-transform sm:block ${isProfileMenuOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isProfileMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsProfileMenuOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-2 w-64 origin-top-right rounded-2xl border border-slate-200/70 bg-white p-2 shadow-xl ring-1 ring-black/5 dark:border-slate-800/70 dark:bg-slate-900 dark:ring-white/10">
                  <div className="flex items-center gap-3 rounded-xl px-2.5 py-2.5">
                    <Avatar name={user?.name ?? "?"} size="md" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{user?.name}</p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {user?.role.replaceAll("_", " ")}
                        {user?.branch ? ` · ${user.branch.name}` : ""}
                      </p>
                    </div>
                  </div>
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
      </header>

      <Modal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} maxWidth="max-w-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 ring-4 ring-rose-50 dark:bg-rose-500/20 dark:ring-rose-500/10">
            <LogOut className="ml-0.5 h-5 w-5 text-rose-600 dark:text-rose-400" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Confirm Logout</h3>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          Are you sure you want to log out of your account? You will need to sign in again to access the dashboard.
        </p>
        <div className="mt-4 flex w-full gap-2">
          <Button variant="secondary" className="flex-1 justify-center" size="sm" onClick={() => setIsLogoutModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" className="flex-1 justify-center shadow-sm shadow-rose-500/20" size="sm" onClick={handleLogoutConfirm}>
            Log out
          </Button>
        </div>
      </Modal>
    </>
  );
}
