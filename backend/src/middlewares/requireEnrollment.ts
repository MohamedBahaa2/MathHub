import { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import { AppError } from "../utils/app-error";
import { assertEnrolled } from "../services/access.service";

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

    await assertEnrolled(req.user.id, sessionId);

    next();
  } catch (error) {
    next(error);
  }
}
