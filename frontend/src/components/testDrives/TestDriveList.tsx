import clsx from "clsx";
import { Car } from "lucide-react";
import type { TestDriveItem } from "../../api/testDrives.api";
import { Card } from "../common/Card";
import { Pagination } from "../common/Pagination";
import { TestDriveRow } from "./TestDriveRow";

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
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" style={{ animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
    );
  }

  if (total === 0) {
    return (
      <Card className="flex flex-col items-center gap-2 py-16 text-center text-slate-400 dark:text-slate-500">
        <Car size={30} />
        <p className="text-sm">No test drives here. Try a different filter.</p>
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
