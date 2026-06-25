import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "../config/env";
import { AppError } from "../utils/app-error";

let _client: SupabaseClient | undefined;

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
  const supabase = getClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    throw new AppError(502, `Storage delete failed: ${error.message}`, "STORAGE_DELETE_FAILED");
  }
}

export function getPublicUrl(bucket: string, path: string): string {
  const supabase = getClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
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
