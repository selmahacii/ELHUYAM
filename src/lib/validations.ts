import { z } from "zod";

// ─── Auth ──────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Invalid email address").max(254),
  password: z.string().min(1, "Password is required").max(128),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").max(254),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  confirmPassword: z.string().max(128),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address").max(254),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1).max(256),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

// ─── Product ───────────────────────────────────────────────────────────────────

export const productSchema = z.object({
  title: z.string().min(2, "Title is required").max(200),
  slug: z.string().max(220).optional(),
  description: z.string().min(10, "Description must be at least 10 characters").max(5000),
  price: z.coerce.number().positive("Price must be positive").max(1_000_000),
  discountPrice: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().positive().max(1_000_000).nullable().optional()
  ),
  costPrice: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().min(0, "Cost price must be non-negative").max(1_000_000).nullable().optional()
  ),
  stock: z.coerce.number().int().min(0).max(100_000),
  sku: z.string().max(100).optional().nullable(),
  lowStockThreshold: z.coerce.number().int().min(0).max(10_000).optional().default(5),
  categoryId: z.string().min(1, "Category is required").max(50),
  images: z.array(z.string().max(500)).min(1, "Au moins une image est requise").max(10),
  videos: z.array(z.string().max(500)).optional().default([]),
  tags: z.array(z.string().max(50)).max(20).optional().default([]),
  featured: z.boolean().optional().default(false),
  bestseller: z.boolean().optional().default(false),
  newArrival: z.boolean().optional().default(true),
  metaTitle: z.string().max(160).optional().nullable(),
  metaDescription: z.string().max(320).optional().nullable(),
});

export const productVariantSchema = z.object({
  size: z.string().max(50).optional().nullable(),
  color: z.string().max(50).optional().nullable(),
  colorHex: z.string().max(7).optional().nullable(),
  image: z.string().max(500).optional().nullable(),
  stock: z.coerce.number().int().min(0).max(100_000),
  price: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().positive().max(1_000_000).nullable().optional()
  ),
  costPrice: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().min(0, "Cost price must be non-negative").max(1_000_000).nullable().optional()
  ),
});

// ─── Category ──────────────────────────────────────────────────────────────────

export const categorySchema = z.object({
  name: z.string().min(2, "Name is required").max(100),
  slug: z.string().max(120).optional(),
  description: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    z.string().max(1000).nullable().optional()
  ),
  image: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    z.string().max(500).nullable().optional()
  ),
  banner: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    z.string().max(500).nullable().optional()
  ),
  featured: z.boolean().optional().default(false),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional().default(0),
  parentId: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    z.string().max(50).nullable().optional()
  ),
});

// ─── Address ───────────────────────────────────────────────────────────────────

export const addressSchema = z.object({
  label: z.string().max(50).optional().default("Home"),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  street: z.string().min(1, "Street is required").max(200),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(1, "State/Region is required").max(100),
  postalCode: z.string().min(1, "Postal code is required").max(20),
  country: z.string().min(1, "Country is required").max(100),
  phone: z.string().max(20).optional().nullable(),
  isDefault: z.boolean().optional().default(false),
});

// ─── Order ─────────────────────────────────────────────────────────────────────

export const checkoutSchema = z.object({
  firstName: z.string().min(1, "Prénom requis").max(100),
  lastName: z.string().min(1, "Nom requis").max(100),
  phone: z.string().min(9, "Téléphone requis").max(20),
  isInternational: z.boolean().optional().default(false),
  country: z.string().max(100).optional(),
  wilayaCode: z.string().max(5).optional(),
  deliveryType: z.enum(["DOMICILE", "STOPDESK"]).optional(),
  street: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  couponCode: z.string().max(50).optional(),
  paymentMethod: z.enum(["stripe", "cod"]),
  notes: z.string().max(500).optional(),
}).refine((data) => {
  if (data.isInternational) {
    return !!data.country && data.country.trim().length > 0;
  } else {
    return !!data.wilayaCode && !!data.deliveryType;
  }
}, {
  message: "Veuillez remplir toutes les informations requises pour l'expédition.",
  path: ["wilayaCode"],
});

// ─── Review ────────────────────────────────────────────────────────────────────

export const reviewSchema = z.object({
  productId: z.string().min(1).max(50),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(150).optional().nullable(),
  comment: z.string().min(5, "Review must be at least 5 characters").max(2000).optional().nullable(),
  name: z.string().max(100).optional().nullable(),
});

// ─── Coupon ────────────────────────────────────────────────────────────────────

export const couponSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters").max(50).toUpperCase(),
  description: z.string().max(500).optional().nullable(),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.coerce.number().positive().max(100_000),
  minPurchase: z.coerce.number().min(0).max(1_000_000).optional().nullable(),
  maxUses: z.coerce.number().int().positive().max(1_000_000).optional().nullable(),
  isActive: z.boolean().optional().default(true),
  startsAt: z.string().datetime().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  productIds: z.array(z.string()).default([]),
});

// ─── Cart ──────────────────────────────────────────────────────────────────────

export const addToCartSchema = z.object({
  productId: z.string().min(1).max(50),
  variantId: z.string().max(50).optional().nullable(),
  quantity: z.coerce.number().int().min(1).max(50),
  size: z.string().max(50).optional().nullable(),
  color: z.string().max(50).optional().nullable(),
});

export const updateCartSchema = z.object({
  itemId: z.string().min(1).max(50),
  quantity: z.coerce.number().int().min(1).max(50),
});

// ─── Profile ───────────────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().max(20).optional().nullable(),
  image: z.string().max(500).optional().nullable(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required").max(128),
  newPassword: z.string().min(8, "New password must be at least 8 characters").max(128),
  confirmPassword: z.string().max(128),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// ─── Types ─────────────────────────────────────────────────────────────────────

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type CouponInput = z.infer<typeof couponSchema>;
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
