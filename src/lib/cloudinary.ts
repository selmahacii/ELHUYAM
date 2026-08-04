import { v2 as cloudinary } from "cloudinary";

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
    cloud_name: cleanStr(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME),
    api_key: cleanStr(process.env.CLOUDINARY_API_KEY),
    api_secret: cleanStr(process.env.CLOUDINARY_API_SECRET),
    secure: true,
  });
}

export async function uploadImage(
  file: string,
  folder = "el-huyaam/products"
): Promise<{ url: string; publicId: string }> {
  const result = await cloudinary.uploader.upload(file, {
    folder,
    resource_type: "auto",
    transformation: [
      { width: 1600, height: 1600, crop: "limit" },
      { quality: "auto", fetch_format: "auto" }
    ],
  });
  return { url: result.secure_url, publicId: result.public_id };
}

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export function getOptimizedUrl(
  url: string | null | undefined,
  options: { width?: number; height?: number; quality?: number } = {}
): string {
  if (!url || typeof url !== "string") return "";
  if (!url.includes("cloudinary.com")) return url;
  const { width, height, quality = 80 } = options;

  const transforms: string[] = [];
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (width && height) transforms.push("c_fill");
  transforms.push(`q_${quality}`);
  transforms.push("f_auto");

  const transformStr = transforms.join(",");
  return url.replace("/upload/", `/upload/${transformStr}/`);
}

export default cloudinary;
