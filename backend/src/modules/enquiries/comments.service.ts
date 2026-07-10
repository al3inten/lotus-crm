import { prisma } from "../../lib/prisma";
import type { CreateCommentInput } from "./enquiries.schema";
import { NotFoundError } from "../../lib/errors";

export async function addComment(enquiryId: string, authorId: string, data: CreateCommentInput) {
  const enquiry = await prisma.enquiry.findUnique({
    where: { id: enquiryId },
    select: { id: true, leadId: true, lead: { select: { name: true } } },
  });
  if (!enquiry) throw new NotFoundError("Enquiry not found");

  const author = await prisma.user.findUnique({
    where: { id: authorId },
    select: { name: true },
  });

  const comment = await prisma.comment.create({
    data: {
      enquiryId,
      userId: authorId,
      body: data.body,
    },
    include: {
      user: { select: { id: true, name: true, role: true } }
    }
  });

  if (data.mentionedUserIds && data.mentionedUserIds.length > 0) {
    const notifications = data.mentionedUserIds.map((userId) => ({
      userId,
      title: "New Mention",
      body: `${author?.name} mentioned you on ${enquiry.lead.name}'s enquiry.`,
      linkUrl: `/leads/${enquiry.leadId}`,
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications,
      });
    }
  }

  return comment;
}

export async function getComments(enquiryId: string) {
  return prisma.comment.findMany({
    where: { enquiryId },
    include: {
      user: { select: { id: true, name: true, role: true } }
    },
    orderBy: { createdAt: "asc" },
  });
}
