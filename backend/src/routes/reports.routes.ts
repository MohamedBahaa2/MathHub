import { Router } from "express";
import { Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../config/database";
import { asyncHandler } from "../utils/async-handler";
import { AppError } from "../utils/app-error";
import { authenticate } from "../middlewares/auth";
import { requireAdmin } from "../middlewares/requireRole";
import { validate } from "../middlewares/validate";
import { generateReportPdf } from "../services/pdf.service";

const router = Router();
router.use(authenticate);

// POST /api/reports/generate — ASSISTANT+
router.post("/generate", requireAdmin, validate(z.object({
  body: z.object({
    studentId: z.string().min(1),
    weekStart: z.coerce.date(),
    weekEnd: z.coerce.date(),
    avgGrade: z.coerce.number().min(0).max(100).optional(),
    sessionsAttended: z.coerce.number().int().min(0).default(0),
    assignmentsSubmitted: z.coerce.number().int().min(0).default(0),
    quizAvgScore: z.coerce.number().min(0).max(100).optional(),
    teacherNotes: z.string().max(5000).optional(),
  }),
})), asyncHandler(async (req, res) => {
  const body = req.body as {
    studentId: string;
    weekStart: Date;
    weekEnd: Date;
    avgGrade?: number;
    sessionsAttended: number;
    assignmentsSubmitted: number;
    quizAvgScore?: number;
    teacherNotes?: string;
  };

  const student = await prisma.user.findUnique({ where: { id: body.studentId } });
  if (!student || student.role !== Role.STUDENT) {
    throw new AppError(404, "Student not found", "NOT_FOUND");
  }

  const report = await prisma.report.create({ data: body });
  res.status(201).json({ report });
}));

// GET /api/reports — ASSISTANT+ or PARENT (linked students only)
router.get("/", asyncHandler(async (req, res) => {
  const user = req.user!;
  const isAdmin = user.role === Role.SUPERADMIN || user.role === Role.ASSISTANT;

  if (isAdmin) {
    const reports = await prisma.report.findMany({
      orderBy: { generatedAt: "desc" },
      include: { student: { select: { id: true, name: true, email: true, studentCode: true } } },
    });
    return res.json({ reports });
  }

  if (user.role === Role.PARENT) {
    const links = await prisma.parentStudent.findMany({
      where: { parentId: user.id },
      select: { studentId: true },
    });
    const studentIds = links.map((l) => l.studentId);
    const reports = await prisma.report.findMany({
      where: { studentId: { in: studentIds } },
      orderBy: { generatedAt: "desc" },
      include: { student: { select: { id: true, name: true, email: true, studentCode: true } } },
    });
    return res.json({ reports });
  }

  throw new AppError(403, "Access denied", "FORBIDDEN");
}));

// GET /api/reports/:id
router.get("/:id", validate(z.object({ params: z.object({ id: z.string().min(1) }) })), asyncHandler(async (req, res) => {
  const user = req.user!;
  const isAdmin = user.role === Role.SUPERADMIN || user.role === Role.ASSISTANT;
  const report = await prisma.report.findUnique({
    where: { id: req.params.id as string },
    include: { student: { select: { id: true, name: true, email: true, studentCode: true } } },
  });
  if (!report) throw new AppError(404, "Report not found", "NOT_FOUND");

  if (!isAdmin && user.role === Role.PARENT) {
    const link = await prisma.parentStudent.findUnique({
      where: { parentId_studentId: { parentId: user.id, studentId: report.studentId } },
    });
    if (!link) throw new AppError(403, "Access denied", "FORBIDDEN");
  } else if (!isAdmin) {
    throw new AppError(403, "Access denied", "FORBIDDEN");
  }

  res.json({ report });
}));

// GET /api/reports/:id/pdf — ASSISTANT+ or PARENT
router.get("/:id/pdf", validate(z.object({ params: z.object({ id: z.string().min(1) }) })), asyncHandler(async (req, res) => {
  const user = req.user!;
  const isAdmin = user.role === Role.SUPERADMIN || user.role === Role.ASSISTANT;

  // Verify access first
  const report = await prisma.report.findUnique({ where: { id: req.params.id as string } });
  if (!report) throw new AppError(404, "Report not found", "NOT_FOUND");

  if (!isAdmin && user.role === Role.PARENT) {
    const link = await prisma.parentStudent.findUnique({
      where: { parentId_studentId: { parentId: user.id, studentId: report.studentId } },
    });
    if (!link) throw new AppError(403, "Access denied", "FORBIDDEN");
  } else if (!isAdmin) {
    throw new AppError(403, "Access denied", "FORBIDDEN");
  }

  const pdfBuffer = await generateReportPdf(req.params.id as string);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="report-${req.params.id}.pdf"`);
  res.send(pdfBuffer);
}));

export default router;
