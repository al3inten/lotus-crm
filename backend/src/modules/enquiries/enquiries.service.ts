import { prisma } from "../../lib/prisma";
import { NotFoundError, ValidationError } from "../../lib/errors";
import { ALLOWED_TRANSITIONS, CONSULTANT_REQUIRED_AT_STATUS, TRANSACTION_OPTIONS } from "../../config/constants";
import { ChangeStatusInput, ReassignInput, EnquiryDetailsInput, BookingDetailsInput, UpdateKeyDateInput } from "./enquiries.schema";

export async function getEnquiry(enquiryId: string) {
  const enquiry = await prisma.enquiry.findUnique({
    where: { id: enquiryId },
    include: {
      lead: true,
      branch: true,
      assignedCr: { select: { id: true, name: true } },
      consultant: { select: { id: true, name: true } },
      statusHistory: { orderBy: { createdAt: "asc" }, include: { changedBy: { select: { id: true, name: true } } } },
      dateChangeHistory: { orderBy: { createdAt: "desc" }, include: { changedBy: { select: { id: true, name: true } } } },
      testDriveFeedbacks: { orderBy: { createdAt: "desc" }, include: { conductedBy: { select: { id: true, name: true } } } },
      quotation: true,
      exchangeEvaluation: true,
      financeApplication: true,
      deliveryDetails: true,
      followUps: { orderBy: { createdAt: "desc" }, include: { createdBy: { select: { id: true, name: true } } } },
    },
  });
  if (!enquiry) throw new NotFoundError("Enquiry not found");
  return enquiry;
}

