import { useState } from "react";
import { LogOut, Search, Bell, HelpCircle, Menu } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../common/Button";
import { Modal } from "../common/Modal";
import { Avatar } from "../common/Avatar";

export function Topbar({ onMenuToggle }: { onMenuToggle: () => void }) {
  const { user, logout } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogoutConfirm = () => {
    setIsLogoutModalOpen(false);
    logout();
  };

  return (
    <>
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 sm:px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 transition-colors">
        
        {/* Left: Global Search & Mobile Menu */}
        <div className="flex flex-1 items-center gap-4">
          <button 
            onClick={onMenuToggle}
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <Menu size={20} />
          </button>
          
          <div className="group relative hidden w-full max-w-md md:block">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search size={16} className="text-slate-400 transition-colors group-focus-within:text-indigo-500" />
            </div>
            <input
              type="text"
              placeholder="Search leads, campaigns..."
              className="block w-full rounded-xl border-0 bg-slate-100/80 py-2 pl-10 pr-14 text-sm text-slate-900 ring-1 ring-inset ring-slate-200 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:bg-slate-800/80 dark:text-white dark:ring-slate-700 dark:placeholder:text-slate-500 dark:focus:bg-slate-900 sm:leading-6"
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <kbd className="inline-flex items-center rounded-md border border-slate-200 px-1.5 py-0.5 font-sans text-[10px] font-medium text-slate-400 dark:border-slate-700 dark:text-slate-500">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right: Actions & Profile */}
        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* Icons */}
          <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
            <button className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300">
              <Bell size={18} />
            </button>
            <button className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300">
              <HelpCircle size={18} />
            </button>
          </div>

          <div className="hidden sm:block h-5 w-px bg-slate-200 dark:bg-slate-700" />

          {/* Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              className="flex items-center gap-2 rounded-full p-1 pr-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <Avatar name={user?.name || "User"} size="sm" />
              <span className="hidden flex-col items-start leading-tight sm:flex">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{user?.name}</span>
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                  {user?.role.replaceAll("_", " ")}
                  {user?.branch ? ` · ${user.branch.name}` : ""}
                </span>
              </span>
            </button>
            <button 
              onClick={() => setIsLogoutModalOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:text-slate-500 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
              title="Log out"
            >
              <LogOut size={18} />
            </button>
          </div>
          
        </div>
      </header>

      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        title="Confirm Logout"
      >
        <p className="mb-6 text-sm text-gray-600">
          Are you sure you want to log out of your account?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setIsLogoutModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleLogoutConfirm}>
            Log out
          </Button>
        </div>
      </Modal>
    </>
  );
}
