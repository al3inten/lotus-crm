import clsx from "clsx";
import type { KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { Enquiry, EnquiryCategory } from "../../types";
import { Avatar } from "../common/Avatar";

/** Single primary-blue family throughout — temperature reads via intensity (HOT
 * darkest/strongest, COLD lightest) rather than switching hues. */
export const CATEGORY_STYLES: Record<EnquiryCategory, string> = {
  HOT: "bg-primary-600 text-white dark:bg-primary-500 dark:text-white",
  WARM: "bg-primary-100 text-primary-700 dark:bg-primary-500/25 dark:text-primary-300",
  COLD: "bg-primary-50 text-primary-500 dark:bg-primary-500/10 dark:text-primary-400",
};

/** `source` (LeadSource) is a system/automation field — it's WALK_IN for every enquiry
 * entered manually through the CRM, regardless of what the CR actually picked, because it
 * only distinguishes manual entry from integration channels (Meta Ads, WhatsApp, ...) for
 * webhook/auto-dial logic. The client-facing source the CR selected lives in
 * subsource/sourceCategory, so prefer those for display and only fall back to `source` for
 * leads that came in through an integration (which don't have a sourceCategory). */
export function leadSourceLabel(enquiry: Enquiry): string {
  const label = enquiry.subsource || enquiry.sourceCategory || enquiry.source;
  return label.replaceAll("_", " ");
}

/** A colored ring around the avatar so temperature reads at a glance while scanning the list. */
export const CATEGORY_RING: Record<EnquiryCategory, string> = {
  HOT: "ring-primary-500 dark:ring-primary-400/60",
  WARM: "ring-primary-300 dark:ring-primary-500/40",
  COLD: "ring-primary-200 dark:ring-primary-500/25",
};

/** Left-edge accent for lead cards, same temperature language as the ring. */
export const CATEGORY_ACCENT: Record<EnquiryCategory, string> = {
  HOT: "border-l-primary-600 dark:border-l-primary-400",
  WARM: "border-l-primary-300 dark:border-l-primary-500/50",
  COLD: "border-l-primary-100 dark:border-l-primary-500/25",
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
      <span className="inline-block rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-500/20 dark:text-primary-300">
        Existing Customer
      </span>
    );
  }
  return <span className="text-xs text-slate-400 dark:text-slate-500">New Enquiry</span>;
}

export type FollowUpUrgency = "overdue" | "today" | "future" | null;

/** Shared with the kanban board's card urgency logic — kept here too so the table
 * view can surface the same "overdue / due today" signal without duplicating dates. */
export function getFollowUpUrgency(iso?: string | null): FollowUpUrgency {
  if (!iso) return null;
  const due = new Date(iso);
  const now = new Date();
  if (due < now && due.toDateString() !== now.toDateString()) return "overdue";
  if (due.toDateString() === now.toDateString()) return "today";
  return "future";
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
