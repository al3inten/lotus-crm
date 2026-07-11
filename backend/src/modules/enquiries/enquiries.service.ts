import { prisma } from "../../lib/prisma";
import { NotFoundError, ValidationError } from "../../lib/errors";
import { ALLOWED_TRANSITIONS, CONSULTANT_REQUIRED_AT_STATUS, TRANSACTION_OPTIONS } from "../../config/constants";
import { ChangeStatusInput, ReassignInput, EnquiryDetailsInput } from "./enquiries.schema";

export async function getEnquiry(enquiryId: string) {
  const enquiry = await prisma.enquiry.findUnique({
    where: { id: enquiryId },
    include: {
      lead: true,
      branch: true,
      assignedCr: { select: { id: true, name: true } },
      consultant: { select: { id: true, name: true } },
      statusHistory: { orderBy: { createdAt: "asc" }, include: { changedBy: { select: { id: true, name: true } } } },
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

// Fills in the rich intake fields for an enquiry that started lightweight (a digital lead),
// once a CR is assigned and opens it — updates the parent Lead's profile fields and the
// Enquiry's vehicle/appointment/exchange/assignment fields together. Only fields actually
// present in the input are touched, so a CR completing "customer details" today doesn't
// wipe out "exchange car" info someone else fills in tomorrow.
export async function updateEnquiryDetails(enquiryId: string, input: EnquiryDetailsInput) {
  return prisma.$transaction(async (tx) => {
    const enquiry = await tx.enquiry.findUnique({ where: { id: enquiryId } });
    if (!enquiry) throw new NotFoundError("Enquiry not found");

    await tx.lead.update({
      where: { id: enquiry.leadId },
      data: {
        alternateMobile: input.alternateMobile,
        dob: input.dob ? new Date(input.dob) : undefined,
        profession: input.profession,
        pincode: input.pincode,
        address: input.address,
      },
    });

    return tx.enquiry.update({
      where: { id: enquiryId },
      data: {
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
        calledDate: input.calledDate ? new Date(input.calledDate) : undefined,
        remarks: input.remarks,
        // Only reassign the consultant when a non-empty id is provided; undefined leaves it unchanged.
        consultantId: input.consultantId || undefined,
      },
      include: { lead: true },
    });
  }, TRANSACTION_OPTIONS);
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
