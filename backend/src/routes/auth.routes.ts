import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { Router } from "express";
import { Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../config/database";
import { env } from "../config/env";
import { asyncHandler } from "../utils/async-handler";
import { AppError } from "../utils/app-error";
import { authenticate } from "../middlewares/auth";
import { authRateLimit } from "../middlewares/rate-limit";
import { validate } from "../middlewares/validate";
import { audit } from "../services/audit.service";
import { sendPasswordResetEmail } from "../services/email.service";
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../services/token.service";

const router = Router();

const loginSchema = z.object({
  body: z.object({
    email: z.string().email().transform((v) => v.toLowerCase().trim()),
    password: z.string().min(1),
  }),
});

const refreshSchema = z.object({
  body: z.object({ refreshToken: z.string().optional() }).default({}),
});

const forgotSchema = z.object({
  body: z.object({
    email: z.string().email().transform((v) => v.toLowerCase().trim()),
  }),
});

const resetSchema = z.object({
  body: z.object({
    token: z.string().min(1),
    password: z.string().min(8).max(128),
  }),
});

const publicUser = {
  id: true,
  name: true,
  email: true,
  role: true,
  studentCode: true,
  avatarUrl: true,
  isActive: true,
  createdAt: true,
} as const;

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/api/auth",
    domain: env.COOKIE_DOMAIN || undefined,
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  };
}

async function issueTokens(
  user: { id: string; email: string; role: Role },
  context: { ipAddress?: string; userAgent?: string }
) {
  const tokenId = crypto.randomUUID();
  const refreshToken = signRefreshToken(user.id, tokenId);
  await prisma.refreshToken.create({
    data: {
      id: tokenId,
      tokenHash: hashToken(refreshToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 86_400_000),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    },
  });
  return { accessToken: signAccessToken(user), refreshToken };
}

// POST /api/auth/login
router.post("/login", authRateLimit, validate(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body as z.infer<typeof loginSchema>["body"];
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    await audit(req, "AUTH_LOGIN_FAILED", { metadata: { email } });
    throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }
  if (!user.isActive) throw new AppError(403, "Account is deactivated", "ACCOUNT_UNAVAILABLE");

  const tokens = await issueTokens(user, { ipAddress: req.ip, userAgent: req.get("user-agent") });
  res.cookie("refreshToken", tokens.refreshToken, refreshCookieOptions());
  await audit(req, "AUTH_LOGIN", { actorId: user.id, entityType: "User", entityId: user.id });
  const safeUser = await prisma.user.findUnique({ where: { id: user.id }, select: publicUser });
  res.json({ user: safeUser, accessToken: tokens.accessToken });
}));

// POST /api/auth/refresh
router.post("/refresh", authRateLimit, validate(refreshSchema), asyncHandler(async (req, res) => {
  const token = (req.body as { refreshToken?: string }).refreshToken ?? req.cookies.refreshToken;
  if (!token) throw new AppError(401, "Refresh token required", "REFRESH_TOKEN_REQUIRED");
  const claims = verifyRefreshToken(token);
  const stored = await prisma.refreshToken.findUnique({
    where: { id: claims.jti },
    include: { user: true },
  });
  if (!stored || stored.tokenHash !== hashToken(token) || stored.revokedAt || stored.expiresAt <= new Date()) {
    throw new AppError(401, "Refresh token is no longer valid", "INVALID_REFRESH_TOKEN");
  }
  if (!stored.user.isActive) throw new AppError(403, "Account is deactivated", "ACCOUNT_UNAVAILABLE");

  const tokens = await issueTokens(stored.user, { ipAddress: req.ip, userAgent: req.get("user-agent") });
  const replacementClaims = verifyRefreshToken(tokens.refreshToken);
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date(), replacedBy: replacementClaims.jti },
  });
  res.cookie("refreshToken", tokens.refreshToken, refreshCookieOptions());
  res.json({ accessToken: tokens.accessToken });
}));

// POST /api/auth/logout
router.post("/logout", validate(refreshSchema), asyncHandler(async (req, res) => {
  const token = (req.body as { refreshToken?: string }).refreshToken ?? req.cookies.refreshToken;
  if (token) {
    try {
      const claims = verifyRefreshToken(token);
      await prisma.refreshToken.updateMany({
        where: { id: claims.jti, tokenHash: hashToken(token), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch {
      // Logout is idempotent
    }
  }
  res.clearCookie("refreshToken", refreshCookieOptions());
  res.status(204).send();
}));

// GET /api/auth/me
router.get("/me", authenticate, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: publicUser });
  res.json({ user });
}));

// PATCH /api/auth/me
router.patch("/me", authenticate, validate(z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    avatarUrl: z.string().url().optional(),
  }),
})), asyncHandler(async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: req.body as { name?: string; avatarUrl?: string },
    select: publicUser,
  });
  res.json({ user });
}));

// POST /api/auth/forgot-password
router.post("/forgot-password", authRateLimit, validate(forgotSchema), asyncHandler(async (req, res) => {
  const { email } = req.body as z.infer<typeof forgotSchema>["body"];
  // Always respond 200 to prevent email enumeration
  const user = await prisma.user.findUnique({ where: { email } });
  if (user && user.isActive) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    await prisma.passwordReset.create({
      data: {
        token: hashToken(rawToken),
        userId: user.id,
        expiresAt: new Date(Date.now() + 3_600_000), // 1 hour
      },
    });
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${rawToken}`;
    await sendPasswordResetEmail(user.email, user.name, resetUrl).catch(() => {
      // Don't leak errors to client
    });
  }
  res.json({ message: "If that email exists, a reset link has been sent." });
}));

// POST /api/auth/reset-password
router.post("/reset-password", authRateLimit, validate(resetSchema), asyncHandler(async (req, res) => {
  const { token, password } = req.body as z.infer<typeof resetSchema>["body"];
  const hashed = hashToken(token);
  const record = await prisma.passwordReset.findUnique({ where: { token: hashed } });
  if (!record || record.used || record.expiresAt <= new Date()) {
    throw new AppError(400, "Reset token is invalid or expired", "INVALID_RESET_TOKEN");
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordReset.update({ where: { id: record.id }, data: { used: true } }),
    // Revoke all refresh tokens for security
    prisma.refreshToken.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
  await audit(req, "AUTH_PASSWORD_RESET", { actorId: record.userId, entityType: "User", entityId: record.userId });
  res.json({ message: "Password has been reset. Please log in with your new password." });
}));

export default router;
