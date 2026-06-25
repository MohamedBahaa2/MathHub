import pino from "pino";
import { env } from "./env";

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.password",
      "*.passwordHash",
      "*.token",
      "*.access_token",
      "*.refreshToken",
      "*.client_secret",
      "*.download_url",
      "*.play_url",
      "*.join_url",
      "*.start_url"
    ],
    censor: "[REDACTED]"
  }
});
