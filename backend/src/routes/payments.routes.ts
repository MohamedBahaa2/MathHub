import crypto from "node:crypto";
import { Router, Request, Response, NextFunction } from "express";
import { Role, PurchaseType, PaymentStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../config/database";
import { asyncHandler } from "../utils/async-handler";
import { AppError } from "../utils/app-error";
import { authenticate } from "../middlewares/auth";

import { validate } from "../middlewares/validate";
import { audit } from "../services/audit.service";
import { initiatePayment, verifyWebhookSignature, isAllowedPayTabsIp } from "../services/paytabs.service";

const router = Router();

// PayTabs IP whitelist middleware (for webhook only)
function assertPayTabsIp(req: Request, _res: Response, next: NextFunction) {
  const ip = req.ip ?? "";
  const isDev = process.env.NODE_ENV !== "production";
  if (!isDev && !isAllowedPayTabsIp(ip)) {
    return next(new AppError(403, "Webhook source not allowed", "FORBIDDEN"));
  }
  next();
}


// POST /api/payments/initiate — STUDENT
router.post("/initiate", authenticate, validate(z.object({
  body: z.object({
    type: z.nativeEnum(PurchaseType),
    sessionId: z.string().optional(),
    courseId: z.string().optional(),
  }),
})), asyncHandler(async (req, res) => {
  const user = req.user!;
  if (user.role !== Role.STUDENT) throw new AppError(403, "Only students can initiate payments", "FORBIDDEN");

  const { type, sessionId, courseId } = req.body as { type: PurchaseType; sessionId?: string; courseId?: string };

  let amount = 0;
  let description = "";

  if (type === PurchaseType.SESSION && sessionId) {
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) throw new AppError(404, "Session not found", "NOT_FOUND");
    amount = session.sessionPrice ?? 0;
    description = `Session: ${session.title}`;
  } else if (type === PurchaseType.COURSE && courseId) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new AppError(404, "Course not found", "NOT_FOUND");
    amount = course.coursePrice;
    description = `Course: ${course.name}`;
  } else {
    throw new AppError(400, "Provide sessionId for SESSION type or courseId for COURSE type", "VALIDATION_ERROR");
  }
  if (amount <= 0) throw new AppError(400, "This item does not require an online payment", "PAYMENT_NOT_REQUIRED");

  const cartId = `MH-${crypto.randomUUID()}`;
  const fullUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  const target = type === PurchaseType.SESSION ? { sessionId } : { courseId };
  const existingEnrollment = await prisma.enrollment.findFirst({
    where: { userId: user.id, ...target },
    include: { payment: { select: { id: true, status: true } } },
  });
  if (existingEnrollment?.payment?.status === PaymentStatus.PENDING) {
    throw new AppError(409, "A payment is already pending for this item", "PAYMENT_PENDING");
  }
  if (existingEnrollment && existingEnrollment.payment?.status !== PaymentStatus.FAILED) {
    throw new AppError(409, "You are already enrolled in this item", "ALREADY_ENROLLED");
  }
  if (existingEnrollment?.payment?.status === PaymentStatus.FAILED) {
    await prisma.$transaction([
      prisma.payment.delete({ where: { id: existingEnrollment.payment.id } }),
      prisma.enrollment.delete({ where: { id: existingEnrollment.id } }),
    ]);
  }

  // The enrollment remains inaccessible until its related payment is PAID.
  const { enrollment, payment } = await prisma.$transaction(async (tx) => {
    const enrollment = await tx.enrollment.create({
      data: {
        userId: user.id,
        sessionId: type === PurchaseType.SESSION ? sessionId : undefined,
        courseId: type === PurchaseType.COURSE ? courseId : undefined,
        purchaseType: type,
      },
    });
    const payment = await tx.payment.create({
      data: {
        userId: user.id,
        enrollmentId: enrollment.id,
        amount,
        currency: "USD",
        type,
        status: PaymentStatus.PENDING,
        paytabsCartId: cartId,
      },
    });
    return { enrollment, payment };
  });

  let result;
  try {
    result = await initiatePayment({
      cartId,
      cartDescription: description,
      amount,
      currency: "USD",
      customerName: fullUser.name,
      customerEmail: fullUser.email,
    });
  } catch (error) {
    await prisma.$transaction([
      prisma.payment.delete({ where: { id: payment.id } }),
      prisma.enrollment.delete({ where: { id: enrollment.id } }),
    ]);
    throw error;
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { paytabsRef: result.transactionRef },
  });

  await audit(req, "PAYMENT_INITIATED", { entityType: "Payment", entityId: payment.id, metadata: { cartId, amount } });
  res.json({ paymentUrl: result.paymentUrl, paymentId: payment.id });
}));

// POST /api/payments/webhook — PayTabs callback (no auth, IP-checked)
router.post("/webhook", assertPayTabsIp, asyncHandler(async (req, res) => {
  const signature = req.get("signature") ?? "";
  if (!verifyWebhookSignature(req.rawBody ?? Buffer.alloc(0), signature)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const body = req.body as {
    cart_id?: string;
    tran_ref?: string;
    payment_result?: { response_status?: string };
  };

  const cartId = body.cart_id;
  if (!cartId) return res.status(400).json({ error: "Missing cart_id" });

  const payment = await prisma.payment.findUnique({ where: { paytabsCartId: cartId } });
  if (!payment) return res.status(404).json({ error: "Payment not found" });
  if (payment.status === PaymentStatus.PAID) return res.json({ received: true });

  const status = body.payment_result?.response_status;
  const newStatus = status === "A" ? PaymentStatus.PAID : PaymentStatus.FAILED;

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: newStatus,
      paytabsRef: body.tran_ref ?? payment.paytabsRef,
      paidAt: newStatus === PaymentStatus.PAID ? new Date() : undefined,
    },
  });

  res.json({ received: true });
}));

// GET /api/payments — STUDENT (own) or SUPERADMIN (all)
router.get("/", authenticate, asyncHandler(async (req, res) => {
  const user = req.user!;
  const where = user.role === Role.SUPERADMIN ? {} : { userId: user.id };
  const payments = await prisma.payment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { enrollment: { select: { sessionId: true, courseId: true } } },
  });
  res.json({ payments });
}));

// GET /api/payments/:id/receipt — Auth (own or SUPERADMIN)
router.get("/:id/receipt", authenticate, validate(z.object({
  params: z.object({ id: z.string().min(1) }),
})), asyncHandler(async (req, res) => {
  const user = req.user!;
  const payment = await prisma.payment.findUnique({ where: { id: req.params.id as string } });
  if (!payment) throw new AppError(404, "Payment not found", "NOT_FOUND");
  if (payment.userId !== user.id && user.role !== Role.SUPERADMIN) {
    throw new AppError(403, "Access denied", "FORBIDDEN");
  }
  res.json({ payment });
}));

export default router;