export async function changeStatus(enquiryId: string, input: ChangeStatusInput, changedById: string) {
  return prisma.$transaction(async (tx) => {
    const enquiry = await tx.enquiry.findUnique({ where: { id: enquiryId } });
    if (!enquiry) throw new NotFoundError("Enquiry not found");

    const allowed = ALLOWED_TRANSITIONS[enquiry.status];
    if (!allowed.includes(input.toStatus)) {
      throw new ValidationError(
        `Cannot move enquiry from ${enquiry.status} to ${input.toStatus}. Allowed: ${allowed.join(", ") || "none (terminal state)"}`
      );
    }

    if (input.toStatus === "CLOSED" && input.lossReason === undefined) {
      // It's allowed if they are winning it (no lossReason)
    }

    if (input.toStatus === CONSULTANT_REQUIRED_AT_STATUS && !input.consultantId && !enquiry.consultantId) {
      throw new ValidationError(`consultantId is required when moving to ${CONSULTANT_REQUIRED_AT_STATUS}`);
    }

    // Stamp the date the enquiry reached each milestone (client may pass an explicit date,
    // otherwise "now"), so the pipeline and reports can show when each stage happened.
    const stampNow = (explicit?: string) => (explicit ? new Date(explicit) : new Date());

    // Moving to Test Drive logs the first drive automatically. The CR now picks the drive's
    // date/time and the consultant conducting it; if either is omitted we fall back to the
    // appointment's date and the already-assigned consultant. Further drives (and marking one
    // Done) happen from the Test Drives card.
    if (input.toStatus === "TEST_DRIVE") {
      const conductedById = input.consultantId || enquiry.consultantId;
      if (!conductedById) {
        throw new ValidationError("Select a consultant when moving to Test Drive.");
      }
      await tx.testDriveFeedback.create({
        data: {
          enquiryId,
          conductedById,
          carModel: enquiry.carModel,
          variant: enquiry.variant,
          scheduledAt: input.testDriveScheduledAt
            ? new Date(input.testDriveScheduledAt)
            : enquiry.appointmentAt ?? new Date(),
        },
      });
    }

    // A booking can only happen after the customer has actually taken a test drive — so at
    // least one test drive must be marked Done (has a completion date) before BOOKED.
    if (input.toStatus === "BOOKED") {
      const completedTestDrives = await tx.testDriveFeedback.count({
        where: { enquiryId, completedAt: { not: null } },
      });
      if (completedTestDrives === 0) {
        throw new ValidationError(
          "Mark at least one test drive as Done before moving to Booked."
        );
      }
    }

    // Delivery requires the details needed for post-sale relationship touches (birthday /
    // anniversary celebrations): the vehicle delivery date and the customer's DOB and job.
    if (input.toStatus === "DELIVERED") {
      if (!input.deliveredAt) {
        throw new ValidationError("Vehicle delivery date is required to complete delivery.");
      }
      const lead = await tx.lead.findUnique({ where: { id: enquiry.leadId } });
      if (!lead?.dob) {
        throw new ValidationError("Customer date of birth is required to complete delivery.");
      }
      if (!lead?.profession) {
        throw new ValidationError("Customer job is required to complete delivery.");
      }
    }

    const updated = await tx.enquiry.update({
      where: { id: enquiryId },
      data: {
        status: input.toStatus,
        lossReason: input.toStatus === "CLOSED" ? input.lossReason : enquiry.lossReason,
        lossNote: input.toStatus === "CLOSED" ? input.note : enquiry.lossNote,
        followUpDueAt: input.toStatus === "UNDER_FOLLOW_UP" ? (input.followUpDueAt ? new Date(input.followUpDueAt) : null) : enquiry.followUpDueAt,
        // Capture WHEN the appointment is when fixing it, and flag it as scheduled.
        appointmentAt:
          input.toStatus === "APPOINTMENT_FIXED" && input.appointmentAt ? new Date(input.appointmentAt) : enquiry.appointmentAt,
        appointmentScheduled: input.toStatus === "APPOINTMENT_FIXED" ? true : enquiry.appointmentScheduled,
        // "" means the Assign Consultant dropdown was left on its placeholder — not a real
        // value, so it must not overwrite an already-assigned consultant (|| falls back on
        // "" too, unlike ??, which would otherwise null out the FK and violate the constraint).
        consultantId: input.consultantId || enquiry.consultantId,

        // ── Later-stage milestone dates ── reaching BOOKED stamps the date to "now" as a
        // sensible default; the booking date and finance details are then captured/edited on
        // the Booked stage via updateBookingDetails, not here on the transition.
        bookedAt: input.toStatus === "BOOKED" ? stampNow(input.bookedAt) : enquiry.bookedAt,
        retailDoneAt: input.toStatus === "RETAIL_DONE" ? stampNow(input.retailDoneAt) : enquiry.retailDoneAt,
        rtoDoneAt: input.toStatus === "RTO_DONE" ? stampNow(input.rtoDoneAt) : enquiry.rtoDoneAt,
        deliveredAt: input.toStatus === "DELIVERED" ? stampNow(input.deliveredAt) : enquiry.deliveredAt,
      },
    });

    await tx.enquiryStatusHistory.create({
      data: {
        enquiryId,
        fromStatus: enquiry.status,
        toStatus: input.toStatus,
        changedById,
        note: input.note,
      },
    });

    return updated;
  }, TRANSACTION_OPTIONS);
}

// Human-readable labels + date-typed fields for the details-edit audit log below.
const DETAILS_FIELD_LABELS: Record<string, string> = {
  name: "Name",
  alternateMobile: "Alternate mobile",
  dob: "Date of birth",
  profession: "Profession",
  pincode: "Pincode",
  area: "Area",
  address: "Address",
  location: "Location",
  department: "Department",
  sourceCategory: "Source",
  subsource: "Subsource",
  variant: "Variant",
  enquiryCategory: "Enquiry category",
  financeRequired: "Finance required",
  financeRemarks: "Finance remarks",
  appointmentScheduled: "Appointment scheduled",
  appointmentAt: "Appointment date",
  testDriveInterested: "Test drive interested",
  testDriveCount: "Test drive count",
  exchangeCarModel: "Exchange car model",
  exchangeCarYear: "Exchange car year",
  exchangeCarKms: "Exchange car kms",
  exchangeCarOwners: "Exchange car owners",
  exchangeCarRegNumber: "Exchange car reg. number",
  calledDate: "Called date",
  remarks: "Remarks",
};
const DETAILS_DATE_FIELDS = new Set(["dob", "appointmentAt", "calledDate"]);

