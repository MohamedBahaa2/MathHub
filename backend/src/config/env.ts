import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_URL: z.string().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1),

  // JWT
  ACCESS_TOKEN_SECRET: z.string().min(32),
  REFRESH_TOKEN_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),

  // Cookies / CORS
  CORS_ORIGINS: z.string().default("http://localhost:3000"),
  COOKIE_DOMAIN: z.string().optional(),
  TRUST_PROXY: z.enum(["true", "false"]).default("false"),
  LOG_LEVEL: z.string().default("info"),

  // AES-256 for Zoom URLs (32-byte hex = 64 hex chars)
  ENCRYPTION_KEY: z.string().min(64).optional(),

  // Supabase
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_KEY: z.string().optional(),
  SUPABASE_BUCKET_ASSIGNMENTS: z.string().default("assignments"),
  SUPABASE_BUCKET_MATERIALS: z.string().default("materials"),
  SUPABASE_BUCKET_QUIZ_MEDIA: z.string().default("quiz-media"),

  // PayTabs
  PAYTABS_PROFILE_ID: z.string().optional(),
  PAYTABS_SERVER_KEY: z.string().optional(),
  PAYTABS_REGION: z.string().default("ARE"),
  PAYTABS_RETURN_URL: z.string().optional(),
  PAYTABS_WEBHOOK_URL: z.string().optional(),

  // Resend (email)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("noreply@mathhub.app"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment configuration", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration");
}

export const env = {
  ...parsed.data,
  CORS_ORIGINS: parsed.data.CORS_ORIGINS.split(",").map((v) => v.trim()).filter(Boolean),
  TRUST_PROXY: parsed.data.TRUST_PROXY === "true",
};
