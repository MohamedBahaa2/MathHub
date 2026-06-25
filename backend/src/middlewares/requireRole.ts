import { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import { AppError } from "../utils/app-error";

/**
 * Middleware factory that requires the authenticated user to have one of the specified roles.
 * Usage: router.get('/admin', authenticate, requireRole('SUPERADMIN', 'ASSISTANT'), handler)
 */
export const requireRole = (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, "Authentication required", "AUTH_REQUIRED"));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, "Insufficient permissions", "FORBIDDEN"));
    }
    next();
  };

/** Shorthand: SUPERADMIN + ASSISTANT */
export const requireAdmin = requireRole(Role.SUPERADMIN, Role.ASSISTANT);

/** Shorthand: SUPERADMIN only */
export const requireSuperAdmin = requireRole(Role.SUPERADMIN);
