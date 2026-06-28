import path from "node:path";
import { Router } from "express";
import { PaymentStatus, Role, QuestionType } from "@prisma/client";
import { z } from "zod";
import multer from "multer";
import { prisma } from "../config/database";
import { asyncHandler } from "../utils/async-handler";
import { AppError } from "../utils/app-error";
import { authenticate } from "../middlewares/auth";
import { requireAdmin } from "../middlewares/requireRole";
import { validate } from "../middlewares/validate";
import { audit } from "../services/audit.service";
import { autoGradeAttempt, manualGradeAttempt } from "../services/quiz.service";
import { uploadFile, validateFile } from "../services/storage.service";
import { createNotification } from "../services/notification.service";
import { env } from "../config/env";
import { NotificationType } from "@prisma/client";
import { assertEnrolled } from "../services/access.service";

const router = Router();
router.use(authenticate);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

async function assertQuizAccess(user: { id: string; role: Role }, quizId: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { id: true, sessionId: true, isPublished: true },
  });
  if (!quiz) throw new AppError(404, "Quiz not found", "NOT_FOUND");
  if (user.role === Role.SUPERADMIN || user.role === Role.ASSISTANT) return quiz;
  if (user.role !== Role.STUDENT || !quiz.isPublished) {
    throw new AppError(403, "Access denied", "FORBIDDEN");
  }
  if (quiz.sessionId) await assertEnrolled(user.id, quiz.sessionId);
  return quiz;
}

// ── Quiz CRUD ──────────────────────────────────────────

// GET /api/quizzes
router.get("/", asyncHandler(async (req, res) => {
  const user = req.user!;
  const isAdmin = user.role === Role.SUPERADMIN || user.role === Role.ASSISTANT;
  if (!isAdmin && user.role !== Role.STUDENT) throw new AppError(403, "Access denied", "FORBIDDEN");
  let where = {};
  if (!isAdmin) {
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: user.id,
        OR: [
          { payment: { is: null } },
          { payment: { is: { status: PaymentStatus.PAID } } },
        ],
      },
      select: { sessionId: true, courseId: true },
    });
    const directSessionIds = enrollments.flatMap((e) => e.sessionId ? [e.sessionId] : []);
    const courseIds = enrollments.flatMap((e) => e.courseId ? [e.courseId] : []);
    const courseSessions = await prisma.session.findMany({
      where: { courseId: { in: courseIds } },
      select: { id: true },
    });
    const allowedSessionIds = [...new Set([...directSessionIds, ...courseSessions.map((s) => s.id)])];
    where = {
      isPublished: true,
      OR: [{ sessionId: null }, { sessionId: { in: allowedSessionIds } }],
    };
  }
  const quizzes = await prisma.quiz.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      session: { select: { id: true, title: true } },
      _count: { select: { questions: true, attempts: true } },
      attempts: isAdmin ? false : {
        where: { studentId: user.id },
        select: { id: true, status: true, score: true, maxScore: true, submittedAt: true },
      },
    },
  });
  res.json({ quizzes });
}));

// GET /api/quizzes/:id
router.get("/:id", validate(z.object({ params: z.object({ id: z.string().min(1) }) })), asyncHandler(async (req, res) => {
  const user = req.user!;
  const isAdmin = user.role === Role.SUPERADMIN || user.role === Role.ASSISTANT;
  await assertQuizAccess(user, req.params.id as string);
  const quiz = await prisma.quiz.findUnique({
    where: { id: req.params.id as string },
    include: {
      questions: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          text: true,
          mediaUrl: true,
          type: true,
          order: true,
          points: true,
          correctText: isAdmin,
          choices: {
            orderBy: { order: "asc" },
            select: {
              id: true, text: true, order: true,
              isCorrect: isAdmin,
            },
          },
        },
      },
      attempts: isAdmin ? false : {
        where: { studentId: user.id },
        select: {
          id: true,
          status: true,
          score: true,
          maxScore: true,
          submittedAt: true,
          answers: {
            select: {
              questionId: true,
              choiceId: true,
              textAnswer: true,
              mediaUrl: true,
            },
          },
        },
      },
    },
  });
  if (!quiz) throw new AppError(404, "Quiz not found", "NOT_FOUND");
  res.json({ quiz });
}));

