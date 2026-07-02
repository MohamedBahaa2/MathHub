import { createClient, SupabaseClient } from "@supabase/supabase-js";
import fs from "node:fs/promises";
import nodePath from "node:path";
import { env } from "../config/env";
import { AppError } from "../utils/app-error";

let _client: SupabaseClient | undefined;
const localStorageRoot = nodePath.resolve(process.cwd(), "uploads");

function shouldUseLocalStorage(): boolean {
  return env.NODE_ENV !== "production" && (
    !env.SUPABASE_URL ||
    !env.SUPABASE_SERVICE_KEY ||
    env.SUPABASE_URL.includes("placeholder") ||
    env.SUPABASE_SERVICE_KEY === "placeholder"
  );
}

function safeLocalPath(bucket: string, objectPath: string): string {
  const target = nodePath.resolve(localStorageRoot, bucket, objectPath);
  if (!target.startsWith(`${localStorageRoot}${nodePath.sep}`)) {
    throw new AppError(400, "Invalid storage path", "INVALID_STORAGE_PATH");
  }
  return target;
}

async function uploadLocal(bucket: string, objectPath: string, buffer: Buffer): Promise<string> {
  const target = safeLocalPath(bucket, objectPath);
  await fs.mkdir(nodePath.dirname(target), { recursive: true });
  await fs.writeFile(target, buffer);
  const encodedPath = [bucket, ...objectPath.split("/")].map(encodeURIComponent).join("/");
  return `http://localhost:${env.PORT}/uploads/${encodedPath}`;
}

function getClient(): SupabaseClient {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    throw new AppError(503, "Storage service is not configured", "STORAGE_NOT_CONFIGURED");
  }
  if (!_client) {
    _client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    });
  }
  return _client;
}

export async function uploadFile(
  bucket: string,
  path: string,
  buffer: Buffer,
  mimetype: string
): Promise<string> {
  if (shouldUseLocalStorage()) {
    return uploadLocal(bucket, path, buffer);
  }
  const supabase = getClient();
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType: mimetype, upsert: false });
  if (error) {
    throw new AppError(502, `Storage upload failed: ${error.message}`, "STORAGE_UPLOAD_FAILED");
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteFile(bucket: string, path: string): Promise<void> {
  if (shouldUseLocalStorage()) {
    await fs.rm(safeLocalPath(bucket, path), { force: true });
    return;
  }
  const supabase = getClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    throw new AppError(502, `Storage delete failed: ${error.message}`, "STORAGE_DELETE_FAILED");
  }
}

export function getPublicUrl(bucket: string, path: string): string {
  if (shouldUseLocalStorage()) {
    const encodedPath = [bucket, ...path.split("/")].map(encodeURIComponent).join("/");
    return `http://localhost:${env.PORT}/uploads/${encodedPath}`;
  }
  const supabase = getClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export function getObjectPathFromPublicUrl(publicUrl: string, bucket: string): string {
  const url = new URL(publicUrl);
  const markers = [
    `/uploads/${bucket}/`,
    `/storage/v1/object/public/${bucket}/`,
  ];
  const marker = markers.find((candidate) => url.pathname.includes(candidate));
  if (!marker) {
    throw new AppError(400, "The stored media URL is not managed by this storage bucket", "INVALID_STORAGE_URL");
  }
  const objectPath = decodeURIComponent(url.pathname.split(marker)[1] ?? "");
  if (!objectPath) throw new AppError(400, "Invalid stored media URL", "INVALID_STORAGE_URL");
  return objectPath;
}

/** Validates MIME type and file size for uploads */
export function validateFile(
  mimetype: string,
  sizeBytes: number,
  allowedMimes: string[],
  maxBytes = 10 * 1024 * 1024 // 10 MB
): void {
  if (!allowedMimes.includes(mimetype)) {
    throw new AppError(415, `File type ${mimetype} is not allowed`, "INVALID_FILE_TYPE");
  }
  if (sizeBytes > maxBytes) {
    throw new AppError(413, `File exceeds maximum size of ${maxBytes / 1024 / 1024}MB`, "FILE_TOO_LARGE");
  }
}
