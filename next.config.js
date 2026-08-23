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

const cdnCacheHeaders = [
  { key: "Cache-Control", value: "public, s-maxage=600, stale-while-revalidate=3600" },
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
    unoptimized: true,
  },
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000", "localhost:3001", "elhuyam.com", "*.elhuyam.com", "www.elhuyam.com", "*.vercel.app"] },
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
      // Public static & content pages: Cache on Vercel Edge CDN for 10 min, stale-while-revalidate for 1h
      // Triggers ZERO Vercel Function Invocations & 0 Active CPU when served from CDN!
      {
        source: "/(about|contact|faq|privacy|returns|shipping|terms|categories)",
        headers: cdnCacheHeaders,
      },
      {
        source: "/api/(categories|public-reviews)",
        headers: cdnCacheHeaders,
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);