import { prisma } from "../../lib/prisma";
import { NotFoundError } from "../../lib/errors";
import type { CreateNoteInput } from "./enquiries.schema";

/**
 * Private per-user notes on an enquiry. Unlike Comment — which the whole team reads and
 * which can notify mentioned people — a note is only ever visible to its author, so both
 * functions here scope by authorId rather than leaving that to the caller.
 */
export async function getNotes(enquiryId: string, authorId: string) {
  return prisma.enquiryNote.findMany({
    where: { enquiryId, authorId },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { id: true, name: true } } },
  });
}

export async function addNote(enquiryId: string, authorId: string, data: CreateNoteInput) {
  const enquiry = await prisma.enquiry.findUnique({ where: { id: enquiryId }, select: { id: true } });
  if (!enquiry) throw new NotFoundError("Enquiry not found");

  return prisma.enquiryNote.create({
    data: { enquiryId, authorId, body: data.body },
    include: { author: { select: { id: true, name: true } } },
  });
}
