import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/database";
import { asyncHandler } from "../utils/async-handler";
import { AppError } from "../utils/app-error";
import { authenticate } from "../middlewares/auth";
import { requireAdmin, requireSuperAdmin } from "../middlewares/requireRole";
import { validate } from "../middlewares/validate";
import { audit } from "../services/audit.service";

const router = Router();
router.use(authenticate);

const courseBody = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(5000).optional(),
  coursePrice: z.coerce.number().min(0),
  sessionPrice: z.coerce.number().min(0),
  isActive: z.boolean().optional(),
});

// GET /api/courses
router.get("/", asyncHandler(async (_req, res) => {
  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { sessions: true, enrollments: true } } },
  });
  res.json({ courses });
}));

// GET /api/courses/:id
router.get("/:id", validate(z.object({ params: z.object({ id: z.string().min(1) }) })), asyncHandler(async (req, res) => {
  const course = await prisma.course.findUnique({
    where: { id: req.params.id as string },
    include: {
      sessions: { orderBy: { scheduledAt: "asc" }, select: { id: true, title: true, topic: true, scheduledAt: true, status: true } },
      _count: { select: { enrollments: true } },
    },
  });
  if (!course) throw new AppError(404, "Course not found", "NOT_FOUND");
  res.json({ course });
}));

// POST /api/courses — ASSISTANT+
router.post("/", requireAdmin, validate(z.object({ body: courseBody })), asyncHandler(async (req, res) => {
  const course = await prisma.course.create({ data: req.body as z.infer<typeof courseBody> });
  await audit(req, "COURSE_CREATED", { entityType: "Course", entityId: course.id });
  res.status(201).json({ course });
}));

// PATCH /api/courses/:id — ASSISTANT+
router.patch("/:id", requireAdmin, validate(z.object({
  params: z.object({ id: z.string().min(1) }),
  body: courseBody.partial(),
})), asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  const course = await prisma.course.update({ where: { id }, data: req.body as Partial<z.infer<typeof courseBody>> });
  await audit(req, "COURSE_UPDATED", { entityType: "Course", entityId: id });
  res.json({ course });
}));

// DELETE /api/courses/:id — SUPERADMIN only
router.delete("/:id", requireSuperAdmin, validate(z.object({
  params: z.object({ id: z.string().min(1) }),
})), asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  await prisma.course.delete({ where: { id } });
  await audit(req, "COURSE_DELETED", { entityType: "Course", entityId: id });
  res.status(204).send();
}));

// POST /api/courses/:id/enroll — ASSISTANT+ (manual enrollment grant)
router.post("/:id/enroll", requireAdmin, validate(z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    userId: z.string().min(1),
    purchaseType: z.enum(["SESSION", "COURSE", "FREE"]),
  }),
})), asyncHandler(async (req, res) => {
  const courseId = req.params.id as string;
  const { userId, purchaseType } = req.body as { userId: string; purchaseType: "SESSION" | "COURSE" | "FREE" };
  const enrollment = await prisma.enrollment.create({
    data: { userId, courseId, purchaseType },
  });
  await audit(req, "ENROLLMENT_GRANTED", { entityType: "Enrollment", entityId: enrollment.id, metadata: { userId, courseId } });
  res.status(201).json({ enrollment });
}));

export default router;
