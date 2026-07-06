import { LogOut, UserCircle2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../common/Button";

export function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
          {user?.role.replaceAll("_", " ")}
        </span>
        {user?.branch && (
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            {user.branch.name}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
          <UserCircle2 size={18} className="text-gray-400" />
          {user?.name}
        </span>
        <Button variant="ghost" size="sm" icon={<LogOut size={14} />} onClick={logout}>
          Log out
        </Button>
      </div>
    </header>
  );
}
