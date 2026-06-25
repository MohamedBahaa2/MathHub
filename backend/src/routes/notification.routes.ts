import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/database";
import { asyncHandler } from "../utils/async-handler";
import { authenticate } from "../middlewares/auth";
import { validate } from "../middlewares/validate";

const router = Router();
router.use(authenticate);

// GET /api/notifications — last 20 for the authenticated user
router.get("/", asyncHandler(async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  const unreadCount = await prisma.notification.count({
    where: { userId: req.user!.id, read: false },
  });
  res.json({ notifications, unreadCount });
}));

// PATCH /api/notifications/:id/read — mark single as read
router.patch("/:id/read", validate(z.object({
  params: z.object({ id: z.string().min(1) }),
})), asyncHandler(async (req, res) => {
  const notification = await prisma.notification.updateMany({
    where: { id: req.params.id as string, userId: req.user!.id },
    data: { read: true },
  });
  res.json({ updated: notification.count });
}));

// PATCH /api/notifications/read-all — mark all as read
router.patch("/read-all", asyncHandler(async (req, res) => {
  const result = await prisma.notification.updateMany({
    where: { userId: req.user!.id, read: false },
    data: { read: true },
  });
  res.json({ updated: result.count });
}));

export default router;
