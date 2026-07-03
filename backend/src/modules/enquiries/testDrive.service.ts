import { prisma } from "../../lib/prisma";
import { NotFoundError } from "../../lib/errors";
import { TestDriveInput } from "./enquiries.schema";

export async function upsertTestDrive(enquiryId: string, input: TestDriveInput) {
  const enquiry = await prisma.enquiry.findUnique({ where: { id: enquiryId } });
  if (!enquiry) throw new NotFoundError("Enquiry not found");

  return prisma.testDriveFeedback.upsert({
    where: { enquiryId },
    create: {
      enquiryId,
      conductedById: input.conductedById,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
      completedAt: input.completedAt ? new Date(input.completedAt) : undefined,
      rating: input.rating,
      comments: input.comments,
    },
    update: {
      conductedById: input.conductedById,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
      completedAt: input.completedAt ? new Date(input.completedAt) : undefined,
      rating: input.rating,
      comments: input.comments,
    },
  });
}
