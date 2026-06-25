import { NotificationType } from "@prisma/client";
import { prisma } from "../config/database";

export async function createNotification(
  userId: string,
  type: NotificationType,
  message: string
): Promise<void> {
  await prisma.notification.create({
    data: { userId, type, message },
  });
}

export async function createBulkNotifications(
  userIds: string[],
  type: NotificationType,
  message: string
): Promise<void> {
  if (userIds.length === 0) return;
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({ userId, type, message })),
    skipDuplicates: true,
  });
}
