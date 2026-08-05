const cleanStr = (s?: string) => (s ? s.trim().replace(/[<>'"\s]/g, "") : undefined);

export const CLOUDINARY_CONFIG = {
  cloudName: cleanStr(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) || "dzykepxqv",
  folder: "el-huyaam/products",
  defaultParams: "c_limit,f_auto,q_auto:eco",
  profiles: {
    product: "w_1200,c_limit,f_auto,q_auto:eco",
    thumbnail: "w_400,c_limit,f_auto,q_auto:eco",
  },
} as const;

/**
 * Base transformer enforcing strictly the 2 profile transformations:
 * - Product: w_1200,c_limit,f_auto,q_auto:eco
 * - Thumbnail: w_400,c_limit,f_auto,q_auto:eco
 */
export function transformCloudinaryUrl(
  urlOrPublicId: string | null | undefined,
  transformPreset: string = CLOUDINARY_CONFIG.profiles.product
): string {
  if (!urlOrPublicId || typeof urlOrPublicId !== "string") return "/placeholder-product.jpg";

  let fullUrl = urlOrPublicId;
  if (!fullUrl.startsWith("http://") && !fullUrl.startsWith("https://") && !fullUrl.startsWith("/")) {
    fullUrl = `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload/${urlOrPublicId}`;
  }

  if (!fullUrl.includes("res.cloudinary.com")) return fullUrl;

  const parts = fullUrl.split("/upload/");
  if (parts.length === 2) {
    const afterUpload = parts[1];
    const pathParts = afterUpload.split("/");
    
    // Check if the first path segment after /upload/ contains transformation flags
    if (pathParts.length > 1 && /^(w_|h_|c_|q_|f_|t_|r_|e_|b_|a_|dpr_)/.test(pathParts[0])) {
      return `${parts[0]}/upload/${transformPreset}/${pathParts.slice(1).join("/")}`;
    }
    return `${parts[0]}/upload/${transformPreset}/${afterUpload}`;
  }

  return fullUrl;
}

/**
 * Product main / detail image helper -> w_1200,c_limit,f_auto,q_auto:eco
 */
export function getProductImage(urlOrPublicId?: string | null): string {
  return transformCloudinaryUrl(urlOrPublicId, CLOUDINARY_CONFIG.profiles.product);
}

/**
 * Thumbnail / card image helper -> w_400,c_limit,f_auto,q_auto:eco
 */
export function getThumbnail(urlOrPublicId?: string | null): string {
  return transformCloudinaryUrl(urlOrPublicId, CLOUDINARY_CONFIG.profiles.thumbnail);
}

/**
 * Legacy compatibility alias for getOptimizedUrl
 */
export function getOptimizedUrl(
  url?: string | null,
  options: { width?: number; profile?: "product" | "thumbnail" } = {}
): string {
  if (!url) return "/placeholder-product.jpg";
  if (options.profile === "product" || (options.width && options.width > 400)) {
    return getProductImage(url);
  }
  return getThumbnail(url);
}
