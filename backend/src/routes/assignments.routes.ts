import path from "node:path";
import { Router } from "express";
import { Role } from "@prisma/client";
import { z } from "zod";
import multer from "multer";
import { prisma } from "../config/database";
import { asyncHandler } from "../utils/async-handler";
import { AppError } from "../utils/app-error";
import { authenticate } from "../middlewares/auth";
import { requireAdmin } from "../middlewares/requireRole";
import { validate } from "../middlewares/validate";
import { audit } from "../services/audit.service";
import { uploadFile, validateFile } from "../services/storage.service";
import { createNotification, createBulkNotifications } from "../services/notification.service";
import { env } from "../config/env";
import { NotificationType } from "@prisma/client";

const router = Router();
router.use(authenticate);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const ALLOWED_SUBMISSION_TYPES = [
  "application/pdf",
  "image/jpeg", "image/png", "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// GET /api/assignments — Auth (student: own; admin: all)
router.get("/", asyncHandler(async (req, res) => {
  const user = req.user!;
  const isAdmin = user.role === Role.SUPERADMIN || user.role === Role.ASSISTANT;

  if (isAdmin) {
    const assignments = await prisma.assignment.findMany({
      orderBy: { dueDate: "asc" },
      include: {
        session: { select: { id: true, title: true } },
        _count: { select: { submissions: true } },
      },
    });
    return res.json({ assignments });
  }

  // Students: assignments for sessions they're enrolled in
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: user.id },
    select: { sessionId: true, courseId: true },
  });
  const sessionIds = enrollments.flatMap((e) => (e.sessionId ? [e.sessionId] : []));
  const courseSessionIds = await prisma.session.findMany({
    where: { courseId: { in: enrollments.flatMap((e) => (e.courseId ? [e.courseId] : [])) } },
    select: { id: true },
  });
  const allSessionIds = [...new Set([...sessionIds, ...courseSessionIds.map((s) => s.id)])];

  const assignments = await prisma.assignment.findMany({
    where: { sessionId: { in: allSessionIds } },
    orderBy: { dueDate: "asc" },
    include: { session: { select: { id: true, title: true } } },
  });
  res.json({ assignments });
}));

// GET /api/assignments/:id — Auth
router.get("/:id", validate(z.object({ params: z.object({ id: z.string().min(1) }) })), asyncHandler(async (req, res) => {
  const assignment = await prisma.assignment.findUnique({
    where: { id: req.params.id as string },
    include: { session: { select: { id: true, title: true } }, _count: { select: { submissions: true } } },
  });
  if (!assignment) throw new AppError(404, "Assignment not found", "NOT_FOUND");
  res.json({ assignment });
}));

// POST /api/assignments — ASSISTANT+
router.post("/", requireAdmin, validate(z.object({
  body: z.object({
    title: z.string().min(2).max(200),
    description: z.string().max(5000).optional(),
    dueDate: z.coerce.date(),
    sessionId: z.string().optional(),
    materialUrl: z.string().url().optional(),
  }),
})), asyncHandler(async (req, res) => {
  const body = req.body as { title: string; description?: string; dueDate: Date; sessionId?: string; materialUrl?: string };
  const assignment = await prisma.assignment.create({ data: body });
  await audit(req, "ASSIGNMENT_CREATED", { entityType: "Assignment", entityId: assignment.id });

  // Notify enrolled students
  if (body.sessionId) {
    const enrollments = await prisma.enrollment.findMany({
      where: { OR: [{ sessionId: body.sessionId }] },
      select: { userId: true },
    });
    await createBulkNotifications(
      enrollments.map((e) => e.userId),
      NotificationType.NEW_ASSIGNMENT,
      `New assignment posted: "${assignment.title}"`
    );
  }

  res.status(201).json({ assignment });
}));

// PATCH /api/assignments/:id — ASSISTANT+
router.patch("/:id", requireAdmin, validate(z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    title: z.string().min(2).max(200).optional(),
    description: z.string().max(5000).optional(),
    dueDate: z.coerce.date().optional(),
    materialUrl: z.string().url().nullable().optional(),
  }),
})), asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  const assignment = await prisma.assignment.update({ where: { id }, data: req.body });
  await audit(req, "ASSIGNMENT_UPDATED", { entityType: "Assignment", entityId: id });
  res.json({ assignment });
}));

// DELETE /api/assignments/:id — SUPERADMIN only
router.delete("/:id", requireAdmin, validate(z.object({
  params: z.object({ id: z.string().min(1) }),
})), asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  await prisma.assignment.delete({ where: { id } });
  await audit(req, "ASSIGNMENT_DELETED", { entityType: "Assignment", entityId: id });
  res.status(204).send();
}));

// POST /api/assignments/:id/submit — STUDENT (file upload)
router.post("/:id/submit", upload.single("file"), validate(z.object({
  params: z.object({ id: z.string().min(1) }),
})), asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  const user = req.user!;
  if (!req.file) throw new AppError(400, "File is required", "FILE_REQUIRED");

  validateFile(req.file.mimetype, req.file.size, ALLOWED_SUBMISSION_TYPES);

  const ext = path.extname(req.file.originalname).toLowerCase();
  const filePath = `${id}/${user.id}-${Date.now()}${ext}`;
  const fileUrl = await uploadFile(env.SUPABASE_BUCKET_ASSIGNMENTS, filePath, req.file.buffer, req.file.mimetype);

  const submission = await prisma.assignmentSubmission.upsert({
    where: { assignmentId_studentId: { assignmentId: id, studentId: user.id } },
    create: { assignmentId: id, studentId: user.id, fileUrl },
    update: { fileUrl, submittedAt: new Date(), grade: null, feedback: null, gradedAt: null },
  });
  await audit(req, "ASSIGNMENT_SUBMITTED", { entityType: "AssignmentSubmission", entityId: submission.id });
  res.status(201).json({ submission });
}));

// PATCH /api/assignments/:id/submissions/:subId/grade — ASSISTANT+
router.patch("/:id/submissions/:subId/grade", requireAdmin, validate(z.object({
  params: z.object({ id: z.string().min(1), subId: z.string().min(1) }),
  body: z.object({
    grade: z.coerce.number().int().min(0).max(100),
    feedback: z.string().max(2000).optional(),
  }),
})), asyncHandler(async (req, res) => {
  const { subId } = req.params as { id: string; subId: string };
  const { grade, feedback } = req.body as { grade: number; feedback?: string };

  const submission = await prisma.assignmentSubmission.update({
    where: { id: subId },
    data: { grade, feedback, gradedAt: new Date() },
  });
  await createNotification(
    submission.studentId,
    NotificationType.ASSIGNMENT_GRADED,
    `Your assignment has been graded: ${grade}/100`
  );
  await audit(req, "ASSIGNMENT_GRADED", { entityType: "AssignmentSubmission", entityId: subId });
  res.json({ submission });
}));

// GET /api/assignments/:id/submissions — ASSISTANT+
router.get("/:id/submissions", requireAdmin, validate(z.object({
  params: z.object({ id: z.string().min(1) }),
})), asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  const submissions = await prisma.assignmentSubmission.findMany({
    where: { assignmentId: id },
    include: { student: { select: { id: true, name: true, email: true, studentCode: true } } },
    orderBy: { submittedAt: "desc" },
  });
  res.json({ submissions });
}));

export default router;
