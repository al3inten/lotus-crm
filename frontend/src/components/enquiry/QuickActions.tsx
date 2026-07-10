import { Calendar, CheckCircle, ArrowRightCircle, Phone, XOctagon } from "lucide-react";
import { Button } from "../common/Button";
import type { EnquiryStatus } from "../../types";

export function QuickActions({
  status,
  onAddFollowUp,
  onChangeStatus,
}: {
  status: EnquiryStatus;
  onAddFollowUp: () => void;
  onChangeStatus: (targetStatus?: EnquiryStatus) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "UNDER_FOLLOW_UP" && (
        <>
          <Button size="sm" icon={<Phone size={14} />} onClick={onAddFollowUp}>
            Add Follow-up
          </Button>
          <Button size="sm" variant="secondary" icon={<Calendar size={14} />} onClick={() => onChangeStatus("APPOINTMENT_FIXED")}>
            Appointment Fixed
          </Button>
          <Button size="sm" variant="secondary" className="text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border-red-200" icon={<XOctagon size={14} />} onClick={() => onChangeStatus("CLOSED")}>
            Close (Lost)
          </Button>
        </>
      )}

      {status === "APPOINTMENT_FIXED" && (
        <>
          <Button size="sm" icon={<Phone size={14} />} onClick={onAddFollowUp}>
            Add Follow-up
          </Button>
          <Button size="sm" variant="secondary" icon={<ArrowRightCircle size={14} />} onClick={() => onChangeStatus("TEST_DRIVE")}>
            Test Drive
          </Button>
        </>
      )}

      {status === "TEST_DRIVE" && (
        <>
          <Button size="sm" icon={<CheckCircle size={14} />} onClick={() => onChangeStatus("BOOKED")}>
            Booked
          </Button>
        </>
      )}

      {status === "BOOKED" && (
        <>
          <Button size="sm" icon={<ArrowRightCircle size={14} />} onClick={() => onChangeStatus("RETAIL_DONE")}>
            Retail Done
          </Button>
        </>
      )}

      {status === "RETAIL_DONE" && (
        <>
          <Button size="sm" icon={<CheckCircle size={14} />} onClick={() => onChangeStatus("CLOSED")}>
            Close (Won)
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
