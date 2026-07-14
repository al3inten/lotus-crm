import type { LeadWithHistory, Enquiry } from "../../../types";

const PIPELINE_ORDER = [
  "NEW",
  "UNDER_FOLLOW_UP",
  "APPOINTMENT_FIXED",
  "TEST_DRIVE",
  "BOOKED",
  "RETAIL_DONE",
  "CLOSED",
];

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
