import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

/** shadcn-style Badge, using the app's slate/blue palette with dark-mode parity. */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
        neutral:
          "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300",
        success:
          "border-transparent bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
        warning:
          "border-transparent bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
        danger:
          "border-transparent bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
        outline: "border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
