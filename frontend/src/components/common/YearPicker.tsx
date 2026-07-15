import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { FieldWrapper } from "./Input";

interface YearPickerProps {
  label?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  value?: number | string;
  onChange: (year: number | undefined) => void;
  onBlur?: () => void;
  minYear?: number;
  maxYear?: number;
  disabled?: boolean;
}

const DECADE_SIZE = 12;

/** Modern year picker: a calendar-style popover showing a 12-year grid with decade
 * navigation, so picking a car's model year doesn't rely on a native number spinner.
 * The panel is portaled to <body> and positioned from the trigger's bounding rect —
 * otherwise it gets clipped by any scrollable ancestor (e.g. the Add Lead modal body). */
export function YearPicker({
  label,
  error,
  required,
  placeholder = "Select year",
  value,
  onChange,
  onBlur,
  minYear = 1980,
  maxYear = new Date().getFullYear() + 1,
  disabled,
}: YearPickerProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const numericValue = value === undefined || value === "" ? undefined : Number(value);
  const [decadeStart, setDecadeStart] = useState(() => {
    const base = numericValue ?? new Date().getFullYear();
    return base - (base % DECADE_SIZE);
  });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const thisYear = new Date().getFullYear();

  const close = () => {
    setOpen(false);
    onBlur?.();
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      close();
    };
    // Scroll events don't bubble, so listen in the capture phase to catch scrolling
    // inside the modal body (or anywhere else) and reposition/close accordingly.
    const onScroll = () => close();
    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const openPicker = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) setPos({ top: rect.bottom + 6, left: rect.left, width: rect.width });
    setDecadeStart((numericValue ?? thisYear) - ((numericValue ?? thisYear) % DECADE_SIZE));
    setOpen(true);
  };

  const years = Array.from({ length: DECADE_SIZE }, (_, i) => decadeStart + i);

  const commit = (year: number) => {
    onChange(year);
    close();
  };

  return (
    <FieldWrapper label={label} error={error} required={required}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => (open ? close() : openPicker())}
        className={clsx(
          "flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm shadow-sm transition-all bg-white dark:bg-slate-950",
          error ? "border-red-400 dark:border-red-500/50" : "border-slate-300 dark:border-slate-700",
          open && "ring-2 ring-blue-500/50",
          disabled && "cursor-not-allowed opacity-60"
        )}
      >
        <Calendar size={14} className="shrink-0 text-slate-400" />
        <span className={clsx("flex-1", numericValue ? "text-slate-900 dark:text-white" : "text-slate-400")}>
          {numericValue ?? placeholder}
        </span>
      </button>

      {open &&
        !disabled &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            style={{ position: "fixed", top: pos.top, left: pos.left, width: Math.max(pos.width, 240) }}
            className="z-[60] rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="mb-1.5 flex items-center justify-between px-1">
              <button
                type="button"
                onClick={() => setDecadeStart((d) => d - DECADE_SIZE)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                aria-label="Previous decade"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {decadeStart} – {decadeStart + DECADE_SIZE - 1}
              </span>
              <button
                type="button"
                onClick={() => setDecadeStart((d) => d + DECADE_SIZE)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                aria-label="Next decade"
              >
                <ChevronRight size={15} />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {years.map((y) => {
                const isOutOfRange = y < minYear || y > maxYear;
                const isSelected = y === numericValue;
                const isCurrent = y === thisYear;
                return (
                  <button
                    key={y}
                    type="button"
                    disabled={isOutOfRange}
                    onClick={() => commit(y)}
                    className={clsx(
                      "rounded-lg px-2 py-1.5 text-sm font-medium tabular-nums transition-colors",
                      isSelected
                        ? "bg-blue-600 text-white shadow-sm"
                        : isOutOfRange
                          ? "text-slate-300 dark:text-slate-700"
                          : isCurrent
                            ? "text-blue-600 ring-1 ring-inset ring-blue-300 dark:text-blue-400 dark:ring-blue-500/40"
                            : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    )}
                  >
                    {y}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </FieldWrapper>
  );
}
