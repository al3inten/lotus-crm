import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";

const router = Router();

router.use(verifyJwt);

// Get unread notifications
router.get("/", asyncHandler(async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.id, isRead: false },
    orderBy: { createdAt: "desc" },
  });
  res.json(notifications);
}));

// Mark a notification as read
router.patch("/:id/read", asyncHandler(async (req, res) => {
  await prisma.notification.update({
    where: { id: req.params.id },
    data: { isRead: true },
  });
  res.json({ success: true });
}));

// Flag a returning customer who already has an active enquiry. Notifies the
// enquiry's assigned CR and the branch manager(s) so they can act on the repeat
// contact instead of a duplicate enquiry being created.
router.post("/repeat-enquiry", asyncHandler(async (req, res) => {
  const enquiryId = (req.body?.enquiryId as string | undefined)?.trim();
  if (!enquiryId) {
    return res.status(400).json({ error: "enquiryId is required" });
  }

  const enquiry = await prisma.enquiry.findUnique({
    where: { id: enquiryId },
    include: { lead: { select: { name: true } }, branch: { select: { id: true, name: true } } },
  });
  if (!enquiry) {
    return res.status(404).json({ error: "Enquiry not found" });
  }

  // Recipients: the CR who owns the enquiry + every branch manager of its branch.
  const managers = enquiry.branchId
    ? await prisma.user.findMany({
        where: { role: "BRANCH_MANAGER", branchId: enquiry.branchId, isActive: true },
        select: { id: true },
      })
    : [];
  const recipientIds = new Set<string>();
  if (enquiry.assignedCrId) recipientIds.add(enquiry.assignedCrId);
  managers.forEach((m) => recipientIds.add(m.id));
  // Don't notify the person who raised the flag.
  recipientIds.delete(req.user!.id);

  if (recipientIds.size === 0) {
    return res.json({ notified: 0 });
  }

  const actor = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { name: true } });
  const title = "Returning customer walked in";
  const body = `${enquiry.lead.name} already has an active enquiry (${enquiry.status.replaceAll("_", " ")})${
    enquiry.branch ? ` at ${enquiry.branch.name}` : ""
  } and was contacted again. Flagged by ${actor?.name ?? "a colleague"}.`;
  const linkUrl = `/leads/${enquiry.leadId}/enquiries/${enquiry.id}`;

  await prisma.notification.createMany({
    data: [...recipientIds].map((userId) => ({ userId, title, body, linkUrl })),
  });

  res.json({ notified: recipientIds.size });
}));

export default router;
