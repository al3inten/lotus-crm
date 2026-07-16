import clsx from "clsx";
import { Users, Coffee } from "lucide-react";
import { Card } from "../common/Card";
import { Avatar } from "../common/Avatar";
import { useTeamActivity } from "../../hooks/useUsers";
import type { TeamActivityMember } from "../../types";

/** Compact relative time: "now", "5m", "3h", "2d". */
function ago(iso?: string | null): string {
  if (!iso) return "never";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

type Presence = { label: string; dot: string; text: string };

/** Working state from break flag + heartbeat recency. */
function presenceOf(m: TeamActivityMember): Presence {
  if (m.onBreak) return { label: "On break", dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" };
  if (!m.lastActiveAt) return { label: "Offline", dot: "bg-slate-300 dark:bg-slate-600", text: "text-slate-400" };
  const mins = (Date.now() - new Date(m.lastActiveAt).getTime()) / 60000;
  if (mins < 2) return { label: "Online", dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" };
  if (mins < 10) return { label: "Away", dot: "bg-amber-400", text: "text-amber-600 dark:text-amber-400" };
  return { label: `Seen ${ago(m.lastActiveAt)} ago`, dot: "bg-slate-300 dark:bg-slate-600", text: "text-slate-400" };
}

export function TeamActivityCard({ className }: { className?: string }) {
  const { data: members, isLoading } = useTeamActivity();

  const online = (members ?? []).filter((m) => {
    if (m.onBreak || !m.lastActiveAt) return false;
    return (Date.now() - new Date(m.lastActiveAt).getTime()) / 60000 < 2;
  }).length;
  const onBreak = (members ?? []).filter((m) => m.onBreak).length;

  return (
    <Card className={clsx("p-6", className)}>
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-[13px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          <Users size={15} className="text-slate-400" /> Team activity
        </h3>
        <div className="flex items-center gap-2 text-[11px] font-medium">
          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {online} online
          </span>
          {onBreak > 0 && (
            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <Coffee size={11} /> {onBreak}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-1">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          ))
        ) : !members || members.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-slate-400 dark:text-slate-500">No staff to show.</p>
        ) : (
          members.map((m) => {
            const p = presenceOf(m);
            return (
              <div key={m.id} className="flex items-center gap-3 rounded-lg py-1.5">
                <span className="relative shrink-0">
                  <Avatar name={m.name} size="sm" src={m.avatarUrl} />
                  <span
                    className={clsx(
                      "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white dark:ring-slate-900",
                      p.dot
                    )}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-slate-800 dark:text-slate-200">{m.name}</p>
                  <p className="truncate text-[11px] text-slate-400 dark:text-slate-500">
                    {m.role.replaceAll("_", " ")}
                    {m.branch ? ` · ${m.branch.name}` : ""}
                  </p>
                </div>
                <span className={clsx("shrink-0 text-[11px] font-medium", p.text)}>{p.label}</span>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
