import { v2 as cloudinary } from "cloudinary";
import { CLOUDINARY_CONFIG } from "./cloudinary";

const cleanStr = (s?: string) => (s ? s.trim().replace(/[<>'"\s]/g, "") : undefined);

const rawUrl = process.env.CLOUDINARY_URL ? cleanStr(process.env.CLOUDINARY_URL) : null;

if (rawUrl) {
  const match = rawUrl.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
  if (match) {
    cloudinary.config({
      api_key: match[1],
      api_secret: match[2],
      cloud_name: match[3],
      secure: true,
    });
  } else {
    cloudinary.config({
      cloudinary_url: rawUrl,
      secure: true,
    });
  }
} else {
  cloudinary.config({
    cloud_name: CLOUDINARY_CONFIG.cloudName,
    api_key: cleanStr(process.env.CLOUDINARY_API_KEY),
    api_secret: cleanStr(process.env.CLOUDINARY_API_SECRET),
    secure: true,
  });
}

export async function uploadImage(
  file: string,
  folder: string = CLOUDINARY_CONFIG.folder
): Promise<{ url: string; publicId: string }> {
  const result = await cloudinary.uploader.upload(file, {
    folder,
    resource_type: "auto",
    transformation: [
      { width: 1200, crop: "limit" },
      { quality: "auto:eco", fetch_format: "auto" }
    ],
  });
  return { url: result.secure_url, publicId: result.public_id };
}

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

/**
 * Extracts publicId and resourceType ('image' | 'video' | 'raw') from a Cloudinary URL or ID.
 */
export function extractCloudinaryPublicId(
  urlOrId: string | null | undefined
): { publicId: string; resourceType: "image" | "video" | "raw" } | null {
  if (!urlOrId || typeof urlOrId !== "string") return null;
  const clean = urlOrId.trim();
  if (!clean) return null;

  const isVideo = /\.(mp4|mov|webm|ogg|quicktime)($|\?)/i.test(clean) || clean.includes("/video/upload/");

  // If already a public_id (no protocol and no leading /uploads/)
  if (!clean.startsWith("http://") && !clean.startsWith("https://") && !clean.startsWith("/")) {
    const withoutExt = clean.replace(/\.[a-zA-Z0-9]+$/, "");
    return { publicId: withoutExt, resourceType: isVideo ? "video" : "image" };
  }

  // If it's a Cloudinary URL
  if (clean.includes("res.cloudinary.com")) {
    const match = clean.match(/\/upload\/(?:[^\/]+\/)?(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?(?:$|\?)/);
    if (match && match[1]) {
      const segments = match[1].split("/");
      const cleanSegments = segments.filter(
        (seg) => !/^(w_|h_|c_|q_|f_|t_|r_|e_|b_|a_|dpr_|v\d+$)/.test(seg) && !seg.includes(",")
      );
      const publicId = cleanSegments.join("/").replace(/\.[a-zA-Z0-9]+$/, "");
      return { publicId, resourceType: isVideo ? "video" : "image" };
    }
  }

  return null;
}

/**
 * Deletes media asset from Cloudinary or local uploads.
 */
export async function deleteMediaByUrlOrId(urlOrId: string | null | undefined): Promise<void> {
  if (!urlOrId || typeof urlOrId !== "string") return;

  const extracted = extractCloudinaryPublicId(urlOrId);
  if (extracted) {
    try {
      await cloudinary.uploader.destroy(extracted.publicId, {
        resource_type: extracted.resourceType,
        invalidate: true,
      });
      console.log(`[Cloudinary] Successfully deleted ${extracted.resourceType}: ${extracted.publicId}`);
    } catch (err) {
      console.warn(`[Cloudinary] Failed to delete ${extracted.publicId}:`, err);
    }
    return;
  }

  // If local /uploads/ file
  if (urlOrId.startsWith("/uploads/")) {
    try {
      const { unlink } = await import("fs/promises");
      const { join } = await import("path");
      const filename = urlOrId.replace(/^\/uploads\//, "");
      const filePath = join(process.cwd(), "public", "uploads", filename);
      await unlink(filePath).catch(() => null);
      console.log(`[Local Uploads] Successfully deleted file: ${filePath}`);
    } catch (err) {
      console.warn(`[Local Uploads] Failed to delete local file ${urlOrId}:`, err);
    }
  }
}

/**
 * Deletes multiple media assets in parallel with error tolerance.
 */
export async function deleteMultipleMedia(urlsOrIds: (string | null | undefined)[]): Promise<void> {
  const valid = Array.from(new Set(urlsOrIds.filter((u): u is string => !!u && typeof u === "string")));
  if (valid.length === 0) return;
  await Promise.allSettled(valid.map((u) => deleteMediaByUrlOrId(u)));
}

export default cloudinary;
