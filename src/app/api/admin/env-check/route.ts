import { auth } from "@/auth";
import { successResponse, errorResponse } from "@/lib/api-response";

function maskSecret(val?: string) {
  if (!val) return { isDefined: false, preview: "Not Set" };
  const len = val.length;
  const show = len > 8 ? `${val.slice(0, 4)}...${val.slice(-4)}` : "****";
  return { isDefined: true, length: len, preview: show };
}

function getHostFromUrl(urlStr?: string) {
  if (!urlStr) return "Not Set";
  try {
    const parsed = new URL(urlStr.replace(/^prisma:\/\//, "https://"));
    return parsed.hostname || "Invalid Host";
  } catch {
    return urlStr.replace(/:[^:@]+@/, ":***@").slice(0, 30);
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return errorResponse("Unauthorized", 401);
    }

    const envInfo = {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || "Not Set",
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "Not Set",
      NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || "Not Set",
      AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST || "Not Set",
      NEXTAUTH_SECRET: maskSecret(process.env.NEXTAUTH_SECRET),
      AUTH_SECRET: maskSecret(process.env.AUTH_SECRET),
      CLOUDINARY_URL: process.env.CLOUDINARY_URL ? "Defined (Set)" : "Not Set",
      CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "Not Set",
      DATABASE_URL: {
        isDefined: !!process.env.DATABASE_URL,
        host: getHostFromUrl(process.env.DATABASE_URL),
      },
      DIRECT_URL: {
        isDefined: !!process.env.DIRECT_URL,
        host: getHostFromUrl(process.env.DIRECT_URL),
      },
      timestamp: new Date().toISOString(),
    };

    // Print detailed structured diagnostic log to Vercel runtime console
    console.log("=================================================");
    console.log("🔍 [ENV DIAGNOSTIC LOG] RUNTIME ENVIRONMENT CONFIG");
    console.log("-------------------------------------------------");
    console.log("NEXTAUTH_URL          :", envInfo.NEXTAUTH_URL);
    console.log("NEXT_PUBLIC_APP_URL   :", envInfo.NEXT_PUBLIC_APP_URL);
    console.log("NEXT_PUBLIC_APP_NAME  :", envInfo.NEXT_PUBLIC_APP_NAME);
    console.log("AUTH_TRUST_HOST       :", envInfo.AUTH_TRUST_HOST);
    console.log("NEXTAUTH_SECRET       :", envInfo.NEXTAUTH_SECRET.preview);
    console.log("AUTH_SECRET           :", envInfo.AUTH_SECRET.preview);
    console.log("CLOUDINARY_URL        :", envInfo.CLOUDINARY_URL);
    console.log("CLOUDINARY_CLOUD_NAME :", envInfo.CLOUDINARY_CLOUD_NAME);
    console.log("DATABASE_URL Host     :", envInfo.DATABASE_URL.host);
    console.log("DIRECT_URL Host       :", envInfo.DIRECT_URL.host);
    console.log("=================================================");

    return successResponse(envInfo);
  } catch (err: any) {
    console.error("❌ [ENV DIAGNOSTIC LOG] Error:", err?.message || err);
    return errorResponse("Failed to inspect environment variables", 500);
  }
}
