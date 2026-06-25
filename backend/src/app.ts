import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { prisma } from "./config/database";
import { errorHandler, notFound } from "./middlewares/error-handler";
import { asyncHandler } from "./utils/async-handler";
import { AppError } from "./utils/app-error";

// Routes
import authRoutes from "./routes/auth.routes";
import usersRoutes from "./routes/users.routes";
import sessionsRoutes from "./routes/sessions.routes";
import coursesRoutes from "./routes/courses.routes";
import assignmentsRoutes from "./routes/assignments.routes";
import quizzesRoutes from "./routes/quizzes.routes";
import paymentsRoutes from "./routes/payments.routes";
import notificationRoutes from "./routes/notification.routes";
import helpRoutes from "./routes/help.routes";
import reportsRoutes from "./routes/reports.routes";

export const app = express();

if (env.TRUST_PROXY) app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(pinoHttp({ logger }));
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));
app.use(cors({
  credentials: true,
  origin(origin, callback) {
    if (!origin || env.CORS_ORIGINS.includes(origin)) return callback(null, true);
    callback(new AppError(403, "Origin is not allowed by CORS", "CORS_DENIED"));
  },
}));
app.use(compression());
app.use(express.json({
  limit: "1mb",
  verify(req, _res, buffer) {
    (req as express.Request).rawBody = Buffer.from(buffer);
  },
}));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));
app.use(cookieParser());

// Health checks
app.get("/health/live", (_req, res) => res.json({ status: "ok" }));
app.get("/health/ready", asyncHandler(async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "ready" });
}));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/sessions", sessionsRoutes);
app.use("/api/courses", coursesRoutes);
app.use("/api/assignments", assignmentsRoutes);
app.use("/api/quizzes", quizzesRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/help", helpRoutes);
app.use("/api/reports", reportsRoutes);

app.use(notFound);
app.use(errorHandler);
