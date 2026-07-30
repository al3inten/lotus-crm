import { randomUUID } from "crypto";
import { prisma } from "../../lib/prisma";
import { NotFoundError, ValidationError } from "../../lib/errors";
import { ALLOWED_TRANSITIONS, CONSULTANT_REQUIRED_AT_STATUS, STAGE_RANK, TERMINAL_STATUSES, TRANSACTION_OPTIONS } from "../../config/constants";
import { ChangeStatusInput, ReassignInput, EnquiryDetailsInput, BookingDetailsInput, RetailDetailsInput, RtoDetailsInput, DeliveryDateInput, UpdateKeyDateInput } from "./enquiries.schema";
import { LossReason, CloseReason } from "@prisma/client";

const LOSS_REASON_LABELS: Record<LossReason, string> = {
  LOST_TO_DEALER: "Enquiry - Lost to Dealer",
  BOOKING_CANCEL: "Booking Cancelled",
  RETAIL_CANCEL: "Retail Cancelled",
  OUT_OF_TERRITORY: "Out of Territory",
  NOT_CONTACTABLE: "Not Contactable",
  PRICE_ISSUE: "Price Issue",
  PURCHASED_ANOTHER_BRAND: "Purchased Another Brand",
  OTHER_REASON: "Enquiry - Lost Other Reason",
};

