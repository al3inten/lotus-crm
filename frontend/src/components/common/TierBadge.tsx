import { Gem, Crown, Sprout } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";
import type { CustomerTier } from "../../types";

const TIERS: Record<CustomerTier, { label: string; cls: string; Icon: LucideIcon }> = {
  DIAMOND: {
    label: "Diamond",
    Icon: Gem,
    cls: "bg-cyan-100 text-cyan-700 ring-cyan-200/70 dark:bg-cyan-500/15 dark:text-cyan-300 dark:ring-cyan-500/25",
  },
  GOLD: {
    label: "Gold",
    Icon: Crown,
    cls: "bg-amber-100 text-amber-700 ring-amber-200/70 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/25",
  },
  PROSPECT: {
    label: "Prospect",
    Icon: Sprout,
    cls: "bg-emerald-100 text-emerald-700 ring-emerald-200/70 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/25",
  },
};

export function TierBadge({ tier, size = "md" }: { tier: CustomerTier; size?: "sm" | "md" }) {
  const t = TIERS[tier];
  const { Icon } = t;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full font-semibold ring-1 ring-inset whitespace-nowrap",
        t.cls,
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      )}
    >
      <Icon size={size === "sm" ? 11 : 13} />
      {t.label}
    </span>
  );
}
