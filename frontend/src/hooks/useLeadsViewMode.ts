import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

export type LeadsViewMode = "table" | "card" | "kanban";

const STORAGE_KEY_PREFIX = "lotus_leads_view_";

function readStored(userId: string | undefined): LeadsViewMode {
  if (typeof window === "undefined" || !userId) return "table";
  const saved = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
  return saved === "card" || saved === "kanban" ? saved : "table";
}

/**
 * Leads list view mode (table / card / kanban), remembered per signed-in user —
 * mirrors the localStorage pattern in useTheme so picking "card" today means it's
 * still "card" next time this user signs in, on this device.
 */
export function useLeadsViewMode() {
  const { user } = useAuth();
  const [view, setView] = useState<LeadsViewMode>(() => readStored(user?.id));

  // Re-sync if the signed-in user changes (e.g. logout -> different account, same tab).
  useEffect(() => {
    setView(readStored(user?.id));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${user.id}`, view);
  }, [view, user?.id]);

  return [view, setView] as const;
}
