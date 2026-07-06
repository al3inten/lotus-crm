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
        "rounded-xl bg-white shadow-sm ring-1 ring-black/5",
        padded && "p-5",
        interactive &&
          "cursor-pointer transition-colors hover:bg-gray-50",
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
