import type { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds a lift-on-hover treatment for clickable cards. */
  interactive?: boolean;
  padded?: boolean;
}

export function Card({ interactive, padded = true, className, children, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-gray-200 bg-white shadow-sm",
        padded && "p-5",
        interactive && "cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  /** A lucide icon element — rendered in a tinted square badge. */
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  /** Tailwind classes for the icon badge, e.g. "bg-blue-50 text-blue-600". */
  iconClassName?: string;
  actions?: ReactNode;
}

export function CardHeader({ icon, title, subtitle, iconClassName = "bg-blue-50 text-blue-600", actions }: CardHeaderProps) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        {icon && (
          <span className={clsx("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", iconClassName)}>
            {icon}
          </span>
        )}
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {actions}
    </div>
  );
}

interface StatCardProps {
  icon: ReactNode;
  iconClassName?: string;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}

/** KPI tile: tinted icon badge + label + big value + optional hint/delta line. */
export function StatCard({ icon, iconClassName = "bg-blue-50 text-blue-600", label, value, hint }: StatCardProps) {
  return (
    <Card padded={false} className="p-4">
      <div className="flex items-center gap-3">
        <span className={clsx("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg", iconClassName)}>
          {icon}
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-gray-500">{label}</p>
          <p className="text-2xl font-semibold leading-tight text-gray-900">{value}</p>
          {hint && <div className="text-xs">{hint}</div>}
        </div>
      </div>
    </Card>
  );
}
