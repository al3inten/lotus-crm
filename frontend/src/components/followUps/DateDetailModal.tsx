import { CalendarClock } from "lucide-react";
import { Modal } from "../common/Modal";
import { Avatar } from "../common/Avatar";

export function DateDetailModal({
  popupDate,
  popupTotal,
  popupCrs,
  canSeeOthers,
  onClose,
  onViewAll,
  onSelectCr,
}: {
  popupDate: string | null;
  popupTotal: number;
  popupCrs: { id: string; name: string; count: number }[];
  canSeeOthers: boolean;
  onClose: () => void;
  onViewAll: () => void;
  onSelectCr: (crId: string) => void;
}) {
  return (
    <Modal
      isOpen={!!popupDate}
      onClose={onClose}
      title={
        popupDate
          ? new Date(`${popupDate}T00:00:00`).toLocaleDateString(undefined, {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : undefined
      }
      maxWidth="max-w-md"
      footer={
        <button
          type="button"
          disabled={popupTotal === 0}
          onClick={onViewAll}
          className="w-full rounded-xl bg-primary-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:pointer-events-none disabled:opacity-40"
        >
          View all {popupTotal} follow-up{popupTotal === 1 ? "" : "s"}
        </button>
      }
    >
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <CalendarClock size={15} className="text-primary-500" />
        <span className="font-semibold text-slate-900 tabular-nums dark:text-white">{popupTotal}</span>
        follow-up{popupTotal === 1 ? "" : "s"} scheduled
      </div>

      {popupTotal === 0 ? (
        <p className="py-8 text-center text-sm italic text-slate-400 dark:text-slate-500">
          No follow-ups on this day.
        </p>
      ) : !canSeeOthers ? (
        <p className="py-4 text-center text-sm text-slate-600 dark:text-slate-300">
          You have <span className="font-bold tabular-nums">{popupTotal}</span> follow-up
          {popupTotal === 1 ? "" : "s"} due on this day.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          <p className="mb-1 text-xs font-medium text-slate-400 dark:text-slate-500">By customer rep</p>
          {popupCrs.map((cr) => (
            <button
              key={cr.id}
              type="button"
              onClick={() => onSelectCr(cr.id)}
              className="flex items-center justify-between gap-2 rounded-xl border border-transparent px-3 py-2.5 text-left transition-colors hover:border-primary-300 hover:bg-primary-50 dark:hover:border-primary-500/40 dark:hover:bg-primary-500/10"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <Avatar name={cr.name} size="sm" />
                <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{cr.name}</span>
              </span>
              <span className="shrink-0 rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-bold tabular-nums text-primary-700 dark:bg-primary-500/20 dark:text-primary-300">
                {cr.count}
              </span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
