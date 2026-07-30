import { Calendar, CheckCircle, ArrowRightCircle, XOctagon } from "lucide-react";
import { Button } from "../common/Button";
import type { EnquiryStatus } from "../../types";

export function QuickActions({
  status,
  onChangeStatus,
  onCloseLost,
}: {
  status: EnquiryStatus;
  onChangeStatus: (targetStatus?: EnquiryStatus) => void;
  /** Opens the status modal pre-set to Lost — falls back to onChangeStatus("LOST") if not
   * provided. */
  onCloseLost?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "UNDER_FOLLOW_UP" && (
        <>
          <Button size="sm" variant="secondary" icon={<Calendar size={14} />} onClick={() => onChangeStatus("APPOINTMENT_FIXED")}>
            Appointment Fixed
          </Button>
          <Button size="sm" variant="secondary" className="text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border-red-200" icon={<XOctagon size={14} />} onClick={() => (onCloseLost ? onCloseLost() : onChangeStatus("LOST"))}>
            Lost
          </Button>
        </>
      )}

      {status === "APPOINTMENT_FIXED" && (
        <>
          <Button size="sm" variant="secondary" icon={<ArrowRightCircle size={14} />} onClick={() => onChangeStatus("TEST_DRIVE")}>
            Test Drive
          </Button>
        </>
      )}

      {status === "TEST_DRIVE" && (
        <>
          <Button size="sm" icon={<CheckCircle size={14} />} onClick={() => onChangeStatus("BOOKED")}>
            Booking
          </Button>
        </>
      )}

      {status === "BOOKED" && (
        <>
          <Button size="sm" icon={<ArrowRightCircle size={14} />} onClick={() => onChangeStatus("RETAIL_DONE")}>
            Retail
          </Button>
        </>
      )}

      {status === "RETAIL_DONE" && (
        <>
          <Button size="sm" icon={<CheckCircle size={14} />} onClick={() => onChangeStatus("DELIVERED")}>
            Win (Delivered)
          </Button>
        </>
      )}

      {/* Fallback for other states like NEW */}
      {status === "NEW" && (
        <>
          <Button size="sm" icon={<ArrowRightCircle size={14} />} onClick={() => onChangeStatus()}>
            Move to Next Stage
          </Button>
        </>
      )}
    </div>
  );
}
