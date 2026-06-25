import { PrismaClient } from "@prisma/client";
import { env } from "./env";

declare global {
  var mathhubPrisma: PrismaClient | undefined;
}

export const prisma = global.mathhubPrisma ?? new PrismaClient({
  log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
});

if (env.NODE_ENV !== "production") global.mathhubPrisma = prisma;
