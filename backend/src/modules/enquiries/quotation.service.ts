import { prisma } from "../../lib/prisma";
import { NotFoundError } from "../../lib/errors";
import { QuotationInput } from "./enquiries.schema";

export async function upsertQuotation(enquiryId: string, input: QuotationInput) {
  const enquiry = await prisma.enquiry.findUnique({ where: { id: enquiryId } });
  if (!enquiry) throw new NotFoundError("Enquiry not found");

  return prisma.quotation.upsert({
    where: { enquiryId },
    create: {
      enquiryId,
      quotedById: input.quotedById,
      variant: input.variant,
      onRoadPrice: input.onRoadPrice,
      discount: input.discount,
      finalPrice: input.finalPrice,
      validUntil: input.validUntil ? new Date(input.validUntil) : undefined,
      pdfUrl: input.pdfUrl,
    },
    update: {
      quotedById: input.quotedById,
      variant: input.variant,
      onRoadPrice: input.onRoadPrice,
      discount: input.discount,
      finalPrice: input.finalPrice,
      validUntil: input.validUntil ? new Date(input.validUntil) : undefined,
      pdfUrl: input.pdfUrl,
    },
  });
}
