import crypto from "node:crypto";
import { env } from "../config/env";
import { AppError } from "../utils/app-error";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;

function getKey(): Buffer {
  if (!env.ENCRYPTION_KEY) {
    throw new AppError(500, "ENCRYPTION_KEY is not configured", "CONFIG_ERROR");
  }
  return Buffer.from(env.ENCRYPTION_KEY, "hex");
}

/**
 * Encrypts a plaintext Zoom URL using AES-256-GCM.
 * Returns a base64-encoded string: IV (12 bytes) + AuthTag (16 bytes) + ciphertext.
 */
export function encryptZoomUrl(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

/**
 * Decrypts a base64-encoded encrypted Zoom URL.
 */
export function decryptZoomUrl(encoded: string): string {
  const key = getKey();
  const buf = Buffer.from(encoded, "base64");
  if (buf.length < IV_BYTES + TAG_BYTES + 1) {
    throw new AppError(400, "Invalid encrypted data", "DECRYPT_ERROR");
  }
  const iv = buf.subarray(0, IV_BYTES);
  const tag = buf.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const ciphertext = buf.subarray(IV_BYTES + TAG_BYTES);
  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(ciphertext) + decipher.final("utf8");
  } catch {
    throw new AppError(400, "Decryption failed — data may be tampered", "DECRYPT_ERROR");
  }
}
