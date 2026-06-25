import crypto from "node:crypto";
import jwt, { SignOptions } from "jsonwebtoken";
import { Role } from "@prisma/client";
import { env } from "../config/env";
import { AppError } from "../utils/app-error";

type AccessClaims = { sub: string; email: string; role: Role; type: "access" };
type RefreshClaims = { sub: string; jti: string; type: "refresh" };
type ShortClaims = { sub: string; sessionId: string; purpose: string; type: "short" };

export function signAccessToken(user: { id: string; email: string; role: Role }): string {
  return jwt.sign(
    { email: user.email, role: user.role, type: "access" },
    env.ACCESS_TOKEN_SECRET,
    { subject: user.id, expiresIn: env.ACCESS_TOKEN_TTL as SignOptions["expiresIn"] }
  );
}

export function signRefreshToken(userId: string, tokenId: string): string {
  return jwt.sign(
    { jti: tokenId, type: "refresh" },
    env.REFRESH_TOKEN_SECRET,
    { subject: userId, expiresIn: `${env.REFRESH_TOKEN_TTL_DAYS}d` }
  );
}

/** Issues a short-lived (5 min) signed token for Zoom URL delivery. */
export function signShortToken(userId: string, sessionId: string, purpose: "zoom-live" | "zoom-recording"): string {
  return jwt.sign(
    { sessionId, purpose, type: "short" },
    env.ACCESS_TOKEN_SECRET,
    { subject: userId, expiresIn: "5m" }
  );
}

export function verifyAccessToken(token: string): AccessClaims {
  try {
    const payload = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
    if (typeof payload === "string" || payload.type !== "access" || !payload.sub) throw new Error();
    return payload as AccessClaims;
  } catch {
    throw new AppError(401, "Invalid or expired access token", "INVALID_ACCESS_TOKEN");
  }
}

export function verifyRefreshToken(token: string): RefreshClaims {
  try {
    const payload = jwt.verify(token, env.REFRESH_TOKEN_SECRET);
    if (typeof payload === "string" || payload.type !== "refresh" || !payload.sub || !payload.jti) throw new Error();
    return payload as RefreshClaims;
  } catch {
    throw new AppError(401, "Invalid or expired refresh token", "INVALID_REFRESH_TOKEN");
  }
}

export function verifyShortToken(token: string): ShortClaims {
  try {
    const payload = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
    if (typeof payload === "string" || payload.type !== "short" || !payload.sub) throw new Error();
    return payload as ShortClaims;
  } catch {
    throw new AppError(401, "Invalid or expired short token", "INVALID_SHORT_TOKEN");
  }
}

export const hashToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");
