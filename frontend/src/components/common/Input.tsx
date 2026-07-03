import { forwardRef } from "react";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import clsx from "clsx";

interface FieldWrapperProps {
  label?: string;
  error?: string;
  children: React.ReactNode;
}

export function FieldWrapper({ label, error, children }: FieldWrapperProps) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label && <span className="font-medium text-gray-700">{label}</span>}
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
        "rounded-md border px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
        error ? "border-red-400" : "border-gray-300",
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
    <select
      ref={ref}
      className={clsx(
        "rounded-md border bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
        error ? "border-red-400" : "border-gray-300",
        className
      )}
      {...props}
    >
      {children}
    </select>
  </FieldWrapper>
));
Select.displayName = "Select";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string };

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, error, className, ...props }, ref) => (
  <FieldWrapper label={label} error={error}>
    <textarea
      ref={ref}
      className={clsx(
        "rounded-md border px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
        error ? "border-red-400" : "border-gray-300",
        className
      )}
      {...props}
    />
  </FieldWrapper>
));
Textarea.displayName = "Textarea";