// POST /api/quizzes — ASSISTANT+
router.post("/", requireAdmin, validate(z.object({
  body: z.object({
    title: z.string().min(2).max(200),
    description: z.string().max(2000).optional(),
    sessionId: z.string().optional(),
  }),
})), asyncHandler(async (req, res) => {
  const quiz = await prisma.quiz.create({ data: req.body as { title: string; description?: string; sessionId?: string } });
  await audit(req, "QUIZ_CREATED", { entityType: "Quiz", entityId: quiz.id });
  res.status(201).json({ quiz });
}));

// PATCH /api/quizzes/:id — ASSISTANT+
router.patch("/:id", requireAdmin, validate(z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    title: z.string().min(2).max(200).optional(),
    description: z.string().max(2000).optional(),
    sessionId: z.string().nullable().optional(),
    isPublished: z.boolean().optional(),
  }),
})), asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  const quiz = await prisma.quiz.update({ where: { id }, data: req.body });
  await audit(req, "QUIZ_UPDATED", { entityType: "Quiz", entityId: id });
  res.json({ quiz });
}));

// DELETE /api/quizzes/:id — SUPERADMIN only
router.delete("/:id", requireAdmin, validate(z.object({
  params: z.object({ id: z.string().min(1) }),
})), asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  await prisma.quiz.delete({ where: { id } });
  await audit(req, "QUIZ_DELETED", { entityType: "Quiz", entityId: id });
  res.status(204).send();
}));

// ── Questions ──────────────────────────────────────────

// POST /api/quizzes/:id/questions — ASSISTANT+
router.post("/:id/questions", requireAdmin, upload.single("media"), validate(z.object({
  params: z.object({ id: z.string().min(1) }),
})), asyncHandler(async (req, res) => {
  const quizId = req.params.id as string;
  const { text, type, order, points, correctText } = req.body as {
    text: string; type: QuestionType; order: string; points?: string; correctText?: string;
  };
  if (!text || !type || !order) throw new AppError(400, "text, type, and order are required", "VALIDATION_ERROR");

  let mediaUrl: string | undefined;
  if (req.file) {
    validateFile(req.file.mimetype, req.file.size, ["image/jpeg", "image/png", "image/webp", "video/mp4"]);
    const ext = path.extname(req.file.originalname).toLowerCase();
    mediaUrl = await uploadFile(env.SUPABASE_BUCKET_QUIZ_MEDIA, `${quizId}/${Date.now()}${ext}`, req.file.buffer, req.file.mimetype);
  }

  const question = await prisma.question.create({
    data: {
      quizId,
      text,
      type,
      order: parseInt(order),
      points: points ? parseInt(points) : 1,
      correctText,
      mediaUrl,
    },
  });
  res.status(201).json({ question });
}));

// PATCH /api/quizzes/:id/questions/:qId — ASSISTANT+
router.patch("/:id/questions/:qId", requireAdmin, validate(z.object({
  params: z.object({ id: z.string().min(1), qId: z.string().min(1) }),
  body: z.object({
    text: z.string().min(1).optional(),
    type: z.nativeEnum(QuestionType).optional(),
    order: z.coerce.number().int().optional(),
    points: z.coerce.number().int().min(1).optional(),
    correctText: z.string().nullable().optional(),
  }),
})), asyncHandler(async (req, res) => {
  const { id, qId } = req.params as { id: string; qId: string };
  const question = await prisma.question.findFirst({ where: { id: qId, quizId: id } });
  if (!question) throw new AppError(404, "Question not found", "NOT_FOUND");
  const updated = await prisma.question.update({ where: { id: qId }, data: req.body });
  res.json({ question: updated });
}));

// DELETE /api/quizzes/:id/questions/:qId — ASSISTANT+
router.delete("/:id/questions/:qId", requireAdmin, validate(z.object({
  params: z.object({ id: z.string().min(1), qId: z.string().min(1) }),
})), asyncHandler(async (req, res) => {
  const { id, qId } = req.params as { id: string; qId: string };
  const question = await prisma.question.findFirst({ where: { id: qId, quizId: id } });
  if (!question) throw new AppError(404, "Question not found", "NOT_FOUND");
  await prisma.question.delete({ where: { id: qId } });
  res.status(204).send();
}));

// ── Choices ────────────────────────────────────────────

