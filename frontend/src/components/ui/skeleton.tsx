import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** shadcn/ui Skeleton — shimmering placeholder for loading states. */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-200/70 dark:bg-slate-800/70", className)}
      {...props}
    />
  );
}
