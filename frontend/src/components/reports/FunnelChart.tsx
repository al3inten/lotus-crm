import { HBarList } from "./HBarList";
import type { FunnelStage } from "../../api/reports.api";

const STAGE_LABELS: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  APPOINTMENT_SCHEDULED: "Appointment",
  TEST_DRIVE_DONE: "Test Drive",
  FEEDBACK_COLLECTED: "Feedback",
  QUOTATION_SHARED: "Quotation",
  NEGOTIATION: "Negotiation",
  BOOKING_CONFIRMED: "Booking",
  SALE_CLOSED: "Sale Closed",
  DELIVERED: "Delivered",
};

export function FunnelChart({ stages }: { stages: FunnelStage[] }) {
  const max = Math.max(1, ...stages.map((s) => s.reached));

  return (
    <HBarList
      rows={stages.map((s) => ({
        label: STAGE_LABELS[s.stage] ?? s.stage,
        value: s.reached,
        fraction: s.reached / max,
        valueLabel: `${s.reached.toLocaleString()} (${s.percentOfTotal}%)`,
      }))}
    />
  );
}
