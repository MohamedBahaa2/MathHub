import { PaymentStatus } from "@prisma/client";
import { prisma } from "../config/database";
import { AppError } from "../utils/app-error";

/**
 * Asserts that a user may access a session.
 * Standalone sessions are available to authenticated users; course-linked
 * sessions require a paid or free enrollment in that session/course.
 */
export async function assertEnrolled(userId: string, sessionId: string): Promise<void> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { courseId: true },
  });
  if (!session) throw new AppError(404, "Session not found", "NOT_FOUND");
  if (!session.courseId) return;

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      AND: [
        {
          OR: [
            { sessionId },
            ...(session.courseId ? [{ courseId: session.courseId }] : []),
          ],
        },
        {
          OR: [
            { payment: { is: null } },
            { payment: { is: { status: PaymentStatus.PAID } } },
          ],
        },
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
