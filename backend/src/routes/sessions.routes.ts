import { Router } from "express";
import { Role, SessionStatus, PricingType, NotificationType, PaymentStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../config/database";
import { asyncHandler } from "../utils/async-handler";
import { AppError } from "../utils/app-error";
import { authenticate } from "../middlewares/auth";
import { requireAdmin, requireSuperAdmin } from "../middlewares/requireRole";
import { requireEnrollment } from "../middlewares/requireEnrollment";
import { validate } from "../middlewares/validate";
import { audit } from "../services/audit.service";
import { encryptZoomUrl, decryptZoomUrl } from "../services/zoom.service";
import { signShortToken, verifyShortToken } from "../services/token.service";
import { createBulkNotifications } from "../services/notification.service";
import { assertEnrolled } from "../services/access.service";

const router = Router();

// Short-lived recording viewer used by an iframe. The stored Zoom URL is never
// returned to application JavaScript; only this signed MathHub URL is exposed.
router.get("/:id/recording-view", asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const token = typeof req.query.token === "string" ? req.query.token : "";
  const claims = verifyShortToken(token);
  if (claims.sessionId !== id || claims.purpose !== "zoom-recording") {
    throw new AppError(403, "Recording token is not valid for this session", "INVALID_RECORDING_TOKEN");
  }
  const session = await prisma.session.findUnique({
    where: { id },
    select: { status: true, zoomRecordingEnc: true },
  });
  if (!session?.zoomRecordingEnc) throw new AppError(404, "Recording not found", "NO_RECORDING");
  if (session.status !== SessionStatus.RECORDED && session.status !== SessionStatus.PROCESSING) {
    throw new AppError(403, "Recording not yet available", "RECORDING_NOT_AVAILABLE");
  }
  res.setHeader("Cache-Control", "no-store, private");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.redirect(302, decryptZoomUrl(session.zoomRecordingEnc));
}));

router.use(authenticate);

const sessionBody = z.object({
  title: z.string().min(2).max(200),
  topic: z.string().min(2).max(200),
  description: z.string().max(5000).optional(),
  scheduledAt: z.coerce.date(),
  durationMin: z.coerce.number().int().min(1).max(480),
  pricingType: z.nativeEnum(PricingType).optional(),
  sessionPrice: z.coerce.number().min(0).optional(),
  courseId: z.string().optional(),
  zoomLive: z.string().url().optional(),
  zoomRecording: z.string().url().optional(),
  zoomPasscode: z.string().optional(),
});

const safeSession = (s: Record<string, unknown>) => {
  const rest = { ...s };
  rest.hasZoomLive = Boolean(rest.zoomLiveEnc);
  rest.hasZoomRecording = Boolean(rest.zoomRecordingEnc);
  rest.hasZoomPasscode = Boolean(rest.zoomPasscodeEnc);
  delete rest.zoomLiveEnc;
  delete rest.zoomRecordingEnc;
  delete rest.zoomPasscodeEnc;
  return rest;
};

// GET /api/sessions
router.get("/", asyncHandler(async (req, res) => {
  const user = req.user!;
  const isAdmin = user.role === Role.SUPERADMIN || user.role === Role.ASSISTANT;

  if (isAdmin) {
    const sessions = await prisma.session.findMany({
      orderBy: { scheduledAt: "asc" },
      include: { course: { select: { id: true, name: true } }, _count: { select: { enrollments: true } } },
    });
    return res.json({ sessions: sessions.map((s) => safeSession(s as unknown as Record<string, unknown>)) });
  }

  // For students/parents — show enrolled sessions + all standalone sessions (no courseId)
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
  const sessionIds = enrollments.flatMap((e) => (e.sessionId ? [e.sessionId] : []));
  const courseIds = enrollments.flatMap((e) => (e.courseId ? [e.courseId] : []));

  const sessions = await prisma.session.findMany({
    where: {
      OR: [
        { id: { in: sessionIds } },
        { courseId: { in: courseIds } },
        { courseId: null }, // Always show standalone sessions
      ],
    },
    orderBy: { scheduledAt: "asc" },
    include: { course: { select: { id: true, name: true } } },
  });
  res.json({ sessions: sessions.map((s) => safeSession(s as unknown as Record<string, unknown>)) });
}));

// GET /api/sessions/:id
router.get("/:id", validate(z.object({ params: z.object({ id: z.string().min(1) }) })), asyncHandler(async (req, res) => {
  const user = req.user!;
  const isAdmin = user.role === Role.SUPERADMIN || user.role === Role.ASSISTANT;
  if (!isAdmin) {
    if (user.role !== Role.STUDENT) throw new AppError(403, "Access denied", "FORBIDDEN");
    await assertEnrolled(user.id, req.params.id as string);
  }
  const session = await prisma.session.findUnique({
    where: { id: req.params.id as string },
    include: { course: { select: { id: true, name: true } }, _count: { select: { enrollments: true } } },
  });
  if (!session) throw new AppError(404, "Session not found", "NOT_FOUND");
  res.json({ session: safeSession(session as unknown as Record<string, unknown>) });
}));

