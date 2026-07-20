import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";
import { notifyRepeatEnquiry } from "./repeatEnquiry.service";

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

  const enquiry = await prisma.enquiry.findUnique({ where: { id: enquiryId }, select: { id: true } });
  if (!enquiry) {
    return res.status(404).json({ error: "Enquiry not found" });
  }

  const notified = await notifyRepeatEnquiry(enquiryId, req.user!.id);
  res.json({ notified });
}));

export default router;
