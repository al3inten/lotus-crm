import { useEffect } from "react";
import { sendHeartbeat } from "../api/users.api";
import { useAuth } from "../context/AuthContext";

const HEARTBEAT_MS = 60_000;

/**
 * Pings the server on mount and every minute while the tab is visible, so the
 * team-activity monitor can tell who's actually online. Skips while the tab is
 * hidden and fires once more when it becomes visible again.
 */
export function useHeartbeat() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const beat = () => {
      if (!cancelled && document.visibilityState === "visible") {
        sendHeartbeat().catch(() => {
          /* transient — the next tick retries */
        });
      }
    };

    beat();
    const id = setInterval(beat, HEARTBEAT_MS);
    document.addEventListener("visibilitychange", beat);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", beat);
    };
  }, [user]);
}
