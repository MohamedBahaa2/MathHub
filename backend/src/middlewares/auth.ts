import { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../config/database";
import { AppError } from "../utils/app-error";
import { verifyAccessToken } from "../services/token.service";

function bearerToken(req: Request): string | undefined {
  const header = req.get("authorization");
  return header?.startsWith("Bearer ") ? header.slice(7) : undefined;
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = bearerToken(req);
    if (!token) throw new AppError(401, "Authentication required", "AUTH_REQUIRED");
    const claims = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: claims.sub },
      select: { id: true, email: true, role: true, isActive: true },
    });
    if (!user || !user.isActive) {
      throw new AppError(401, "Account is unavailable", "ACCOUNT_UNAVAILABLE");
    }
    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (error) {
    next(error);
  }
}

/** Alias for requireRole — kept for backward compat */
export const authorize = (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError(401, "Authentication required", "AUTH_REQUIRED"));
    if (!roles.includes(req.user.role)) return next(new AppError(403, "Insufficient permissions", "FORBIDDEN"));
    next();
  };
