import rateLimit from "express-rate-limit";

const base = { standardHeaders: "draft-8" as const, legacyHeaders: false };

export const authRateLimit = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: { error: { code: "RATE_LIMITED", message: "Too many authentication attempts" } }
});

export const zoomSignatureRateLimit = rateLimit({
  ...base,
  windowMs: 60 * 1000,
  limit: 30,
  message: { error: { code: "RATE_LIMITED", message: "Too many signature requests" } }
});
