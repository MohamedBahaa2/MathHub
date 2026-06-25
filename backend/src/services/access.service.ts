import { prisma } from "../config/database";
import { AppError } from "../utils/app-error";

/** Asserts that a user is enrolled in a session (directly or via course). */
export async function assertEnrolled(userId: string, sessionId: string): Promise<void> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { courseId: true },
  });
  if (!session) throw new AppError(404, "Session not found", "NOT_FOUND");

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      OR: [
        { sessionId },
        ...(session.courseId ? [{ courseId: session.courseId }] : []),
      ],
    },
  });

  if (!enrollment) {
    throw new AppError(403, "You are not enrolled in this session", "NOT_ENROLLED");
  }
}

/** Asserts that the requester either owns the resource or is SUPERADMIN/ASSISTANT. */
export function assertOwnerOrAdmin(
  requesterId: string,
  ownerId: string,
  requesterRole: string
): void {
  if (requesterId === ownerId) return;
  if (requesterRole === "SUPERADMIN" || requesterRole === "ASSISTANT") return;
  throw new AppError(403, "Access denied", "FORBIDDEN");
}
