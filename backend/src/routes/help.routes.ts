import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/database";
import { asyncHandler } from "../utils/async-handler";
import { AppError } from "../utils/app-error";
import { authenticate } from "../middlewares/auth";
import { requireAdmin } from "../middlewares/requireRole";
import { validate } from "../middlewares/validate";
import { Priority, TicketStatus } from "@prisma/client";
import { createNotification } from "../services/notification.service";
import { NotificationType } from "@prisma/client";
import { Role } from "@prisma/client";

const router = Router();
router.use(authenticate);

// POST /api/help — STUDENT creates help request
router.post("/", validate(z.object({
  body: z.object({
    topic: z.string().min(2).max(200),
    description: z.string().min(10).max(3000),
    priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  }),
})), asyncHandler(async (req, res) => {
  const body = req.body as { topic: string; description: string; priority: Priority };
  const helpRequest = await prisma.helpRequest.create({
    data: { ...body, studentId: req.user!.id },
  });
  res.status(201).json({ helpRequest });
}));

// GET /api/help — Student: own; Admin: all
router.get("/", asyncHandler(async (req, res) => {
  const user = req.user!;
  const isAdmin = user.role === Role.SUPERADMIN || user.role === Role.ASSISTANT;
  const helpRequests = await prisma.helpRequest.findMany({
    where: isAdmin ? {} : { studentId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      student: { select: { id: true, name: true, email: true, studentCode: true } },
    },
  });
  res.json({ helpRequests });
}));

// GET /api/help/:id
router.get("/:id", validate(z.object({ params: z.object({ id: z.string().min(1) }) })), asyncHandler(async (req, res) => {
  const user = req.user!;
  const isAdmin = user.role === Role.SUPERADMIN || user.role === Role.ASSISTANT;
  const helpRequest = await prisma.helpRequest.findUnique({
    where: { id: req.params.id as string },
    include: { student: { select: { id: true, name: true, email: true } } },
  });
  if (!helpRequest) throw new AppError(404, "Help request not found", "NOT_FOUND");
  if (!isAdmin && helpRequest.studentId !== user.id) throw new AppError(403, "Access denied", "FORBIDDEN");
  res.json({ helpRequest });
}));

// PATCH /api/help/:id/reply — ASSISTANT+ (admin reply)
router.patch("/:id/reply", requireAdmin, validate(z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    adminReply: z.string().min(1).max(3000),
    status: z.nativeEnum(TicketStatus).optional(),
  }),
})), asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  const { adminReply, status } = req.body as { adminReply: string; status?: TicketStatus };
  const helpRequest = await prisma.helpRequest.update({
    where: { id },
    data: {
      adminReply,
      status: status ?? TicketStatus.IN_PROGRESS,
      repliedAt: new Date(),
    },
  });
  await createNotification(
    helpRequest.studentId,
    NotificationType.HELP_RESPONSE,
    `Your help request "${helpRequest.topic}" has received a response.`
  );
  res.json({ helpRequest });
}));

// PATCH /api/help/:id/status — ASSISTANT+
router.patch("/:id/status", requireAdmin, validate(z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ status: z.nativeEnum(TicketStatus) }),
})), asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  const { status } = req.body as { status: TicketStatus };
  const helpRequest = await prisma.helpRequest.update({ where: { id }, data: { status } });
  res.json({ helpRequest });
}));

export default router;
