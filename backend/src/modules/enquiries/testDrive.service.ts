import { prisma } from "../../lib/prisma";
import { NotFoundError } from "../../lib/errors";
import { TestDriveInput, UpdateTestDriveInput } from "./enquiries.schema";

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
      // completedAt present ⇒ the drive is Done; absent ⇒ it's just scheduled ("Not done").
      completedAt: input.completedAt ? new Date(input.completedAt) : undefined,
      address: input.address,
      rating: input.rating,
      comments: input.comments,
    },
  });
}

/**
 * Marks a scheduled test drive as done (or edits an existing one): sets the completion
 * date and the consultant's feedback. Used by the "Mark as done" action so a fixed test
 * drive can be closed out with a rating/comments once it actually happens.
 */
export async function updateTestDrive(enquiryId: string, testDriveId: string, input: UpdateTestDriveInput) {
  const testDrive = await prisma.testDriveFeedback.findUnique({ where: { id: testDriveId } });
  if (!testDrive || testDrive.enquiryId !== enquiryId) throw new NotFoundError("Test drive not found");

  return prisma.testDriveFeedback.update({
    where: { id: testDriveId },
    data: {
      completedAt: input.completedAt ? new Date(input.completedAt) : testDrive.completedAt,
      address: input.address ?? testDrive.address,
      rating: input.rating ?? testDrive.rating,
      comments: input.comments ?? testDrive.comments,
    },
  });
}
