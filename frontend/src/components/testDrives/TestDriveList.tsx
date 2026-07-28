import clsx from "clsx";
import { Car } from "lucide-react";
import type { TestDriveItem } from "../../api/testDrives.api";
import { Card } from "../common/Card";
import { Pagination } from "../common/Pagination";
import { TestDriveRow } from "./TestDriveRow";

function TestDriveRowSkeleton({ delay }: { delay: number }) {
  return (
    <div
      className="flex animate-pulse flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60 sm:flex-row sm:items-center"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="h-11 w-11 shrink-0 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="h-3.5 w-32 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-3 w-28 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="h-3 w-40 rounded bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
}

export function TestDriveList({
  isLoading,
  total,
  items,
  isFetching,
  onOpen,
  page,
  totalPages,
  onPageChange,
}: {
  isLoading: boolean;
  total: number;
  items: TestDriveItem[];
  isFetching: boolean;
  onOpen: (item: TestDriveItem) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <TestDriveRowSkeleton key={i} delay={i * 60} />
        ))}
      </div>
    );
  }

  if (total === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
          <Car size={26} />
        </span>
        <p className="text-sm text-slate-400 dark:text-slate-500">No test drives here. Try a different filter.</p>
      </Card>
    );
  }

  return (
    <div className={clsx("transition-opacity duration-200", isFetching && "pointer-events-none opacity-60")}>
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <TestDriveRow key={item.id} item={item} onOpen={onOpen} />
        ))}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </div>
  );
}
