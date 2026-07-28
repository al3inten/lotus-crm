import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { ModuleKey } from "../types";

interface ProtectedRouteProps {
  /** Gate this route group on a module's read/write permission (mirrors useNavItems'
   *  logic) — SUPER_ADMIN always passes, STAFF users need "read" or "write" on `module`. */
  module?: ModuleKey;
  /** Gate this route group to SUPER_ADMIN only — used for routes with no module in
   *  NAV_ITEMS/MODULES (e.g. /settings). */
  requireSuperAdmin?: boolean;
}

export function ProtectedRoute({ module, requireSuperAdmin }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center text-gray-500">Loading…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "SUPER_ADMIN") {
    if (requireSuperAdmin) {
      return <Navigate to="/dashboard" replace />;
    }
    if (module) {
      const level = user.permissions?.[module];
      if (level !== "read" && level !== "write") {
        return <Navigate to="/dashboard" replace />;
      }
    }
  }

  return <Outlet />;
}
