import { prisma } from "../../lib/prisma";
import { NotFoundError } from "../../lib/errors";
import { DeliveryDetailsInput } from "./enquiries.schema";

export async function upsertDeliveryDetails(enquiryId: string, input: DeliveryDetailsInput) {
  const enquiry = await prisma.enquiry.findUnique({ where: { id: enquiryId } });
  if (!enquiry) throw new NotFoundError("Enquiry not found");

  const data = {
    rcTransferDone: input.rcTransferDone,
    insuranceDone: input.insuranceDone,
    accessoriesFitted: input.accessoriesFitted,
    deliveryDate: input.deliveryDate ? new Date(input.deliveryDate) : undefined,
    deliveredAt: input.deliveredAt ? new Date(input.deliveredAt) : undefined,
    notes: input.notes,
  };

  return prisma.deliveryDetails.upsert({
    where: { enquiryId },
    create: { enquiryId, ...data },
    update: data,
  });
}
