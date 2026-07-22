import type { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds a lift-on-hover treatment for clickable cards. */
  interactive?: boolean;
  padded?: boolean;
  /** The soft blue corner blur. Off by default in dense, multi-card layouts (e.g. the
   * Activity tab) where several cards sit close together and the blurs bleed into each
   * other, reading as a stray gradient smear across the page. */
  glow?: boolean;
}

export function Card({ interactive, padded = true, glow = true, className, children, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        "relative rounded-2xl transition-all duration-300 glass-panel",
        "shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
        "dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]",
        padded && "p-6",
        interactive &&
          "cursor-pointer hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 hover:border-blue-200/50 dark:hover:border-blue-500/30 dark:hover:shadow-[0_20px_40px_rgb(0,0,0,0.4)]",
        className
      )}
      {...props}
    >
      {/* Optional subtle glassmorphism accent in the corner — clipped to its own layer
          rather than the whole card, so dropdowns/popovers in children aren't cut off. */}
      {glow && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
          <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-blue-500/10 blur-[40px] dark:bg-blue-500/20" />
        </div>
      )}

      <div className="relative z-10">
        {children}
      </div>
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

export function CardHeader({ icon, title, subtitle, iconClassName = "bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400", actions }: CardHeaderProps) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        {icon && (
          <span className={clsx("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", iconClassName)}>
            {icon}
          </span>
        )}
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h2>
          {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