// POST /api/sessions — ASSISTANT+
router.post("/", requireAdmin, validate(z.object({ body: sessionBody })), asyncHandler(async (req, res) => {
  const body = req.body as z.infer<typeof sessionBody>;
  const session = await prisma.session.create({
    data: {
      title: body.title,
      topic: body.topic,
      description: body.description,
      scheduledAt: body.scheduledAt,
      durationMin: body.durationMin,
      pricingType: body.pricingType,
      sessionPrice: body.sessionPrice,
      courseId: body.courseId,
      zoomLiveEnc: body.zoomLive ? encryptZoomUrl(body.zoomLive) : undefined,
      zoomRecordingEnc: body.zoomRecording ? encryptZoomUrl(body.zoomRecording) : undefined,
      zoomPasscodeEnc: body.zoomPasscode ? encryptZoomUrl(body.zoomPasscode) : undefined,
    },
  });
  await audit(req, "SESSION_CREATED", { entityType: "Session", entityId: session.id });
  res.status(201).json({ session: safeSession(session as unknown as Record<string, unknown>) });
}));

// PATCH /api/sessions/:id — ASSISTANT+
router.patch("/:id", requireAdmin, validate(z.object({
  params: z.object({ id: z.string().min(1) }),
  body: sessionBody.partial(),
})), asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  const body = req.body as Partial<z.infer<typeof sessionBody>>;

  const existing = await prisma.session.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Session not found", "NOT_FOUND");
  const { zoomLive, zoomRecording, zoomPasscode, ...sessionData } = body;

  const session = await prisma.session.update({
    where: { id },
    data: {
      ...sessionData,
      zoomLiveEnc: zoomLive ? encryptZoomUrl(zoomLive) : undefined,
      zoomRecordingEnc: zoomRecording ? encryptZoomUrl(zoomRecording) : undefined,
      zoomPasscodeEnc: zoomPasscode ? encryptZoomUrl(zoomPasscode) : undefined,
    },
  });
  await audit(req, "SESSION_UPDATED", { entityType: "Session", entityId: id });
  res.json({ session: safeSession(session as unknown as Record<string, unknown>) });
}));

// PATCH /api/sessions/:id/status — ASSISTANT+
router.patch("/:id/status", requireAdmin, validate(z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ status: z.nativeEnum(SessionStatus) }),
})), asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  const { status } = req.body as { status: SessionStatus };
  if (status === SessionStatus.LIVE) {
    const existing = await prisma.session.findUnique({
      where: { id },
      select: { zoomLiveEnc: true },
    });
    if (!existing) throw new AppError(404, "Session not found", "NOT_FOUND");
    if (!existing.zoomLiveEnc) {
      throw new AppError(400, "Add a Zoom live meeting URL before starting this session", "NO_ZOOM_LINK");
    }
  }

  const session = await prisma.session.update({
    where: { id },
    data: { status },
  });
  await audit(req, "SESSION_STATUS_CHANGED", { entityType: "Session", entityId: id, metadata: { status } });

  // Fire notifications
  if (status === SessionStatus.LIVE || status === SessionStatus.RECORDED) {
    const enrollments = await prisma.enrollment.findMany({
      where: { OR: [{ sessionId: id }, { courseId: session.courseId ?? undefined }] },
      select: { userId: true },
    });
    const userIds = [...new Set(enrollments.map((e) => e.userId))];
    const type = status === SessionStatus.LIVE ? NotificationType.SESSION_LIVE : NotificationType.RECORDING_READY;
    const msg = status === SessionStatus.LIVE
      ? `Session "${session.title}" is now LIVE!`
      : `Recording for "${session.title}" is now available.`;
    await createBulkNotifications(userIds, type, msg);
  }

  res.json({ session: safeSession(session as unknown as Record<string, unknown>) });
}));

// POST /api/sessions/:id/start — ASSISTANT+ (SCHEDULED → LIVE)
router.post("/:id/start", requireAdmin, validate(z.object({
  params: z.object({ id: z.string().min(1) }),
})), asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  const existing = await prisma.session.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Session not found", "NOT_FOUND");
  if (existing.status !== SessionStatus.SCHEDULED) {
    throw new AppError(400, `Cannot start a session with status ${existing.status}`, "INVALID_STATUS");
  }
  if (!existing.zoomLiveEnc) {
    throw new AppError(400, "Add a Zoom live meeting URL before starting this session", "NO_ZOOM_LINK");
  }
  const session = await prisma.session.update({
    where: { id },
    data: { status: SessionStatus.LIVE },
  });
  // Notify enrolled students
  const enrollments = await prisma.enrollment.findMany({
    where: { OR: [{ sessionId: id }, { courseId: session.courseId ?? undefined }] },
    select: { userId: true },
  });
  const userIds = [...new Set(enrollments.map((e) => e.userId))];
  await createBulkNotifications(userIds, NotificationType.SESSION_LIVE, `Session "${session.title}" is now LIVE!`);
  await audit(req, "SESSION_STARTED", { entityType: "Session", entityId: id });
  res.json({ session: safeSession(session as unknown as Record<string, unknown>) });
}));

