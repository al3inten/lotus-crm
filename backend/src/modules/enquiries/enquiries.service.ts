import { prisma } from "../../lib/prisma";
import { NotFoundError, ValidationError } from "../../lib/errors";
import { ALLOWED_TRANSITIONS, CONSULTANT_REQUIRED_AT_STATUS, TRANSACTION_OPTIONS } from "../../config/constants";
import { ChangeStatusInput, ReassignInput } from "./enquiries.schema";

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

    if (input.toStatus === "LOST" && !input.lossReason) {
      throw new ValidationError("lossReason is required when moving an enquiry to LOST");
    }

    if (input.toStatus === CONSULTANT_REQUIRED_AT_STATUS && !input.consultantId && !enquiry.consultantId) {
      throw new ValidationError(`consultantId is required when moving to ${CONSULTANT_REQUIRED_AT_STATUS}`);
    }

    const updated = await tx.enquiry.update({
      where: { id: enquiryId },
      data: {
        status: input.toStatus,
        lossReason: input.toStatus === "LOST" ? input.lossReason : enquiry.lossReason,
        lossNote: input.toStatus === "LOST" ? input.note : enquiry.lossNote,
        followUpDueAt: input.toStatus === "FOLLOW_UP" ? (input.followUpDueAt ? new Date(input.followUpDueAt) : null) : enquiry.followUpDueAt,
        consultantId: input.consultantId ?? enquiry.consultantId,
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
