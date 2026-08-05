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

export default cloudinary;
