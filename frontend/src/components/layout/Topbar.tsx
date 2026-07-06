import { useState } from "react";
import { LogOut, Search, Bell, HelpCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../common/Button";
import { Modal } from "../common/Modal";
import { Avatar } from "../common/Avatar";

export function Topbar() {
  const { user, logout } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogoutConfirm = () => {
    setIsLogoutModalOpen(false);
    logout();
  };

  return (
    <>
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
        
        {/* Left: Global Search */}
        <div className="flex flex-1 items-center">
          <div className="group relative hidden w-full max-w-md lg:block">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search size={14} className="text-gray-400 transition-colors group-focus-within:text-indigo-500" />
            </div>
            <input
              type="text"
              placeholder="Search leads, campaigns..."
              className="block w-full rounded-md border-0 bg-gray-50/50 py-1.5 pl-9 pr-14 text-sm text-gray-900 ring-1 ring-inset ring-gray-200 transition-all placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:leading-6"
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <kbd className="inline-flex items-center rounded border border-gray-200 px-1 font-sans text-[10px] font-medium text-gray-400">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right: Actions & Profile */}
        <div className="flex items-center gap-4">
          
          {/* Icons */}
          <div className="flex items-center gap-1 text-gray-400">
            <button className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-100 hover:text-gray-600">
              <Bell size={16} />
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-100 hover:text-gray-600">
              <HelpCircle size={16} />
            </button>
          </div>

          <div className="h-4 w-px bg-gray-200" />

          {/* Profile */}
          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-2 rounded-full p-1 pr-2 transition-colors hover:bg-gray-50"
            >
              <Avatar name={user?.name || "User"} size="sm" />
              <span className="hidden flex-col items-start leading-tight sm:flex">
                <span className="text-sm font-medium text-gray-700">{user?.name}</span>
                <span className="text-xs text-gray-400">
                  {user?.role.replaceAll("_", " ")}
                  {user?.branch ? ` · ${user.branch.name}` : ""}
                </span>
              </span>
            </button>
            <button 
              onClick={() => setIsLogoutModalOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
              title="Log out"
            >
              <LogOut size={16} />
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
