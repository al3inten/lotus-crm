import type { EnquiryStatusHistoryEntry } from "../../types";
import { StatusBadge } from "../common/StatusBadge";

export function StatusTimeline({ history }: { history: EnquiryStatusHistoryEntry[] }) {
  if (history.length === 0) {
    return <p className="text-sm text-gray-400">No status history yet.</p>;
  }

  return (
    <ol className="flex flex-col gap-3">
      {history.map((entry) => (
        <li key={entry.id} className="flex items-start gap-3 text-sm">
          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
          <div>
            <div className="flex items-center gap-2">
              <StatusBadge status={entry.toStatus} />
              <span className="text-xs text-gray-400">{new Date(entry.createdAt).toLocaleString()}</span>
            </div>
            {entry.changedBy && <p className="text-xs text-gray-500">by {entry.changedBy.name}</p>}
            {entry.note && <p className="mt-0.5 text-gray-600">{entry.note}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