// POST /api/quizzes/:id/questions/:qId/choices — ASSISTANT+
router.post("/:id/questions/:qId/choices", requireAdmin, validate(z.object({
  params: z.object({ id: z.string().min(1), qId: z.string().min(1) }),
  body: z.object({
    text: z.string().min(1),
    isCorrect: z.boolean().default(false),
    order: z.coerce.number().int().min(1),
  }),
})), asyncHandler(async (req, res) => {
  const { qId } = req.params as { id: string; qId: string };
  const body = req.body as { text: string; isCorrect: boolean; order: number };
  const choice = await prisma.choice.create({ data: { questionId: qId, ...body } });
  res.status(201).json({ choice });
}));

// PATCH /api/quizzes/:id/questions/:qId/choices/:cId — ASSISTANT+
router.patch("/:id/questions/:qId/choices/:cId", requireAdmin, validate(z.object({
  params: z.object({ id: z.string().min(1), qId: z.string().min(1), cId: z.string().min(1) }),
  body: z.object({
    text: z.string().min(1).optional(),
    isCorrect: z.boolean().optional(),
    order: z.coerce.number().int().min(1).optional(),
  }),
})), asyncHandler(async (req, res) => {
  const { cId } = req.params as { id: string; qId: string; cId: string };
  const choice = await prisma.choice.update({ where: { id: cId }, data: req.body });
  res.json({ choice });
}));

// DELETE /api/quizzes/:id/questions/:qId/choices/:cId — ASSISTANT+
router.delete("/:id/questions/:qId/choices/:cId", requireAdmin, validate(z.object({
  params: z.object({ id: z.string().min(1), qId: z.string().min(1), cId: z.string().min(1) }),
})), asyncHandler(async (req, res) => {
  const { cId } = req.params as { id: string; qId: string; cId: string };
  await prisma.choice.delete({ where: { id: cId } });
  res.status(204).send();
}));

// ── Attempts ───────────────────────────────────────────

// POST /api/quizzes/:id/attempt — STUDENT (start)
router.post("/:id/attempt", validate(z.object({
  params: z.object({ id: z.string().min(1) }),
})), asyncHandler(async (req, res) => {
  const quizId = req.params.id as string;
  const studentId = req.user!.id;
  await assertQuizAccess(req.user!, quizId);

  const existing = await prisma.quizAttempt.findUnique({
    where: { quizId_studentId: { quizId, studentId } },
  });
  if (existing) throw new AppError(409, "You already have an attempt for this quiz", "ATTEMPT_EXISTS");

  const attempt = await prisma.quizAttempt.create({ data: { quizId, studentId } });
  res.status(201).json({ attempt });
}));

// POST /api/quizzes/:id/attempt/answer — STUDENT (save answer)
router.post("/:id/attempt/answer", upload.single("media"), validate(z.object({
  params: z.object({ id: z.string().min(1) }),
})), asyncHandler(async (req, res) => {
  const quizId = req.params.id as string;
  const studentId = req.user!.id;
  const { questionId, choiceId, textAnswer } = req.body as {
    questionId: string; choiceId?: string; textAnswer?: string;
  };
  await assertQuizAccess(req.user!, quizId);

  const attempt = await prisma.quizAttempt.findUnique({
    where: { quizId_studentId: { quizId, studentId } },
  });
  if (!attempt || attempt.status !== "IN_PROGRESS") {
    throw new AppError(400, "No active attempt found", "NO_ACTIVE_ATTEMPT");
  }
  const question = await prisma.question.findFirst({
    where: { id: questionId, quizId },
    select: { id: true },
  });
  if (!question) throw new AppError(400, "Question does not belong to this quiz", "INVALID_QUESTION");
  if (choiceId) {
    const choice = await prisma.choice.findFirst({
      where: { id: choiceId, questionId },
      select: { id: true },
    });
    if (!choice) throw new AppError(400, "Choice does not belong to this question", "INVALID_CHOICE");
  }

  let mediaUrl: string | undefined;
  if (req.file) {
    validateFile(req.file.mimetype, req.file.size, ["image/jpeg", "image/png", "image/webp", "application/pdf"]);
    const ext = path.extname(req.file.originalname).toLowerCase();
    mediaUrl = await uploadFile(env.SUPABASE_BUCKET_QUIZ_MEDIA, `answers/${attempt.id}/${questionId}${ext}`, req.file.buffer, req.file.mimetype);
  }

  const answer = await prisma.answer.upsert({
    where: { attemptId_questionId: { attemptId: attempt.id, questionId } },
    create: { attemptId: attempt.id, questionId, choiceId, textAnswer, mediaUrl },
    update: { choiceId, textAnswer, mediaUrl },
  });
  res.json({ answer });
}));

