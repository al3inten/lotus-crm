import type { ReactNode } from "react";
import {
  Sparkles,
  AlertTriangle,
  CalendarClock,
  Flame,
  TrendingUp,
  Car,
  Wallet,
  ClipboardEdit,
  CheckCircle2,
  Clock,
  Layers,
  MessagesSquare,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";
import type { EnquiryStatus, Enquiry, LeadWithHistory } from "../../../types";
import { DIGITAL_SOURCES } from "../../../types";

/** Same condition the API uses to gate reassignment (requireCustomerReassignRights) —
 * SUPER_ADMIN always can; everyone else needs their role's canReassignCustomerCr toggle. */
export function canReassignLeads(user: { role: string; canReassignCustomerCr: boolean } | null | undefined) {
  if (!user) return false;
  return user.role === "SUPER_ADMIN" || user.canReassignCustomerCr;
}

export const PIPELINE_ORDER: EnquiryStatus[] = [
  "NEW",
  "UNDER_FOLLOW_UP",
  "APPOINTMENT_FIXED",
  "TEST_DRIVE",
  "BOOKED",
  "RETAIL_DONE",
  "LOST",
];

export const TERMINAL_STATUSES: EnquiryStatus[] = ["DELIVERED", "CLOSED_TEMP", "LOST"];

export const toDateInput = (iso?: string | null) => (iso ? iso.slice(0, 10) : undefined);
export const toDatetimeLocalInput = (iso?: string | null) => (iso ? iso.slice(0, 16) : undefined);

export const daysBetween = (a: Date, b: Date) => Math.floor((a.getTime() - b.getTime()) / 86_400_000);

export type DetailTab = "forms" | "activity" | "details";
export const DETAIL_TAB_LABELS: Record<DetailTab, string> = {
  forms: "Pipeline & Forms",
  activity: "Activity",
  details: "Details & Contact",
};
export const DETAIL_TAB_ICONS: Record<DetailTab, LucideIcon> = {
  forms: Layers,
  activity: MessagesSquare,
  details: CalendarDays,
};

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

export type Mood = "blue" | "emerald" | "red";
export type MoodStyle = { base: string; blobA: string; blobB: string; blobC: string; border: string; glow: string };
export const MOOD_STYLES: Record<Mood, MoodStyle> = {
  blue: {
    base: "bg-slate-900",
    blobA: "bg-primary-500",
    blobB: "bg-sky-400",
    blobC: "bg-violet-500",
    border: "border-l-primary-500",
    glow: "shadow-[0_30px_80px_-25px_rgba(79,70,229,0.5)] dark:shadow-[0_30px_80px_-25px_rgba(79,70,229,0.35)]",
  },
  emerald: {
    base: "bg-slate-900",
    blobA: "bg-emerald-400",
    blobB: "bg-teal-400",
    blobC: "bg-cyan-400",
    border: "border-l-emerald-500",
    glow: "shadow-[0_30px_80px_-25px_rgba(5,150,105,0.5)] dark:shadow-[0_30px_80px_-25px_rgba(5,150,105,0.35)]",
  },
  red: {
    base: "bg-slate-900",
    blobA: "bg-rose-500",
    blobB: "bg-orange-400",
    blobC: "bg-red-500",
    border: "border-l-red-500",
    glow: "shadow-[0_30px_80px_-25px_rgba(225,29,72,0.5)] dark:shadow-[0_30px_80px_-25px_rgba(225,29,72,0.35)]",
  },
};

export function moodOf(enquiry?: Enquiry): Mood {
  if (!enquiry) return "blue";
  if (enquiry.status === "DELIVERED") return "emerald";
  if (enquiry.status === "LOST" || enquiry.status === "CLOSED_TEMP") return "red";
  return "blue";
}

export function buildInsights(lead: LeadWithHistory, enquiry: Enquiry): Insight[] {
  const out: Insight[] = [];
  const now = new Date();

  if (enquiry.status === "RETAIL_DONE") {
    out.push({
      tone: "positive",
      icon: <Sparkles size={14} />,
      text: "Retail is complete! Move it through RTO and Delivered to finalise this deal.",
    });
  }

  if (enquiry.status !== "CLOSED_TEMP" && enquiry.status !== "LOST") {
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

export function computeLeadScore(lead: LeadWithHistory, enquiry: Enquiry): number {
  let score =
    enquiry.enquiryCategory === "HOT" ? 45 : enquiry.enquiryCategory === "WARM" ? 30 : enquiry.enquiryCategory === "COLD" ? 15 : 25;

  const stageIdx = Math.min(PIPELINE_ORDER.indexOf(enquiry.status), 5);
  if (stageIdx > 0) score += stageIdx * 6;
  score += Math.min(lead.touches.length, 5) * 3;
  if (enquiry.testDriveInterested) score += 5;
  if (enquiry.appointmentScheduled) score += 5;

  if (enquiry.followUpDueAt) {
    const due = new Date(enquiry.followUpDueAt);
    const now = new Date();
    if (due < now && due.toDateString() !== now.toDateString()) score -= 10;
  }

  return Math.max(5, Math.min(100, Math.round(score)));
}

export function scoreTier(score: number): { color: string; glow: string; text: string } {
  if (score >= 70) return { color: "#0d9488", glow: "rgba(16,185,129,0.45)", text: "text-teal-600 dark:text-teal-400" };
  if (score >= 45) return { color: "#4f46e5", glow: "rgba(59,130,246,0.45)", text: "text-primary-600 dark:text-primary-400" };
  if (score >= 25) return { color: "#ea580c", glow: "rgba(217,119,6,0.45)", text: "text-orange-600 dark:text-orange-400" };
  return { color: "#dc2626", glow: "rgba(220,38,38,0.45)", text: "text-red-600 dark:text-red-400" };
}