const CLOSE_REASON_LABELS: Record<CloseReason, string> = {
  OUT_OF_TERRITORY: "Out of Territory",
  RNR: "RNR",
  PLAN_DROP: "Plan Drop",
  NOT_INTERESTED: "Not Interested",
  OTHER: "Others",
};

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

    if (input.toStatus === "LOST") {
      if (!input.lossReason) {
        throw new ValidationError("A reason is required to mark this enquiry as Lost.");
      }
      if (input.lossReason === "OTHER_REASON" && !input.lossNote?.trim()) {
        throw new ValidationError("Enter the reason when Other is selected.");
      }
    }

    if (input.toStatus === "CLOSED_TEMP") {
      if (!input.closeReason) {
        throw new ValidationError("A reason is required to close this enquiry temporarily.");
      }
      if (input.closeReason === "OTHER" && !input.closeNote?.trim()) {
        throw new ValidationError("Enter the reason when Others is selected.");
      }
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

    // Leaving Booked for Retail Done requires the finance checklist to be fully resolved when
    // finance was needed — a status change alone must not skip past outstanding paperwork.
    // (The finance fields are saved via updateBookingDetails just before this call, so the
    // enquiry fetched above already reflects whatever the CR just set.)
    if (enquiry.status === "BOOKED" && input.toStatus === "RETAIL_DONE" && enquiry.financeRequired) {
      const financeComplete =
        enquiry.financeDocumentCollected === true &&
        enquiry.financeLoanApproved === true &&
        enquiry.financeDoReceived === true;
      if (!financeComplete) {
        throw new ValidationError(
          "Complete the finance checklist (Documents collected, Loan approved, DO received) before moving to Retail Done."
        );
      }
    }

    // The enquiry must not be marked Delivered (Won) until the details needed for post-sale
    // relationship touches (birthday / anniversary celebrations) are actually captured: the
    // vehicle delivery date and the customer's DOB and job. All three are mandatory gates on
    // the transition itself — collecting them afterward would let the status read "Won"
    // before the CR has actually gathered this information.
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

    // The pipeline only ever moves forward (never back to a follow-up stage), so a
    // followUpDueAt still set when the stage advances is stale — auto-close it rather
    // than let it keep surfacing the enquiry in the Follow-ups queue indefinitely.
    // UNDER_FOLLOW_UP is excluded since that branch below manages followUpDueAt itself.
    const autoClosingFollowUp = input.toStatus !== "UNDER_FOLLOW_UP" && enquiry.followUpDueAt !== null;

    const updated = await tx.enquiry.update({
      where: { id: enquiryId },
      data: {
        status: input.toStatus,
        lossReason: input.toStatus === "LOST" ? input.lossReason : enquiry.lossReason,
        lossNote: input.toStatus === "LOST" ? input.lossNote : enquiry.lossNote,
        closeReason: input.toStatus === "CLOSED_TEMP" ? input.closeReason : enquiry.closeReason,
        closeNote: input.toStatus === "CLOSED_TEMP" ? input.closeNote : enquiry.closeNote,
        followUpDueAt: input.toStatus === "UNDER_FOLLOW_UP"
          ? (input.followUpDueAt ? new Date(input.followUpDueAt) : null)
          : autoClosingFollowUp
            ? null
            : enquiry.followUpDueAt,
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

    // The history row has no dedicated reason columns, so fold the loss/close reason (and
    // its free-text detail) into the note shown on the activity timeline.
    const reasonNote =
      input.toStatus === "LOST" && input.lossReason
        ? `Reason: ${LOSS_REASON_LABELS[input.lossReason]}${input.lossNote ? ` — ${input.lossNote}` : ""}`
        : input.toStatus === "CLOSED_TEMP" && input.closeReason
          ? `Reason: ${CLOSE_REASON_LABELS[input.closeReason]}${input.closeNote ? ` — ${input.closeNote}` : ""}`
          : undefined;

    await tx.enquiryStatusHistory.create({
      data: {
        enquiryId,
        fromStatus: enquiry.status,
        toStatus: input.toStatus,
        changedById,
        note: [input.note, reasonNote].filter(Boolean).join(" | ") || undefined,
      },
    });

    if (autoClosingFollowUp) {
      await tx.comment.create({
        data: {
          enquiryId,
          userId: changedById,
          body: `🔒 Auto-closed follow-up — stage advanced to ${input.toStatus.replace(/_/g, " ")}`,
        },
      });
    }

    return updated;
  }, TRANSACTION_OPTIONS);
}

/**
 * Manually clears a pending follow-up due date without logging a new interaction —
 * for when a CR decides no further follow-up is needed right now. Distinct from
 * addFollowUp's auto-advance/scheduling: this never touches Enquiry.status, and
 * unlike changeStatus's auto-close, it's an explicit user action, not a side effect.
 */
export async function closeFollowUp(enquiryId: string, closedById: string, note?: string) {
  return prisma.$transaction(async (tx) => {
    const enquiry = await tx.enquiry.findUnique({ where: { id: enquiryId } });
    if (!enquiry) throw new NotFoundError("Enquiry not found");
    if (enquiry.followUpDueAt === null) {
      throw new ValidationError("No follow-up is currently pending on this enquiry.");
    }

    const updated = await tx.enquiry.update({
      where: { id: enquiryId },
      data: { followUpDueAt: null },
    });

    await tx.comment.create({
      data: {
        enquiryId,
        userId: closedById,
        body: note ? `🔒 Closed follow-up:\n${note}` : "🔒 Closed follow-up",
      },
    });

    return updated;
  }, TRANSACTION_OPTIONS);
}

// Human-readable labels + date-typed fields for the details-edit audit log below.
const DETAILS_FIELD_LABELS: Record<string, string> = {
  name: "Name",
  email: "Email",
  alternateMobile: "Alternate mobile",
  dob: "Date of birth",
  profession: "Profession",
  pincode: "Pincode",
  area: "Area",
  address: "Address",
  location: "Location",
  carModel: "Vehicle model",
  enquiryType: "Lead type",
  department: "Department",
  sourceCategory: "Source",
  subsource: "Subsource",
  referrerName: "Referrer name",
  referrerPhone: "Referrer mobile",
  variant: "Variant",
  colour: "Colour",
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
const DETAILS_DATE_FIELDS = new Set([
  "dob",
  "appointmentAt",
  "calledDate",
  "bookedAt",
  "retailDoneAt",
  "rtoDoneAt",
  "deliveredAt",
]);

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
    diff("email", lead?.email, input.email);
    diff("alternateMobile", lead?.alternateMobile, input.alternateMobile);
    diff("dob", lead?.dob, input.dob);
    diff("profession", lead?.profession, input.profession);
    diff("pincode", lead?.pincode, input.pincode);
    diff("area", lead?.area, input.area);
    diff("address", lead?.address, input.address);
    diff("location", enquiry.location, input.location);
    diff("carModel", enquiry.carModel, input.carModel);
    diff("enquiryType", enquiry.enquiryType, input.enquiryType);
    diff("department", enquiry.department, input.department);
    diff("sourceCategory", enquiry.sourceCategory, input.sourceCategory);
    diff("subsource", enquiry.subsource, input.subsource);
    diff("referrerName", enquiry.referrerName, input.referrerName);
    diff("referrerPhone", enquiry.referrerPhone, input.referrerPhone);
    diff("variant", enquiry.variant, input.variant);
    diff("colour", enquiry.colour, input.colour);
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
        email: input.email,
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
        carModel: input.carModel,
        enquiryType: input.enquiryType,
        department: input.department,
        sourceCategory: input.sourceCategory,
        subsource: input.subsource,
        referrerName: input.referrerName,
        referrerPhone: input.referrerPhone,
        variant: input.variant,
        colour: input.colour,
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

// Booking-stage details, edited once the enquiry has reached BOOKED (and still editable at any
// later stage): the booking date plus the finance toggle and its three Yes/No checks. When
// finance isn't required the three checks are cleared so stale Yes/No answers don't linger.
export async function updateBookingDetails(enquiryId: string, input: BookingDetailsInput, changedById?: string) {
  return prisma.$transaction(async (tx) => {
    const enquiry = await tx.enquiry.findUnique({ where: { id: enquiryId } });
    if (!enquiry) throw new NotFoundError("Enquiry not found");
    if (STAGE_RANK[enquiry.status] < STAGE_RANK.BOOKED) {
      throw new ValidationError("Booking details can only be set once the enquiry has reached Booked.");
    }

    const financeRequired = input.financeRequired ?? enquiry.financeRequired;

    const changes: string[] = [];
    if (input.bookedAt) {
      const newBookedAt = new Date(input.bookedAt).toISOString();
      if ((enquiry.bookedAt?.toISOString() ?? null) !== newBookedAt) {
        changes.push(`Booked date: ${formatDetailValue("bookedAt", enquiry.bookedAt)} → ${formatDetailValue("bookedAt", input.bookedAt)}`);
      }
    }
    if (input.financeRequired !== undefined && input.financeRequired !== enquiry.financeRequired) {
      changes.push(`Finance required: ${formatDetailValue("financeRequired", enquiry.financeRequired)} → ${formatDetailValue("financeRequired", input.financeRequired)}`);
    }

    const updated = await tx.enquiry.update({
      where: { id: enquiryId },
      data: {
        bookedAt: input.bookedAt ? new Date(input.bookedAt) : enquiry.bookedAt,
        financeRequired,
        financeDocumentCollected: financeRequired ? input.financeDocumentCollected ?? null : null,
        financeLoanApproved: financeRequired ? input.financeLoanApproved ?? null : null,
        financeDoReceived: financeRequired ? input.financeDoReceived ?? null : null,
      },
    });

    if (changes.length > 0 && changedById) {
      await tx.comment.create({
        data: { enquiryId, userId: changedById, body: `✏️ Updated booking details:\n${changes.map((c) => `• ${c}`).join("\n")}` },
      });
    }

    return updated;
  }, TRANSACTION_OPTIONS);
}

// Retail-stage details, edited once the enquiry has reached RETAIL_DONE (and still editable at
// any later stage) — just the retail completion date. The Booked -> Retail Done transition
// itself only stamps this to "now" as a default; the actual date is set/corrected here.
export async function updateRetailDetails(enquiryId: string, input: RetailDetailsInput, changedById?: string) {
  return prisma.$transaction(async (tx) => {
    const enquiry = await tx.enquiry.findUnique({ where: { id: enquiryId } });
    if (!enquiry) throw new NotFoundError("Enquiry not found");
    if (STAGE_RANK[enquiry.status] < STAGE_RANK.RETAIL_DONE) {
      throw new ValidationError("Retail details can only be set once the enquiry has reached Retail Done.");
    }

    const changed = input.retailDoneAt && (enquiry.retailDoneAt?.toISOString() ?? null) !== new Date(input.retailDoneAt).toISOString();

    const updated = await tx.enquiry.update({
      where: { id: enquiryId },
      data: {
        retailDoneAt: input.retailDoneAt ? new Date(input.retailDoneAt) : enquiry.retailDoneAt,
      },
    });

    if (changed && changedById) {
      await tx.comment.create({
        data: {
          enquiryId,
          userId: changedById,
          body: `✏️ Updated retail details:\n• Retail done date: ${formatDetailValue("retailDoneAt", enquiry.retailDoneAt)} → ${formatDetailValue("retailDoneAt", input.retailDoneAt)}`,
        },
      });
    }

    return updated;
  }, TRANSACTION_OPTIONS);
}

// RTO-stage details, edited once the enquiry has reached RTO_DONE (and still editable at any
// later stage) — just the RTO completion date. The Retail Done -> RTO Done transition itself
// only stamps this to "now" as a default; the actual date is set/corrected here.
export async function updateRtoDetails(enquiryId: string, input: RtoDetailsInput, changedById?: string) {
  return prisma.$transaction(async (tx) => {
    const enquiry = await tx.enquiry.findUnique({ where: { id: enquiryId } });
    if (!enquiry) throw new NotFoundError("Enquiry not found");
    if (STAGE_RANK[enquiry.status] < STAGE_RANK.RTO_DONE) {
      throw new ValidationError("RTO details can only be set once the enquiry has reached RTO Done.");
    }

    const dateChanged = input.rtoDoneAt && (enquiry.rtoDoneAt?.toISOString() ?? null) !== new Date(input.rtoDoneAt).toISOString();
    const colourChanged = input.colour !== undefined && input.colour !== (enquiry.colour ?? undefined);

    const updated = await tx.enquiry.update({
      where: { id: enquiryId },
      data: {
        rtoDoneAt: input.rtoDoneAt ? new Date(input.rtoDoneAt) : enquiry.rtoDoneAt,
        colour: input.colour !== undefined ? input.colour : enquiry.colour,
      },
    });

    if ((dateChanged || colourChanged) && changedById) {
      const lines = [
        dateChanged &&
          `• RTO done date: ${formatDetailValue("rtoDoneAt", enquiry.rtoDoneAt)} → ${formatDetailValue("rtoDoneAt", input.rtoDoneAt)}`,
        colourChanged && `• Colour: ${formatDetailValue("colour", enquiry.colour)} → ${formatDetailValue("colour", input.colour)}`,
      ].filter(Boolean);
      await tx.comment.create({
        data: {
          enquiryId,
          userId: changedById,
          body: `✏️ Updated RTO details:\n${lines.join("\n")}`,
        },
      });
    }

    return updated;
  }, TRANSACTION_OPTIONS);
}

// Corrects the delivery date once the enquiry has reached DELIVERED. The date is still
// mandatory to REACH Delivered (see changeStatus) — this only fixes it afterward if entered
// wrong, since Delivered is a terminal stage with no further transition to defer it to.
export async function updateDeliveryDate(enquiryId: string, input: DeliveryDateInput, changedById?: string) {
  return prisma.$transaction(async (tx) => {
    const enquiry = await tx.enquiry.findUnique({ where: { id: enquiryId } });
    if (!enquiry) throw new NotFoundError("Enquiry not found");
    if (enquiry.status !== "DELIVERED") {
      throw new ValidationError("Delivery date can only be corrected once the enquiry is Delivered.");
    }

    const changed = input.deliveredAt && (enquiry.deliveredAt?.toISOString() ?? null) !== new Date(input.deliveredAt).toISOString();

    const updated = await tx.enquiry.update({
      where: { id: enquiryId },
      data: {
        deliveredAt: input.deliveredAt ? new Date(input.deliveredAt) : enquiry.deliveredAt,
      },
    });

    if (changed && changedById) {
      await tx.comment.create({
        data: {
          enquiryId,
          userId: changedById,
          body: `✏️ Updated delivery details:\n• Delivered date: ${formatDetailValue("deliveredAt", enquiry.deliveredAt)} → ${formatDetailValue("deliveredAt", input.deliveredAt)}`,
        },
      });
    }

    return updated;
  }, TRANSACTION_OPTIONS);
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

/**
 * Reassigns the CR who owns this customer (Lead.primaryCrId) — not just the one enquiry.
 * Every enquiry this customer has ever raised moves to the new CR in the same transaction,
 * since a customer only ever has one owning CR. Callers must be SUPER_ADMIN or hold the
 * canReassignCustomerCr role toggle — enforced by requireCustomerReassignRights before this
 * runs (see enquiries.routes.ts).
 */
export async function reassign(enquiryId: string, input: ReassignInput, reassignedById: string) {
  return prisma.$transaction(async (tx) => {
    const enquiry = await tx.enquiry.findUnique({ where: { id: enquiryId } });
    if (!enquiry) throw new NotFoundError("Enquiry not found");

    const toUser = await tx.user.findUnique({
      where: { id: input.toUserId },
      include: { roleDefinition: { select: { restrictLeadsToOwn: true } } },
    });
    if (!toUser) throw new NotFoundError("Target user not found");
    // Same "eligible as a CR" definition the assignment dropdown uses (see
    // users.service.ts isCrEligible) — either their own isCr toggle is on, or the role
    // they hold is itself a CR role (restrictLeadsToOwn), so a CR-role user without the
    // separate isCr flag flipped can still be reassigned leads.
    const isCrEligible = toUser.isCr || (toUser.roleDefinition?.restrictLeadsToOwn ?? false);
    if (!isCrEligible) throw new ValidationError("Target user is not enabled as a consultant/CR.");
    if (toUser.branchId !== enquiry.branchId) {
      throw new ValidationError("Target user must belong to the same branch as the enquiry.");
    }

    const customerEnquiries = await tx.enquiry.findMany({
      where: { leadId: enquiry.leadId },
      select: { id: true, assignedCrId: true },
    });

    await tx.lead.update({ where: { id: enquiry.leadId }, data: { primaryCrId: input.toUserId } });
    await tx.enquiry.updateMany({
      where: { leadId: enquiry.leadId },
      data: { assignedCrId: input.toUserId },
    });

    const batchId = randomUUID();
    await tx.reassignmentLog.createMany({
      data: customerEnquiries.map((e) => ({
        enquiryId: e.id,
        batchId,
        fromUserId: e.assignedCrId,
        toUserId: input.toUserId,
        reassignedById,
        reason: input.reason,
      })),
    });

    return tx.enquiry.findUnique({ where: { id: enquiryId } });
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

    // A closed/delivered enquiry is done — scheduling a next follow-up on it would leave a
    // stale due date that keeps surfacing as "overdue" forever, since nothing ever advances
    // its status again to auto-clear it (see the autoClosingFollowUp logic in changeStatus).
    if (input.nextFollowUpDate && !TERMINAL_STATUSES.includes(enquiry.status)) {
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
