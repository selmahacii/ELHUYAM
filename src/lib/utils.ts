import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, currency = "DZD"): string {
  if (currency === "EUR") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    }).format(amount).replace(/[\u00a0\u202f]/g, " ");
  }
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency: "DZD",
    minimumFractionDigits: 2,
  }).format(amount).replace(/[\u00a0\u202f]/g, " ");
}

export function formatDate(date: Date | string): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date)).replace(/[\u00a0\u202f]/g, " ");
}

export function formatDateTime(date: Date | string): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(date)).replace(/[\u00a0\u202f]/g, " ");
}

import slugifyPkg from "slugify";

export function slugify(str: string): string {
  return slugifyPkg(str, {
    lower: true,
    strict: true,
    trim: true,
  });
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ELH-${timestamp}-${random}`;
}

export function calculateDiscountPercent(price: number, discountPrice: number): number {
  return Math.round(((price - discountPrice) / price) * 100);
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).trim() + "…";
}

export function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== "") qs.set(key, String(val));
  }
  return qs.toString();
}

export function getOptimizedImageUrl(url?: string | null, width = 400): string {
  if (!url) return "/placeholder-product.jpg";

  // Cloudinary
  if (url.includes("res.cloudinary.com")) {
    const parts = url.split("/upload/");
    if (parts.length === 2) {
      return `${parts[0]}/upload/w_${width},q_auto,f_auto/${parts[1]}`;
    }
  }

  // Unsplash
  if (url.includes("images.unsplash.com")) {
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set("w", width.toString());
      urlObj.searchParams.set("q", "80");
      urlObj.searchParams.set("auto", "format");
      return urlObj.toString();
    } catch {
      return url;
    }
  }

  // Pinterest
  if (url.includes("i.pinimg.com")) {
    return url.replace("/originals/", "/564x/");
  }

  return url;
}
