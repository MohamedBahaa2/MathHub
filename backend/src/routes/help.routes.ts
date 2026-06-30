import path from "node:path";
import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import { prisma } from "../config/database";
import { asyncHandler } from "../utils/async-handler";
import { AppError } from "../utils/app-error";
import { authenticate } from "../middlewares/auth";
import { requireAdmin } from "../middlewares/requireRole";
import { validate } from "../middlewares/validate";
import { Priority, TicketStatus, Role } from "@prisma/client";
import { createNotification } from "../services/notification.service";
import { NotificationType } from "@prisma/client";
import { uploadFile, validateFile } from "../services/storage.service";
import { env } from "../config/env";

const router = Router();
router.use(authenticate);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

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
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          sender: { select: { id: true, name: true, role: true } },
        },
      },
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
    include: {
      student: { select: { id: true, name: true, email: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          sender: { select: { id: true, name: true, role: true } },
        },
      },
    },
  });
  if (!helpRequest) throw new AppError(404, "Help request not found", "NOT_FOUND");
  if (!isAdmin && helpRequest.studentId !== user.id) throw new AppError(403, "Access denied", "FORBIDDEN");
  res.json({ helpRequest });
}));

// DELETE /api/help/:id — Student can delete their own OPEN ticket
router.delete("/:id", validate(z.object({ params: z.object({ id: z.string().min(1) }) })), asyncHandler(async (req, res) => {
  const user = req.user!;
  const isAdmin = user.role === Role.SUPERADMIN || user.role === Role.ASSISTANT;
  const helpRequest = await prisma.helpRequest.findUnique({ where: { id: req.params.id as string } });
  if (!helpRequest) throw new AppError(404, "Help request not found", "NOT_FOUND");
  if (!isAdmin) {
    if (helpRequest.studentId !== user.id) throw new AppError(403, "Access denied", "FORBIDDEN");
    if (helpRequest.status !== TicketStatus.OPEN) {
      throw new AppError(400, "Only OPEN tickets can be deleted", "TICKET_NOT_DELETABLE");
    }
  }
  await prisma.helpRequest.delete({ where: { id: req.params.id as string } });
  res.status(204).send();
}));

// POST /api/help/:id/messages — Student or Admin posts a message (with optional media)
router.post("/:id/messages", upload.single("media"), validate(z.object({
  params: z.object({ id: z.string().min(1) }),
})), asyncHandler(async (req, res) => {
  const user = req.user!;
  const isAdmin = user.role === Role.SUPERADMIN || user.role === Role.ASSISTANT;
  const { id } = req.params as { id: string };
  const { body: messageBody } = req.body as { body?: string };

  const helpRequest = await prisma.helpRequest.findUnique({ where: { id } });
  if (!helpRequest) throw new AppError(404, "Help request not found", "NOT_FOUND");
  if (!isAdmin && helpRequest.studentId !== user.id) throw new AppError(403, "Access denied", "FORBIDDEN");
  if (helpRequest.status === TicketStatus.RESOLVED) {
    throw new AppError(400, "Cannot reply to a resolved ticket", "TICKET_RESOLVED");
  }

  if (!messageBody?.trim() && !req.file) {
    throw new AppError(400, "Message must have text or a media attachment", "EMPTY_MESSAGE");
  }

  let mediaUrl: string | undefined;
  if (req.file) {
    validateFile(req.file.mimetype, req.file.size, [
      "image/jpeg", "image/png", "image/webp", "image/gif",
      "application/pdf", "video/mp4",
    ]);
    const ext = path.extname(req.file.originalname).toLowerCase();
    mediaUrl = await uploadFile(
      env.SUPABASE_BUCKET_QUIZ_MEDIA,
      `help/${id}/${Date.now()}${ext}`,
      req.file.buffer,
      req.file.mimetype,
    );
  }

  const message = await prisma.ticketMessage.create({
    data: {
      helpRequestId: id,
      senderId: user.id,
      body: messageBody?.trim() || null,
      mediaUrl,
    },
    include: { sender: { select: { id: true, name: true, role: true } } },
  });

  // Update ticket status and notify
  if (isAdmin && helpRequest.status === TicketStatus.OPEN) {
    await prisma.helpRequest.update({
      where: { id },
      data: { status: TicketStatus.IN_PROGRESS, adminReply: messageBody?.trim(), repliedAt: new Date() },
    });
  }

  if (isAdmin) {
    await createNotification(
      helpRequest.studentId,
      NotificationType.HELP_RESPONSE,
      `Your help request "${helpRequest.topic}" has a new reply.`
    );
  }

  res.status(201).json({ message });
}));

// GET /api/help/:id/messages
router.get("/:id/messages", validate(z.object({ params: z.object({ id: z.string().min(1) }) })), asyncHandler(async (req, res) => {
  const user = req.user!;
  const isAdmin = user.role === Role.SUPERADMIN || user.role === Role.ASSISTANT;
  const helpRequest = await prisma.helpRequest.findUnique({ where: { id: req.params.id as string } });
  if (!helpRequest) throw new AppError(404, "Help request not found", "NOT_FOUND");
  if (!isAdmin && helpRequest.studentId !== user.id) throw new AppError(403, "Access denied", "FORBIDDEN");

  const messages = await prisma.ticketMessage.findMany({
    where: { helpRequestId: req.params.id as string },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { id: true, name: true, role: true } } },
  });
  res.json({ messages });
}));

// PATCH /api/help/:id/status — ASSISTANT+ (update ticket status)
router.patch("/:id/status", requireAdmin, validate(z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ status: z.nativeEnum(TicketStatus) }),
})), asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  const { status } = req.body as { status: TicketStatus };
  const helpRequest = await prisma.helpRequest.update({ where: { id }, data: { status } });
  res.json({ helpRequest });
}));

// PATCH /api/help/:id/reply — ASSISTANT+ (legacy single-reply endpoint, kept for compatibility)
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

export default router;
