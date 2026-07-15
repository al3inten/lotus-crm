import clsx from "clsx";
import type { KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { Enquiry, EnquiryCategory } from "../../types";
import { Avatar } from "../common/Avatar";

export const CATEGORY_STYLES: Record<EnquiryCategory, string> = {
  HOT: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  WARM: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  COLD: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
};

/** A colored ring around the avatar so temperature reads at a glance while scanning the list. */
export const CATEGORY_RING: Record<EnquiryCategory, string> = {
  HOT: "ring-red-300 dark:ring-red-500/40",
  WARM: "ring-amber-300 dark:ring-amber-500/40",
  COLD: "ring-sky-300 dark:ring-sky-500/40",
};

/** Left-edge accent for lead cards, same temperature language as the ring. */
export const CATEGORY_ACCENT: Record<EnquiryCategory, string> = {
  HOT: "border-l-red-400 dark:border-l-red-500/60",
  WARM: "border-l-amber-400 dark:border-l-amber-500/60",
  COLD: "border-l-sky-400 dark:border-l-sky-500/60",
};

export function AvatarWithTemperature({ name, category, size }: { name: string; category?: EnquiryCategory | null; size: "sm" | "md" }) {
  return (
    <span
      className={clsx(
        "shrink-0 rounded-full",
        category ? clsx("ring-2 ring-offset-1 dark:ring-offset-slate-900", CATEGORY_RING[category]) : undefined
      )}
    >
      <Avatar name={name} size={size} />
    </span>
  );
}

export function CategoryPill({ category }: { category?: EnquiryCategory | null }) {
  if (!category) return <span className="text-xs text-slate-400 dark:text-slate-500">—</span>;
  return (
    <span className={clsx("inline-block rounded-full px-2 py-0.5 text-xs font-medium", CATEGORY_STYLES[category])}>
      {category}
    </span>
  );
}

export function contactsBadge(enquiry: Enquiry) {
  const count = Math.max(enquiry.lead._count?.enquiries ?? 1, enquiry.lead._count?.touches ?? 0);
  if (count > 1) {
    return (
      <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
        ×{count} contacts
      </span>
    );
  }
  return <span className="text-xs text-slate-400 dark:text-slate-500">1st</span>;
}

/** Space/Enter activates a row or card the same way a click would. */
export function onOpenKeyDown(e: KeyboardEvent, leadId: string, open: (leadId: string) => void) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    open(leadId);
  }
}

/**
 * Opens a lead's detail page, carrying the whole visible (filtered/sorted) list along
 * as nav state so the detail page can offer "Next/Prev lead" through exactly what's on
 * screen — shared by the table, mobile cards, and card-grid views.
 */
export function useLeadOpener(enquiries: Enquiry[]) {
  const navigate = useNavigate();
  const queue = enquiries.map((e) => ({ leadId: e.leadId, enquiryId: e.id }));
  return (leadId: string) => navigate(`/leads/${leadId}`, { state: { queue } });
}
