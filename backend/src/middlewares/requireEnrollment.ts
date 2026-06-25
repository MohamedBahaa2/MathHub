import { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../config/database";
import { AppError } from "../utils/app-error";

/**
 * Middleware that verifies the authenticated user is enrolled in the session
 * specified by req.params.id (or req.params.sessionId).
 * Admins bypass this check.
 */
export async function requireEnrollment(req: Request, _res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError(401, "Authentication required", "AUTH_REQUIRED");

    // Admins bypass enrollment check
    if (req.user.role === Role.SUPERADMIN || req.user.role === Role.ASSISTANT) {
      return next();
    }

    const sessionId = (req.params.id ?? req.params.sessionId) as string;
    if (!sessionId) throw new AppError(400, "Session ID is required", "VALIDATION_ERROR");

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { courseId: true },
    });
    if (!session) throw new AppError(404, "Session not found", "NOT_FOUND");

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: req.user.id,
        OR: [
          { sessionId },
          ...(session.courseId ? [{ courseId: session.courseId }] : []),
        ],
      },
    });

    if (!enrollment) {
      throw new AppError(403, "You are not enrolled in this session", "NOT_ENROLLED");
    }

    next();
  } catch (error) {
    next(error);
  }
}
