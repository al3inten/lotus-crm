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

export default router;
