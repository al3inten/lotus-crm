import type { ReactNode } from "react";
import { AlertTriangle, CalendarClock, Flame, TrendingUp, Car, Wallet, Clock, ClipboardEdit, CheckCircle2 } from "lucide-react";
import type { LeadWithHistory, Enquiry } from "../../../types";
import { DIGITAL_SOURCES } from "../../../types";

const daysBetween = (a: Date, b: Date) => Math.floor((a.getTime() - b.getTime()) / 86_400_000);

export type InsightTone = "urgent" | "warn" | "positive" | "info";
export interface Insight {
  tone: InsightTone;
  icon: ReactNode;
  text: string;
}

export const INSIGHT_TONE: Record<InsightTone, string> = {
  urgent: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300",
  warn: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
  positive: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
  info: "bg-primary-100 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300",
};

export function buildInsights(lead: LeadWithHistory, enquiry: Enquiry): Insight[] {
  const out: Insight[] = [];
  const now = new Date();

  if (enquiry.status !== "CLOSED") {
    if (enquiry.followUpDueAt) {
      const due = new Date(enquiry.followUpDueAt);
      const overdueDays = daysBetween(now, due);
      if (due < now && due.toDateString() !== now.toDateString()) {
        out.push({
          tone: "urgent",
          icon: <AlertTriangle size={14} />,
          text: `Follow-up overdue by ${Math.max(1, overdueDays)} day${overdueDays > 1 ? "s" : ""} — reach out now.`,
        });
      } else if (due.toDateString() === now.toDateString()) {
        out.push({ tone: "warn", icon: <CalendarClock size={14} />, text: "Follow-up is due today." });
      }
    } else {
      out.push({ tone: "warn", icon: <CalendarClock size={14} />, text: "No follow-up scheduled — set one to keep momentum." });
    }
  }

  if (enquiry.enquiryCategory === "HOT") {
    out.push({ tone: "urgent", icon: <Flame size={14} />, text: "High-intent HOT lead — prioritise today." });
  } else if (enquiry.enquiryCategory === "COLD") {
    out.push({ tone: "info", icon: <TrendingUp size={14} />, text: "Cold lead — nurture with value before pushing to book." });
  }

  if (enquiry.testDriveInterested && (enquiry.testDriveFeedbacks?.length ?? 0) === 0) {
    out.push({ tone: "info", icon: <Car size={14} />, text: "Interested in a test drive — schedule one to move forward." });
  }

  if (enquiry.financeRequired && !enquiry.financeApplication) {
    out.push({ tone: "info", icon: <Wallet size={14} />, text: "Finance required — start the finance application." });
  }

  const touchCount = lead.touches.length;
  const channelCount = Object.keys(lead.touchesBySource).length;
  if (touchCount >= 3) {
    out.push({
      tone: "positive",
      icon: <TrendingUp size={14} />,
      text: `Engaged lead — ${touchCount} touches across ${channelCount} channel${channelCount > 1 ? "s" : ""}.`,
    });
  }

  const inStageDays = daysBetween(now, new Date(enquiry.updatedAt));
  if (["UNDER_FOLLOW_UP", "APPOINTMENT_FIXED"].includes(enquiry.status) && inStageDays >= 7) {
    out.push({ tone: "warn", icon: <Clock size={14} />, text: `No stage change for ${inStageDays} days — the deal may be stalling.` });
  }

  if (DIGITAL_SOURCES.includes(enquiry.source) && (!enquiry.department || !enquiry.enquiryCategory)) {
    out.push({ tone: "info", icon: <ClipboardEdit size={14} />, text: "Enrich the enquiry details to improve routing & scoring." });
  }

  if (out.length === 0) {
    out.push({ tone: "positive", icon: <CheckCircle2 size={14} />, text: "This lead is on track — keep the momentum going." });
  }

  return out.slice(0, 5);
}
