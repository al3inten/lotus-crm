import { prisma } from "../../lib/prisma";

/**
 * Alerts the people who own a returning customer's existing enquiry — the assigned CR
 * plus every branch manager of that branch — so a repeat contact is acted on instead of
 * quietly becoming a duplicate.
 *
 * Extracted from the /notifications/repeat-enquiry route so the same logic can fire
 * automatically when a repeat contact is saved, as well as from the manual button.
 *
 * @param actorId whoever triggered the contact; never notified about their own action.
 * @returns how many people were notified (0 if there's nobody but the actor).
 */
export async function notifyRepeatEnquiry(enquiryId: string, actorId: string): Promise<number> {
  const enquiry = await prisma.enquiry.findUnique({
    where: { id: enquiryId },
    include: { lead: { select: { name: true } }, branch: { select: { id: true, name: true } } },
  });
  if (!enquiry) return 0;

  const managers = enquiry.branchId
    ? await prisma.user.findMany({
        where: { role: "BRANCH_MANAGER", branchId: enquiry.branchId, isActive: true },
        select: { id: true },
      })
    : [];

  const recipientIds = new Set<string>();
  if (enquiry.assignedCrId) recipientIds.add(enquiry.assignedCrId);
  managers.forEach((m) => recipientIds.add(m.id));
  recipientIds.delete(actorId);
  if (recipientIds.size === 0) return 0;

  const actor = await prisma.user.findUnique({ where: { id: actorId }, select: { name: true } });
  const title = "Returning customer contacted again";
  const body = `${enquiry.lead.name} already has an active enquiry (${enquiry.status.replaceAll("_", " ")})${
    enquiry.branch ? ` at ${enquiry.branch.name}` : ""
  } and was contacted again. Raised by ${actor?.name ?? "a colleague"}.`;
  const linkUrl = `/leads/${enquiry.leadId}/enquiries/${enquiry.id}`;

  await prisma.notification.createMany({
    data: [...recipientIds].map((userId) => ({ userId, title, body, linkUrl })),
  });

  return recipientIds.size;
}