// POST /api/sessions/:id/end — ASSISTANT+ (LIVE → PROCESSING)
router.post("/:id/end", requireAdmin, validate(z.object({
  params: z.object({ id: z.string().min(1) }),
})), asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  const existing = await prisma.session.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Session not found", "NOT_FOUND");
  if (existing.status !== SessionStatus.LIVE) {
    throw new AppError(400, `Cannot end a session with status ${existing.status}`, "INVALID_STATUS");
  }
  const session = await prisma.session.update({
    where: { id },
    data: { status: SessionStatus.PROCESSING },
  });
  await audit(req, "SESSION_ENDED", { entityType: "Session", entityId: id });
  res.json({ session: safeSession(session as unknown as Record<string, unknown>) });
}));

// POST /api/sessions/:id/publish-recording — ASSISTANT+ (PROCESSING → RECORDED)
router.post("/:id/publish-recording", requireAdmin, validate(z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    zoomRecording: z.string().url(),
    zoomPasscode: z.string().optional(),
  }),
})), asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  const body = req.body as { zoomRecording: string; zoomPasscode?: string };
  const existing = await prisma.session.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Session not found", "NOT_FOUND");
  if (existing.status !== SessionStatus.PROCESSING) {
    throw new AppError(400, `Session must be in PROCESSING status to publish recording`, "INVALID_STATUS");
  }
  const session = await prisma.session.update({
    where: { id },
    data: {
      status: SessionStatus.RECORDED,
      zoomRecordingEnc: encryptZoomUrl(body.zoomRecording),
      zoomPasscodeEnc: body.zoomPasscode ? encryptZoomUrl(body.zoomPasscode) : undefined,
    },
  });
  // Notify enrolled students
  const enrollments = await prisma.enrollment.findMany({
    where: { OR: [{ sessionId: id }, { courseId: session.courseId ?? undefined }] },
    select: { userId: true },
  });
  const userIds = [...new Set(enrollments.map((e) => e.userId))];
  await createBulkNotifications(userIds, NotificationType.RECORDING_READY, `Recording for "${session.title}" is now available.`);
  await audit(req, "SESSION_RECORDING_PUBLISHED", { entityType: "Session", entityId: id });
  res.json({ session: safeSession(session as unknown as Record<string, unknown>) });
}));

// DELETE /api/sessions/:id — SUPERADMIN only
router.delete("/:id", requireSuperAdmin, validate(z.object({
  params: z.object({ id: z.string().min(1) }),
})), asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  await prisma.session.delete({ where: { id } });
  await audit(req, "SESSION_DELETED", { entityType: "Session", entityId: id });
  res.status(204).send();
}));

// GET /api/sessions/:id/zoom-link — Auth + Enrolled → short-lived signed redirect
router.get("/:id/zoom-link", requireEnrollment, validate(z.object({
  params: z.object({ id: z.string().min(1) }),
})), asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  const session = await prisma.session.findUnique({ where: { id } });
  if (!session) throw new AppError(404, "Session not found", "NOT_FOUND");
  if (!session.zoomLiveEnc) throw new AppError(404, "No Zoom link set for this session", "NO_ZOOM_LINK");
  if (session.status !== SessionStatus.LIVE) {
    throw new AppError(403, "Session is not currently live", "SESSION_NOT_LIVE");
  }
  const zoomUrl = decryptZoomUrl(session.zoomLiveEnc);
  const passcode = session.zoomPasscodeEnc ? decryptZoomUrl(session.zoomPasscodeEnc) : undefined;
  const token = signShortToken(req.user!.id, id, "zoom-live");
  res.json({ token, zoomUrl, passcode, expiresInSeconds: 300 });
}));

// GET /api/sessions/:id/recording-url — Auth + Enrolled
router.get("/:id/recording-url", requireEnrollment, validate(z.object({
  params: z.object({ id: z.string().min(1) }),
})), asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  const session = await prisma.session.findUnique({ where: { id } });
  if (!session) throw new AppError(404, "Session not found", "NOT_FOUND");
  if (!session.zoomRecordingEnc) throw new AppError(404, "No recording available for this session", "NO_RECORDING");
  if (session.status !== SessionStatus.RECORDED && session.status !== SessionStatus.PROCESSING) {
    throw new AppError(403, "Recording not yet available", "RECORDING_NOT_AVAILABLE");
  }
  const passcode = session.zoomPasscodeEnc ? decryptZoomUrl(session.zoomPasscodeEnc) : undefined;
  const token = signShortToken(req.user!.id, id, "zoom-recording");
  const origin = `${req.protocol}://${req.get("host")}`;
  const playerUrl = `${origin}/api/sessions/${encodeURIComponent(id)}/recording-view?token=${encodeURIComponent(token)}`;
  res.json({ playerUrl, passcode, expiresInSeconds: 300 });
}));

export default router;
