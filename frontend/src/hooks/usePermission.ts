import { useAuth } from "../context/AuthContext";
import type { ModuleKey } from "../types";

function useLevel(module: ModuleKey) {
  const { user } = useAuth();
  if (!user) return "none" as const;
  if (user.role === "SUPER_ADMIN") return "write" as const;
  return user.permissions?.[module] ?? "none";
}

/** True if the current user can view this section (read or write access, or SUPER_ADMIN). */
export function useCanRead(module: ModuleKey): boolean {
  const level = useLevel(module);
  return level === "read" || level === "write";
}

/** True if the current user can create/update/delete in this section (or SUPER_ADMIN). */
export function useCanWrite(module: ModuleKey): boolean {
  const level = useLevel(module);
  return level === "write";
}
