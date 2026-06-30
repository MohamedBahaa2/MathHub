import bcrypt from "bcryptjs";
import { Router } from "express";
import { Role } from "@prisma/client";
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

const pagination = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25),
    role: z.nativeEnum(Role).optional(),
    search: z.string().optional(),
  }),
});

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  studentCode: true,
  avatarUrl: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

// GET /api/users — ASSISTANT+
router.get("/", requireAdmin, validate(pagination), asyncHandler(async (req, res) => {
  const { page, limit, role, search } = (res.locals.query ?? req.query) as z.infer<typeof pagination>["query"];
  const where = {
    ...(role ? { role } : {}),
    ...(search ? {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
        { studentCode: { contains: search, mode: "insensitive" as const } },
      ],
    } : {}),
  };
  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: userSelect,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);
  res.json({ users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}));

// POST /api/users — ASSISTANT+ (only SUPERADMIN can set SUPERADMIN role)
router.post("/", requireAdmin, validate(z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email().transform((v) => v.toLowerCase().trim()),
    password: z.string().min(8).max(128),
    role: z.nativeEnum(Role).default(Role.STUDENT),
    studentCode: z.string().optional(),
    avatarUrl: z.string().url().optional(),
  }),
})), asyncHandler(async (req, res) => {
  const body = req.body as {
    name: string; email: string; password: string;
    role: Role; studentCode?: string; avatarUrl?: string;
  };
  // Only SUPERADMIN can create another SUPERADMIN
  if (body.role === Role.SUPERADMIN && req.user!.role !== Role.SUPERADMIN) {
    throw new AppError(403, "Only SUPERADMIN can create SUPERADMIN accounts", "FORBIDDEN");
  }
  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) throw new AppError(409, "Email already in use", "EMAIL_CONFLICT");

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      passwordHash: await bcrypt.hash(body.password, 12),
      role: body.role,
      studentCode: body.studentCode,
      avatarUrl: body.avatarUrl,
    },
    select: userSelect,
  });
  await audit(req, "USER_CREATED", { entityType: "User", entityId: user.id });
  res.status(201).json({ user });
}));

// PATCH /api/users/:id — ASSISTANT+ (only SUPERADMIN can change roles)
router.patch("/:id", requireAdmin, validate(z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    email: z.string().email().optional(),
    password: z.string().min(8).max(128).optional(),
    role: z.nativeEnum(Role).optional(),
    studentCode: z.string().optional(),
    avatarUrl: z.string().url().nullable().optional(),
    isActive: z.boolean().optional(),
  }),
})), asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  const body = req.body as {
    name?: string; email?: string; password?: string;
    role?: Role; studentCode?: string; avatarUrl?: string | null; isActive?: boolean;
  };

  if (body.role && req.user!.role !== Role.SUPERADMIN) {
    throw new AppError(403, "Only SUPERADMIN can change roles", "FORBIDDEN");
  }

  const data: Record<string, unknown> = { ...body };
  if (body.password) {
    data.passwordHash = await bcrypt.hash(body.password, 12);
    delete data.password;
  }

  const user = await prisma.user.update({ where: { id }, data, select: userSelect });
  await audit(req, "USER_UPDATED", { entityType: "User", entityId: id });
  res.json({ user });
}));

// DELETE /api/users/:id — SUPERADMIN only
router.delete("/:id", requireSuperAdmin, validate(z.object({
  params: z.object({ id: z.string().min(1) }),
})), asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  if (id === req.user!.id) throw new AppError(400, "Cannot delete your own account", "SELF_DELETE");
  await prisma.user.delete({ where: { id } });
  await audit(req, "USER_DELETED", { entityType: "User", entityId: id });
  res.status(204).send();
}));

// POST /api/users/:id/link-parent — ASSISTANT+
router.post("/:id/link-parent", requireAdmin, validate(z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ parentId: z.string().min(1) }),
})), asyncHandler(async (req, res) => {
  const studentId = req.params.id as string;
  const { parentId } = req.body as { parentId: string };

  const [student, parent] = await Promise.all([
    prisma.user.findUnique({ where: { id: studentId } }),
    prisma.user.findUnique({ where: { id: parentId } }),
  ]);
  if (!student || student.role !== Role.STUDENT) throw new AppError(404, "Student not found", "NOT_FOUND");
  if (!parent || parent.role !== Role.PARENT) throw new AppError(404, "Parent not found", "NOT_FOUND");

  await prisma.parentStudent.upsert({
    where: { parentId_studentId: { parentId, studentId } },
    create: { parentId, studentId },
    update: {},
  });
  await audit(req, "PARENT_LINKED", { entityType: "User", entityId: studentId, metadata: { parentId } });
  res.status(201).json({ message: "Parent linked to student successfully" });
}));

// DELETE /api/users/:id/link-parent — ASSISTANT+
router.delete("/:id/link-parent", requireAdmin, validate(z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ parentId: z.string().min(1) }),
})), asyncHandler(async (req, res) => {
  const studentId = req.params.id as string;
  const { parentId } = req.body as { parentId: string };
  await prisma.parentStudent.delete({
    where: { parentId_studentId: { parentId, studentId } },
  });
  res.status(204).send();
}));

// GET /api/users/:id — ASSISTANT+ (get single user)
router.get("/:id", requireAdmin, validate(z.object({
  params: z.object({ id: z.string().min(1) }),
})), asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id as string },
    select: {
      ...userSelect,
      linkedChildren: { include: { student: { select: userSelect } } },
      linkedParents: { include: { parent: { select: userSelect } } },
      enrollments: {
        include: {
          course: { select: { id: true, name: true } },
          session: { select: { id: true, title: true } },
        },
        orderBy: { grantedAt: "desc" },
      },
      _count: { select: { enrollments: true, submissions: true, quizAttempts: true } },
    },
  });
  if (!user) throw new AppError(404, "User not found", "NOT_FOUND");
  res.json({ user });
}));

// GET /api/users/:id/enrollments — ASSISTANT+
router.get("/:id/enrollments", requireAdmin, validate(z.object({
  params: z.object({ id: z.string().min(1) }),
})), asyncHandler(async (req, res) => {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: req.params.id as string },
    include: {
      course: { select: { id: true, name: true, coursePrice: true } },
      session: { select: { id: true, title: true } },
      payment: { select: { status: true, amount: true } },
    },
    orderBy: { grantedAt: "desc" },
  });
  res.json({ enrollments });
}));

// DELETE /api/enrollments/:enrollmentId — SUPERADMIN only
router.delete("/enrollments/:enrollmentId", requireSuperAdmin, validate(z.object({
  params: z.object({ enrollmentId: z.string().min(1) }),
})), asyncHandler(async (req, res) => {
  const { enrollmentId } = req.params as { enrollmentId: string };
  const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
  if (!enrollment) throw new AppError(404, "Enrollment not found", "NOT_FOUND");
  await prisma.enrollment.delete({ where: { id: enrollmentId } });
  await audit(req, "ENROLLMENT_REVOKED", { entityType: "Enrollment", entityId: enrollmentId });
  res.status(204).send();
}));

export default router;
