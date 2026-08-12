/** @type {import('next').NextConfig} */
const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const securityHeaders = [
  { key: "X-Frame-Options",        value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-XSS-Protection",       value: "1; mode=block" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Referrer-Policy",        value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",     value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
];

const nextConfig = {
  output: "standalone",
  serverExternalPackages: ["@prisma/client"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "pin.it" },
      { protocol: "https", hostname: "i.pinimg.com" },
      { protocol: "https", hostname: "**.pinimg.com" },
    ],
    // Images are already resized/compressed at the CDN level via
    // getOptimizedImageUrl() (Cloudinary w_/q_auto/f_auto params, Unsplash
    // query params, Pinterest size variants) before reaching next/image, so
    // Next's own Image Optimization pipeline would just reprocess an already
    // correctly-sized image — wasted latency and counts against Vercel's
    // Image Optimization request quota. Keep unoptimized.
    unoptimized: true,
  },
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3001", "elhuyam.com"] },
  },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      {
        source: "/:path*.(png|jpg|jpeg|gif|webp|svg|mp4|mov|webm|woff2|woff|ttf|ico)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);