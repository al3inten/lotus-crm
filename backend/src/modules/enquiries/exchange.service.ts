import { prisma } from "../../lib/prisma";
import { NotFoundError } from "../../lib/errors";
import { ExchangeEvaluationInput } from "./enquiries.schema";

export async function upsertExchangeEvaluation(enquiryId: string, input: ExchangeEvaluationInput) {
  const enquiry = await prisma.enquiry.findUnique({ where: { id: enquiryId } });
  if (!enquiry) throw new NotFoundError("Enquiry not found");

  return prisma.exchangeEvaluation.upsert({
    where: { enquiryId },
    create: { enquiryId, ...input },
    update: input,
  });
}
