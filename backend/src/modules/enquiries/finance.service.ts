import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { NotFoundError } from "../../lib/errors";
import { FinanceApplicationInput } from "./enquiries.schema";

export async function upsertFinanceApplication(enquiryId: string, input: FinanceApplicationInput) {
  const enquiry = await prisma.enquiry.findUnique({ where: { id: enquiryId } });
  if (!enquiry) throw new NotFoundError("Enquiry not found");

  const approvedAt = input.status === "APPROVED" ? new Date() : undefined;
  const rejectedAt = input.status === "REJECTED" ? new Date() : undefined;

  return prisma.financeApplication.upsert({
    where: { enquiryId },
    create: {
      enquiryId,
      bankOrNbfc: input.bankOrNbfc,
      loanAmount: input.loanAmount,
      status: input.status ?? "NOT_STARTED",
      docsChecklist: (input.docsChecklist ?? {}) as Prisma.InputJsonValue,
      rejectionReason: input.rejectionReason,
      approvedAt,
      rejectedAt,
    },
    update: {
      bankOrNbfc: input.bankOrNbfc,
      loanAmount: input.loanAmount,
      status: input.status,
      docsChecklist: input.docsChecklist as Prisma.InputJsonValue | undefined,
      rejectionReason: input.rejectionReason,
      ...(approvedAt ? { approvedAt } : {}),
      ...(rejectedAt ? { rejectedAt } : {}),
    },
  });
}
