import crypto from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env";
import { asyncHandler } from "../utils/async-handler";
import { AppError } from "../utils/app-error";
import { authenticate } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { prisma } from "../config/database";
import { SessionStatus, Role } from "@prisma/client";
import { decryptZoomUrl } from "../services/zoom.service";
import { assertEnrolled } from "../services/access.service";

const router = Router();
router.use(authenticate);

/**
 * Generate a Zoom Meeting SDK JWT signature (HS256).
 * Role 0 = Attendee (students), Role 1 = Host (not used here).
 * Token valid for 2 hours.
 */
function generateZoomSignature(meetingNumber: string, role: 0 | 1): string {
  if (!env.ZOOM_SDK_KEY || !env.ZOOM_SDK_SECRET) {
    throw new AppError(503, "Zoom SDK is not configured on this server", "ZOOM_NOT_CONFIGURED");
  }
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 7200;
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    sdkKey: env.ZOOM_SDK_KEY,
    mn: meetingNumber,
    role,
    iat,
    exp,
    appKey: env.ZOOM_SDK_KEY,
    tokenExp: exp,
  })).toString("base64url");
  const signingInput = `${header}.${payload}`;
  const sig = crypto.createHmac("sha256", env.ZOOM_SDK_SECRET!).update(signingInput).digest("base64url");
  return `${signingInput}.${sig}`;
}

// POST /api/zoom/signature
// Body: { sessionId }
// Returns all data the frontend needs to initialize the Zoom Meeting SDK
router.post("/signature", validate(z.object({
  body: z.object({ sessionId: z.string().min(1) }),
})), asyncHandler(async (req, res) => {
  const user = req.user!;
  const { sessionId } = req.body as { sessionId: string };

  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) throw new AppError(404, "Session not found", "NOT_FOUND");
  if (session.status !== SessionStatus.LIVE) {
    throw new AppError(403, "Session is not currently live", "SESSION_NOT_LIVE");
  }
  if (!session.zoomLiveEnc) {
    throw new AppError(404, "No Zoom meeting configured for this session", "NO_ZOOM_LINK");
  }

  // Admins bypass enrollment check; students must be enrolled or session must be standalone
  const isAdmin = user.role === Role.SUPERADMIN || user.role === Role.ASSISTANT;
  if (!isAdmin) {
    if (session.courseId) {
      await assertEnrolled(user.id, sessionId); // throws 403 if not enrolled
    }
    // standalone sessions (no courseId) are open to all authenticated users
  }

  // Decrypt the meeting URL and extract meeting number
  const zoomUrl = decryptZoomUrl(session.zoomLiveEnc);
  const match = zoomUrl.match(/zoom\.us\/j\/(\d+)/);
  if (!match) throw new AppError(400, "Invalid Zoom meeting URL — expected format: zoom.us/j/MEETINGNUMBER", "INVALID_ZOOM_URL");

  const meetingNumber = match[1]!;
  const signature = generateZoomSignature(meetingNumber, 0);

  // Fetch full user record for display name + student code (for watermark)
  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, email: true, studentCode: true },
  });

  const passcode = session.zoomPasscodeEnc ? decryptZoomUrl(session.zoomPasscodeEnc) : undefined;
  const watermarkId = fullUser?.studentCode || user.id.slice(0, 8).toUpperCase();

  res.json({
    signature,
    sdkKey: env.ZOOM_SDK_KEY,
    meetingNumber,
    passcode,
    userName: fullUser?.name || fullUser?.email || user.email,
    userEmail: user.email,
    watermarkId,         // used by the frontend overlay
    sessionTitle: session.title,
  });
}));

export default router;
