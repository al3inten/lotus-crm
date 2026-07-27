import { DayPicker, type DayPickerProps } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * shadcn-style Calendar on react-day-picker v10. Class keys below are v10's `UI`
 * element names (they were renamed from v8), styled with the app's slate/blue tokens
 * so it matches the rest of the design system in both light and dark mode.
 */
export function Calendar({ className, classNames, showOutsideDays = true, ...props }: DayPickerProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-1", className)}
      classNames={{
        months: "flex flex-col gap-4",
        month: "space-y-3",
        month_caption: "flex items-center justify-center pt-1 relative group",
        caption_label: "text-sm font-semibold text-slate-900 dark:text-white group-has-[select]:hidden",
        nav: "flex items-center gap-1 absolute inset-x-1 top-1 justify-between z-10",
        button_previous:
          "inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white",
        button_next:
          "inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "w-9 text-[0.7rem] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500",
        week: "flex w-full mt-1",
        day: "h-9 w-9 p-0 text-center text-sm",
        day_button:
          "inline-flex h-9 w-9 items-center justify-center rounded-lg font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-slate-200 dark:hover:bg-slate-800",
        selected:
          "[&>button]:bg-primary-600 [&>button]:text-white [&>button]:hover:bg-primary-600 dark:[&>button]:bg-primary-500 dark:[&>button]:hover:bg-primary-500",
        today: "[&>button]:ring-1 [&>button]:ring-primary-500/50 [&>button]:font-semibold",
        outside: "[&>button]:text-slate-300 dark:[&>button]:text-slate-600",
        disabled: "[&>button]:opacity-30 [&>button]:cursor-not-allowed [&>button]:hover:bg-transparent",
        hidden: "invisible",
        range_middle:
          "[&>button]:rounded-none [&>button]:bg-primary-50 [&>button]:text-primary-900 dark:[&>button]:bg-primary-500/15 dark:[&>button]:text-primary-100",
        dropdowns: "flex items-center justify-center gap-1.5 mt-0.5",
        dropdown:
          "h-7 rounded-lg border border-slate-200/80 bg-slate-50/50 px-2 py-0.5 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-100/70 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/25 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-800/70 dark:text-slate-300 cursor-pointer",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...rest }) =>
          orientation === "left" ? <ChevronLeft size={16} {...rest} /> : <ChevronRight size={16} {...rest} />,
      }}
      {...props}
    />
  );
}