// POST /api/quizzes/:id/attempt/submit — STUDENT (finalize)
router.post("/:id/attempt/submit", validate(z.object({
  params: z.object({ id: z.string().min(1) }),
})), asyncHandler(async (req, res) => {
  const quizId = req.params.id as string;
  const studentId = req.user!.id;
  await assertQuizAccess(req.user!, quizId);

  const attempt = await prisma.quizAttempt.findUnique({
    where: { quizId_studentId: { quizId, studentId } },
  });
  if (!attempt || attempt.status !== "IN_PROGRESS") {
    throw new AppError(400, "No active attempt to submit", "NO_ACTIVE_ATTEMPT");
  }

  await autoGradeAttempt(attempt.id);

  const updated = await prisma.quizAttempt.findUnique({ where: { id: attempt.id } });
  if (updated?.status === "GRADED") {
    await createNotification(
      studentId,
      NotificationType.QUIZ_GRADED,
      `Your quiz has been graded! Score: ${updated.score}/${updated.maxScore}`
    );
  }

  res.json({ attempt: updated });
}));

// GET /api/quizzes/:id/attempts — ASSISTANT+
router.get("/:id/attempts", requireAdmin, validate(z.object({
  params: z.object({ id: z.string().min(1) }),
})), asyncHandler(async (req, res) => {
  const quizId = req.params.id as string;
  const attempts = await prisma.quizAttempt.findMany({
    where: { quizId },
    include: {
      student: { select: { id: true, name: true, email: true, studentCode: true } },
      answers: {
        orderBy: { question: { order: "asc" } },
        include: {
          choice: { select: { id: true, text: true } },
          question: {
            select: {
              id: true, text: true, type: true, points: true, order: true,
              choices: {
                orderBy: { order: "asc" },
                select: { id: true, text: true, isCorrect: true },
              },
            },
          },
        },
      },
      _count: { select: { answers: true } },
    },
    orderBy: { startedAt: "desc" },
  });
  res.json({ attempts });
}));

// PATCH /api/quizzes/:id/attempts/:aId/grade — ASSISTANT+ (manual grade)
router.patch("/:id/attempts/:aId/grade", requireAdmin, validate(z.object({
  params: z.object({ id: z.string().min(1), aId: z.string().min(1) }),
  body: z.object({
    grades: z.array(z.object({
      answerId: z.string().min(1),
      pointsEarned: z.coerce.number().min(0),
      isCorrect: z.boolean(),
    })),
  }),
})), asyncHandler(async (req, res) => {
  const { id, aId } = req.params as { id: string; aId: string };
  const { grades } = req.body as { grades: Array<{ answerId: string; pointsEarned: number; isCorrect: boolean }> };

  const attempt = await prisma.quizAttempt.findFirst({
    where: { id: aId, quizId: id },
    include: { answers: { include: { question: { select: { points: true } } } } },
  });
  if (!attempt) throw new AppError(404, "Quiz attempt not found", "NOT_FOUND");
  const answersById = new Map(attempt.answers.map((answer) => [answer.id, answer]));
  for (const grade of grades) {
    const answer = answersById.get(grade.answerId);
    if (!answer) throw new AppError(400, "Answer does not belong to this attempt", "INVALID_ANSWER");
    if (grade.pointsEarned > answer.question.points) {
      throw new AppError(400, "Points cannot exceed the question maximum", "INVALID_GRADE");
    }
  }
  await manualGradeAttempt(aId, grades);
  const updated = await prisma.quizAttempt.findUnique({ where: { id: aId } });
  await createNotification(
    attempt.studentId,
    NotificationType.QUIZ_GRADED,
    `Your quiz has been graded! Score: ${updated?.score}/${updated?.maxScore}`
  );
  await audit(req, "QUIZ_GRADED", { entityType: "QuizAttempt", entityId: aId });
  res.json({ attempt: updated });
}));

export default router;
