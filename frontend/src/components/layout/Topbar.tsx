import { useAuth } from "../../context/AuthContext";
import { Button } from "../common/Button";

export function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="text-sm text-gray-500">{user?.role.replaceAll("_", " ")}</div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-800">{user?.name}</span>
        <Button variant="ghost" onClick={logout}>
          Log out
        </Button>
      </div>
    </header>
  );
}
