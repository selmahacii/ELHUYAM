import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { auth } from "@/auth";

const ALLOWED_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif", "image/avif",
  "video/mp4", "video/quicktime", "video/webm", "video/ogg"
]);
const MAX_SIZE = 150 * 1024 * 1024; // 150 MB

function checkMagicNumbers(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return true;
  }
  // GIF: GIF89a (47 49 46 38 39 61) or GIF87a (47 49 46 38 37 61)
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x39 || buffer[4] === 0x37) &&
    buffer[5] === 0x61
  ) {
    return true;
  }
  // WebP: RIFF (52 49 46 46) ... WEBP (57 45 42 50)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return true;
  }
  // WebM: 1A 45 DF A3
  if (
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  ) {
    return true;
  }
  // Ogg: OggS (4F 67 67 53)
  if (
    buffer[0] === 0x4f &&
    buffer[1] === 0x67 &&
    buffer[2] === 0x67 &&
    buffer[3] === 0x53
  ) {
    return true;
  }
  // MP4/MOV: checking for 'ftyp'
  if (
    buffer[4] === 0x66 &&
    buffer[5] === 0x74 &&
    buffer[6] === 0x79 &&
    buffer[7] === 0x70
  ) {
    return true;
  }
  // Quicktime (MOV) alternate ftyp or free/mdat/moov at start
  if (
    (buffer[4] === 0x6d && buffer[5] === 0x6f && buffer[6] === 0x6f && buffer[7] === 0x76) ||
    (buffer[4] === 0x6d && buffer[5] === 0x64 && buffer[6] === 0x61 && buffer[7] === 0x74) ||
    (buffer[4] === 0x66 && buffer[5] === 0x72 && buffer[6] === 0x65 && buffer[7] === 0x65)
  ) {
    return true;
  }

  return false;
}

const cleanEnvStr = (s?: string) => (s ? s.trim().replace(/[<>'"\s]/g, "") : undefined);
const CLOUDINARY_CONFIGURED =
  !!cleanEnvStr(process.env.CLOUDINARY_URL) ||
  (!!cleanEnvStr(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) &&
   !!cleanEnvStr(process.env.CLOUDINARY_API_KEY) &&
   !!cleanEnvStr(process.env.CLOUDINARY_API_SECRET));

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return errorResponse("Unauthorized", 401);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "el-huyaam/products";

    if (!file) return errorResponse("No file provided");
    if (file.size > MAX_SIZE) return errorResponse("Fichier trop volumineux. Maximum 150 Mo.");
    if (!ALLOWED_TYPES.has(file.type)) return errorResponse("Type de fichier invalide. Utilisez JPEG, PNG, WebP, GIF ou Vidéo (MP4, MOV, WEBM).");

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate magic numbers (signatures) for images and videos to prevent MIME spoofing
    if (!checkMagicNumbers(buffer)) {
      return errorResponse("Fichier non sécurisé ou type de fichier corrompu.", 400);
    }

    if (CLOUDINARY_CONFIGURED) {
      // ── Cloudinary upload ────────────────────────────────────────────────────
      const { uploadImage } = await import("@/lib/cloudinary");
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const dataUrl = `data:${file.type};base64,${base64}`;
      const result = await uploadImage(dataUrl, folder);
      return successResponse({ url: result.url });
    } else {
      // ── Local fallback (dev / no Cloudinary) ────────────────────────────────
      const { writeFile, mkdir } = await import("fs/promises");
      const { join, extname } = await import("path");

      const ext = extname(file.name).toLowerCase() || ".jpg";
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
      const uploadsDir = join(process.cwd(), "public", "uploads");
      await mkdir(uploadsDir, { recursive: true });
      await writeFile(join(uploadsDir, filename), Buffer.from(arrayBuffer));

      return successResponse({ url: `/uploads/${filename}` });
    }
  } catch (err) {
    console.error("[UPLOAD]", err);
    return errorResponse("Upload failed. Please try again.", 500);
  }
}
