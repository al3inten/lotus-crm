import { prisma } from "../../lib/prisma";
import { NotFoundError } from "../../lib/errors";
import { TestDriveInput } from "./enquiries.schema";

/** Each call records a NEW test drive — clients can take several before deciding. */
export async function addTestDrive(enquiryId: string, input: TestDriveInput) {
  const enquiry = await prisma.enquiry.findUnique({ where: { id: enquiryId } });
  if (!enquiry) throw new NotFoundError("Enquiry not found");

  return prisma.testDriveFeedback.create({
    data: {
      enquiryId,
      conductedById: input.conductedById,
      // Snapshot the car for this specific drive — fall back to the enquiry's car when the
      // CR doesn't specify a different one.
      carModel: input.carModel || enquiry.carModel,
      variant: input.variant ?? enquiry.variant ?? undefined,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
      completedAt: input.completedAt ? new Date(input.completedAt) : undefined,
      rating: input.rating,
      comments: input.comments,
    },
  });
}