function formatDetailValue(field: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (DETAILS_DATE_FIELDS.has(field)) return new Date(value as string | Date).toLocaleDateString();
  if (typeof value === "string") return value.replaceAll("_", " ");
  return String(value);
}

// Fills in the rich intake fields for an enquiry that started lightweight (a digital lead),
// once a CR is assigned and opens it — updates the parent Lead's profile fields and the
// Enquiry's vehicle/appointment/exchange/assignment fields together. Only fields actually
// present in the input are touched, so a CR completing "customer details" today doesn't
// wipe out "exchange car" info someone else fills in tomorrow. Any actual change is logged
// as a comment (visible on the Activity Timeline) so edits are never silent.
export async function updateEnquiryDetails(enquiryId: string, input: EnquiryDetailsInput, changedById?: string) {
  return prisma.$transaction(async (tx) => {
    const enquiry = await tx.enquiry.findUnique({ where: { id: enquiryId } });
    if (!enquiry) throw new NotFoundError("Enquiry not found");
    const lead = await tx.lead.findUnique({ where: { id: enquiry.leadId } });

    const changes: string[] = [];
    const diff = (field: string, oldRaw: unknown, newVal: unknown) => {
      if (newVal === undefined) return;
      const isDate = DETAILS_DATE_FIELDS.has(field);
      const oldComparable = isDate ? (oldRaw ? new Date(oldRaw as string | Date).toISOString() : null) : oldRaw ?? null;
      const newComparable = isDate ? new Date(newVal as string).toISOString() : newVal;
      if (oldComparable !== newComparable) {
        changes.push(`${DETAILS_FIELD_LABELS[field] ?? field}: ${formatDetailValue(field, oldRaw)} → ${formatDetailValue(field, newVal)}`);
      }
    };

    diff("name", lead?.name, input.name);
    diff("alternateMobile", lead?.alternateMobile, input.alternateMobile);
    diff("dob", lead?.dob, input.dob);
    diff("profession", lead?.profession, input.profession);
    diff("pincode", lead?.pincode, input.pincode);
    diff("area", lead?.area, input.area);
    diff("address", lead?.address, input.address);
    diff("location", enquiry.location, input.location);
    diff("department", enquiry.department, input.department);
    diff("sourceCategory", enquiry.sourceCategory, input.sourceCategory);
    diff("subsource", enquiry.subsource, input.subsource);
    diff("variant", enquiry.variant, input.variant);
    diff("enquiryCategory", enquiry.enquiryCategory, input.enquiryCategory);
    diff("financeRequired", enquiry.financeRequired, input.financeRequired);
    diff("financeRemarks", enquiry.financeRemarks, input.financeRemarks);
    diff("appointmentScheduled", enquiry.appointmentScheduled, input.appointmentScheduled);
    diff("appointmentAt", enquiry.appointmentAt, input.appointmentAt);
    diff("testDriveInterested", enquiry.testDriveInterested, input.testDriveInterested);
    diff("testDriveCount", enquiry.testDriveCount, input.testDriveCount);
    diff("exchangeCarModel", enquiry.exchangeCarModel, input.exchangeCarModel);
    diff("exchangeCarYear", enquiry.exchangeCarYear, input.exchangeCarYear);
    diff("exchangeCarKms", enquiry.exchangeCarKms, input.exchangeCarKms);
    diff("exchangeCarOwners", enquiry.exchangeCarOwners, input.exchangeCarOwners);
    diff("exchangeCarRegNumber", enquiry.exchangeCarRegNumber, input.exchangeCarRegNumber);
    diff("calledDate", enquiry.calledDate, input.calledDate);
    diff("remarks", enquiry.remarks, input.remarks);

    await tx.lead.update({
      where: { id: enquiry.leadId },
      data: {
        name: input.name,
        alternateMobile: input.alternateMobile,
        dob: input.dob ? new Date(input.dob) : undefined,
        profession: input.profession,
        pincode: input.pincode,
        area: input.area,
        address: input.address,
      },
    });

    const updated = await tx.enquiry.update({
      where: { id: enquiryId },
      data: {
        location: input.location,
        department: input.department,
        sourceCategory: input.sourceCategory,
        subsource: input.subsource,
        variant: input.variant,
        enquiryCategory: input.enquiryCategory,
        financeRequired: input.financeRequired,
        financeRemarks: input.financeRemarks,
        appointmentScheduled: input.appointmentScheduled,
        appointmentAt: input.appointmentAt ? new Date(input.appointmentAt) : undefined,
        testDriveInterested: input.testDriveInterested,
        testDriveCount: input.testDriveCount,
        exchangeCarModel: input.exchangeCarModel,
        exchangeCarYear: input.exchangeCarYear,
        exchangeCarKms: input.exchangeCarKms,
        exchangeCarOwners: input.exchangeCarOwners,
        exchangeCarRegNumber: input.exchangeCarRegNumber,
        calledDate: input.calledDate ? new Date(input.calledDate) : undefined,
        remarks: input.remarks,
        // Only reassign the consultant when a non-empty id is provided; undefined leaves it unchanged.
        consultantId: input.consultantId || undefined,
      },
      include: { lead: true },
    });

    if (changes.length > 0 && changedById) {
      await tx.comment.create({
        data: {
          enquiryId,
          userId: changedById,
          body: `✏️ Updated details:\n${changes.map((c) => `• ${c}`).join("\n")}`,
        },
      });
    }

    return updated;
  }, TRANSACTION_OPTIONS);
}

