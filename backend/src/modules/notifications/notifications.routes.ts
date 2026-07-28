import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { applyBranchScope } from "../../middleware/branchScope";
import { prisma } from "../../lib/prisma";
import { notifyRepeatEnquiry } from "./repeatEnquiry.service";
import { getRemindersForUser } from "./reminders.service";

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

// Live "reminders for today" — follow-ups due today + customer birthdays + delivery
// anniversaries. Computed on the fly (not stored), scoped to what the user can see.
router.get("/reminders", applyBranchScope, asyncHandler(async (req, res) => {
  const reminders = await getRemindersForUser({
    userId: req.user!.id,
    role: req.user!.role,
    restrictLeadsToOwn: req.user!.restrictLeadsToOwn,
    branchFilter: req.branchFilter,
  });
  res.json(reminders);
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
