import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

const SAFE_NAME = /^[a-zA-Z0-9._-]+$/;

export function uploadsDir() {
  return path.join(process.cwd(), "data", "uploads");
}

export function isSafeUploadName(filename: string) {
  return SAFE_NAME.test(filename) && !filename.includes("..");
}

export function mimeForUpload(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return TYPES[ext];
}

export async function saveUpload(file: File) {
  const ext = ALLOWED[file.type];
  if (!ext) {
    throw new Error("Formato non supportato. Usa JPG, PNG, WEBP o GIF.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Immagine troppo grande (max 5 MB).");
  }

  const filename = `${crypto.randomUUID()}.${ext}`;
  const dir = uploadsDir();
  await mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);
  return `/uploads/${filename}`;
}

export async function readUpload(filename: string) {
  if (!isSafeUploadName(filename)) return null;
  const type = mimeForUpload(filename);
  if (!type) return null;
  try {
    const data = await readFile(path.join(uploadsDir(), filename));
    return { data, type };
  } catch {
    return null;
  }
}

export async function deleteUpload(url: string | null | undefined) {
  if (!url?.startsWith("/uploads/")) return;
  const filename = url.slice("/uploads/".length);
  if (!isSafeUploadName(filename)) return;
  try {
    await unlink(path.join(uploadsDir(), filename));
  } catch {
    // already gone
  }
}
