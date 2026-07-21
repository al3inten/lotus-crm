import clsx from "clsx";
import { CalendarClock } from "lucide-react";
import type { UpcomingFollowUp } from "../../api/followUps.api";
import { Card } from "../common/Card";
import { Pagination } from "../common/Pagination";
import { FollowUpRow } from "./FollowUpRow";

export function FollowUpList({
  isLoading,
  total,
  items,
  isFetching,
  canSeeOthers,
  onOpen,
  page,
  totalPages,
  onPageChange,
}: {
  isLoading: boolean;
  total: number;
  items: UpcomingFollowUp[];
  isFetching: boolean;
  canSeeOthers: boolean;
  onOpen: (item: UpcomingFollowUp) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" style={{ animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
    );
  }

  if (total === 0) {
    return (
      <Card className="flex flex-col items-center gap-2 py-16 text-center text-slate-400 dark:text-slate-500">
        <CalendarClock size={30} />
        <p className="text-sm">No follow-ups here. Try a different timeframe or filter.</p>
      </Card>
    );
  }

  return (
    <div className={clsx("transition-opacity duration-200", isFetching && "pointer-events-none opacity-60")}>
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <FollowUpRow key={item.enquiryId} item={item} canSeeOthers={canSeeOthers} onOpen={onOpen} />
        ))}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </div>
  );
}
