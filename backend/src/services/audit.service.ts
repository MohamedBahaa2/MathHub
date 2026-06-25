import { Request } from "express";
import { prisma } from "../config/database";
import { jsonValue } from "../utils/json";

export async function audit(
  req: Request | undefined,
  action: string,
  options: { actorId?: string; entityType?: string; entityId?: string; metadata?: unknown } = {}
) {
  return prisma.auditLog.create({
    data: {
      actorId: options.actorId ?? req?.user?.id,
      action,
      entityType: options.entityType,
      entityId: options.entityId,
      ipAddress: req?.ip,
      userAgent: req?.get("user-agent"),
      metadata: jsonValue(options.metadata)
    }
  });
}
