import { HBarList } from "./HBarList";
import type { FunnelStage } from "../../api/reports.api";

const STAGE_LABELS: Record<string, string> = {
  NEW: "New",
  UNDER_FOLLOW_UP: "Under Follow-up",
  APPOINTMENT_FIXED: "Appointment Fixed",
  TEST_DRIVE: "Test Drive",
  BOOKED: "Booked",
  RETAIL_DONE: "Retail Done",
  CLOSED: "Closed",
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
