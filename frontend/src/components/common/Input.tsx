import { forwardRef } from "react";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";

interface FieldWrapperProps {
  label?: string;
  error?: string;
  children: React.ReactNode;
}

export function FieldWrapper({ label, error, children }: FieldWrapperProps) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label && <span className="font-semibold text-slate-700 dark:text-slate-300">{label}</span>}
      {children}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string };

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className, ...props }, ref) => (
  <FieldWrapper label={label} error={error}>
    <input
      ref={ref}
      className={clsx(
        "rounded-lg border px-3 py-2.5 text-sm shadow-sm transition-all bg-white text-slate-900 dark:bg-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-500/50",
        error ? "border-red-400 dark:border-red-500/50" : "border-slate-300 dark:border-slate-700",
        className
      )}
      {...props}
    />
  </FieldWrapper>
));
Input.displayName = "Input";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string };

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, error, className, children, ...props }, ref) => (
  <FieldWrapper label={label} error={error}>
    <div className="relative">
      <select
        ref={ref}
        className={clsx(
          "appearance-none w-full rounded-lg border px-3 py-2.5 pr-10 text-sm shadow-sm transition-all bg-white text-slate-900 dark:bg-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-500/50",
          error ? "border-red-400 dark:border-red-500/50" : "border-slate-300 dark:border-slate-700",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  </FieldWrapper>
));
Select.displayName = "Select";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string };

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, error, className, ...props }, ref) => (
  <FieldWrapper label={label} error={error}>
    <textarea
      ref={ref}
      className={clsx(
        "rounded-lg border px-3 py-2.5 text-sm shadow-sm transition-all bg-white text-slate-900 dark:bg-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-500/50",
        error ? "border-red-400 dark:border-red-500/50" : "border-slate-300 dark:border-slate-700",
        className
      )}
      {...props}
    />
  </FieldWrapper>
));
Textarea.displayName = "Textarea";
