import { useState, useMemo, useEffect } from "react";
import clsx from "clsx";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CalendarDays } from "lucide-react";
import { Card } from "../common/Card";

interface FollowUpCalendarProps {
  currentDate: Date;
  counts: Record<string, number>;
  onSelectDate: (date: string) => void;
  selectedDateStr?: string;
  onRangeChange: (start: string, end: string) => void;
  className?: string;
}

export function FollowUpCalendar({ currentDate, counts, onSelectDate, selectedDateStr, onRangeChange, className }: FollowUpCalendarProps) {
  const [view, setView] = useState<"week" | "month">("week");
  const [baseDate, setBaseDate] = useState(currentDate);

  // Generate calendar days
  const days = useMemo(() => {
    const list: { date: Date; isCurrentMonth: boolean; iso: string }[] = [];
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();

    if (view === "month") {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      const startPadding = firstDay.getDay(); // 0 (Sun) to 6 (Sat)
      const startDate = new Date(year, month, 1 - startPadding);
      const endPadding = 6 - lastDay.getDay();
      const endDate = new Date(year, month + 1, endPadding);

      let d = new Date(startDate);
      while (d <= endDate) {
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        list.push({ date: new Date(d), isCurrentMonth: d.getMonth() === month, iso });
        d.setDate(d.getDate() + 1);
      }
    } else {
      // Week view
      const day = baseDate.getDay();
      const startDate = new Date(baseDate);
      startDate.setDate(baseDate.getDate() - day);
      
      for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        list.push({ date: d, isCurrentMonth: true, iso });
      }
    }
    return list;
  }, [baseDate, view]);

  // Report range when view or baseDate changes
  useEffect(() => {
    if (days.length === 0) return;
    onRangeChange(days[0].iso, days[days.length - 1].iso);
  }, [days, onRangeChange]);

  const prev = () => {
    const next = new Date(baseDate);
    if (view === "month") next.setMonth(next.getMonth() - 1);
    else next.setDate(next.getDate() - 7);
    setBaseDate(next);
  };

  const next = () => {
    const n = new Date(baseDate);
    if (view === "month") n.setMonth(n.getMonth() + 1);
    else n.setDate(n.getDate() + 7);
    setBaseDate(n);
  };

  const todayIso = new Date().toISOString().split("T")[0];

  return (
    <Card className={clsx("flex h-full flex-col", className)}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <button type="button" onClick={prev} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-sm font-semibold w-32 text-center text-slate-900 dark:text-white">
            {baseDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </h2>
          <button type="button" onClick={next} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setView("week")}
            className={clsx(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              view === "week" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
            )}
          >
            <CalendarDays size={14} /> Week
          </button>
          <button
            type="button"
            onClick={() => setView("month")}
            className={clsx(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              view === "month" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
            )}
          >
            <CalendarIcon size={14} /> Month
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 dark:border-slate-700/50 dark:bg-slate-700/50">
        <div className="grid grid-cols-7 gap-px">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="bg-slate-50 py-1.5 text-center text-[11px] font-medium text-slate-500 dark:bg-slate-800/80 dark:text-slate-400">
              {day}
            </div>
          ))}
        </div>
        <div className="grid flex-1 auto-rows-fr grid-cols-7 gap-px">
        {days.map((d, i) => {
          const isToday = d.iso === todayIso;
          const isSelected = d.iso === selectedDateStr;
          const count = counts[d.iso] || 0;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectDate(d.iso)}
              className={clsx(
                "relative min-h-[2.75rem] bg-white p-1.5 text-left hover:bg-blue-50 focus:outline-none dark:bg-slate-900 dark:hover:bg-blue-900/20 transition-colors",
                !d.isCurrentMonth && "text-slate-400 dark:text-slate-600 bg-slate-50/50 dark:bg-slate-900/50",
                isSelected && "bg-blue-50/50 ring-1 ring-inset ring-blue-500 dark:bg-blue-500/10 dark:ring-blue-500/50 z-10"
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={clsx(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-medium",
                    isToday ? "bg-blue-600 text-white" : d.isCurrentMonth ? "text-slate-900 dark:text-slate-200" : "text-slate-400 dark:text-slate-600"
                  )}
                >
                  {d.date.getDate()}
                </span>
                {count > 0 && (
                  <span className={clsx("rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums", 
                    isSelected ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                  )}>
                    {count}
                  </span>
                )}
              </div>
            </button>
          );
        })}
        </div>
      </div>
    </Card>
  );
}