// Booking-stage details, edited while the enquiry sits at BOOKED: the booking date plus the
// finance toggle and its three Yes/No checks. When finance isn't required the three checks are
// cleared so stale Yes/No answers don't linger (same rule the old transition modal applied).
export async function updateBookingDetails(enquiryId: string, input: BookingDetailsInput) {
  const enquiry = await prisma.enquiry.findUnique({ where: { id: enquiryId } });
  if (!enquiry) throw new NotFoundError("Enquiry not found");
  if (enquiry.status !== "BOOKED") {
    throw new ValidationError("Booking details can only be set while the enquiry is Booked.");
  }

  const financeRequired = input.financeRequired ?? enquiry.financeRequired;

  return prisma.enquiry.update({
    where: { id: enquiryId },
    data: {
      bookedAt: input.bookedAt ? new Date(input.bookedAt) : enquiry.bookedAt,
      financeRequired,
      financeDocumentCollected: financeRequired ? input.financeDocumentCollected ?? null : null,
      financeLoanApproved: financeRequired ? input.financeLoanApproved ?? null : null,
      financeDoReceived: financeRequired ? input.financeDoReceived ?? null : null,
    },
  });
}

/**
 * Corrects a pipeline milestone date after the fact (a booking entered on the wrong day, an
 * appointment that actually happened later, …). The enquiry keeps only the current value, so
 * every edit also writes a DateChangeHistory row carrying the old value and the mandatory
 * reason — that audit trail is the whole point of editing dates here rather than in the DB.
 *
 * TEST_DRIVE_SCHEDULED_AT lives on the most recent TestDriveFeedback rather than the enquiry.
 */
export async function updateKeyDate(enquiryId: string, input: UpdateKeyDateInput, changedById: string) {
  await prisma.$transaction(async (tx) => {
    const enquiry = await tx.enquiry.findUnique({ where: { id: enquiryId } });
    if (!enquiry) throw new NotFoundError("Enquiry not found");

    const newValue = new Date(input.date);
    let oldValue: Date | null;

    if (input.field === "TEST_DRIVE_SCHEDULED_AT") {
      const testDrive = await tx.testDriveFeedback.findFirst({
        where: { enquiryId },
        orderBy: { createdAt: "desc" },
      });
      if (!testDrive) throw new ValidationError("This enquiry has no test drive to reschedule.");
      oldValue = testDrive.scheduledAt;
      await tx.testDriveFeedback.update({ where: { id: testDrive.id }, data: { scheduledAt: newValue } });
    } else {
      const column = {
        APPOINTMENT_AT: "appointmentAt",
        BOOKED_AT: "bookedAt",
        RETAIL_DONE_AT: "retailDoneAt",
      }[input.field] as "appointmentAt" | "bookedAt" | "retailDoneAt";

      oldValue = enquiry[column];
      await tx.enquiry.update({
        where: { id: enquiryId },
        // Setting an appointment date implies the appointment exists — otherwise the detail
        // page would keep showing "not scheduled" next to a date the CR just entered.
        data: { [column]: newValue, ...(column === "appointmentAt" ? { appointmentScheduled: true } : {}) },
      });
    }

    await tx.dateChangeHistory.create({
      data: { enquiryId, field: input.field, oldValue, newValue, reason: input.reason, changedById },
    });
  }, TRANSACTION_OPTIONS);

  // Read back outside the transaction — getEnquiry uses the shared client, so calling it
  // from inside would return the pre-commit state.
  return getEnquiry(enquiryId);
}

export async function reassign(enquiryId: string, input: ReassignInput, reassignedById: string) {
  return prisma.$transaction(async (tx) => {
    const enquiry = await tx.enquiry.findUnique({ where: { id: enquiryId } });
    if (!enquiry) throw new NotFoundError("Enquiry not found");

    const toUser = await tx.user.findUnique({ where: { id: input.toUserId } });
    if (!toUser) throw new NotFoundError("Target user not found");

    const updated = await tx.enquiry.update({
      where: { id: enquiryId },
      data: { assignedCrId: input.toUserId },
    });

    await tx.reassignmentLog.create({
      data: {
        enquiryId,
        fromUserId: enquiry.assignedCrId,
        toUserId: input.toUserId,
        reassignedById,
        reason: input.reason,
      },
    });

    return updated;
  }, TRANSACTION_OPTIONS);
}

import { CreateFollowUpInput } from "./enquiries.schema";

export async function addFollowUp(enquiryId: string, input: CreateFollowUpInput, createdById: string) {
  return prisma.$transaction(async (tx) => {
    const enquiry = await tx.enquiry.findUnique({ where: { id: enquiryId } });
    if (!enquiry) throw new NotFoundError("Enquiry not found");

    const followUp = await tx.followUp.create({
      data: {
        enquiryId,
        createdById,
        followUpDate: new Date(input.followUpDate),
        followUpTime: input.followUpTime,
        type: input.type,
        remark: input.remark,
        nextFollowUpDate: input.nextFollowUpDate ? new Date(input.nextFollowUpDate) : undefined,
        nextFollowUpTime: input.nextFollowUpTime,
      },
      include: { createdBy: { select: { id: true, name: true } } },
    });

    if (input.nextFollowUpDate) {
      await tx.enquiry.update({
        where: { id: enquiryId },
        data: { followUpDueAt: new Date(input.nextFollowUpDate) },
      });
    }

    // Logging the first follow-up on a brand-new lead moves it into the follow-up
    // stage automatically — the act of following up *is* the transition.
    if (enquiry.status === "NEW") {
      await tx.enquiry.update({ where: { id: enquiryId }, data: { status: "UNDER_FOLLOW_UP" } });
      await tx.enquiryStatusHistory.create({
        data: {
          enquiryId,
          fromStatus: "NEW",
          toStatus: "UNDER_FOLLOW_UP",
          changedById: createdById,
          note: "Auto-advanced to Under Follow-up on first follow-up",
        },
      });
    }

    return followUp;
  }, TRANSACTION_OPTIONS);
}
