import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans, Cairo, Amiri } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Providers from "@/components/providers";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";
import { auth } from "@/auth";
import { Analytics } from "@vercel/analytics/next";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

// Cairo: geometric sans-serif Arabic font — matches the site's clean aesthetic
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-arabic",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// Amiri: classical Arabic calligraphy serif font — perfect for slogans and quotes
const amiri = Amiri({
  subsets: ["arabic"],
  variable: "--font-amiri",
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "EL HUYAM",
    template: "%s | EL HUYAM",
  },
  description:
    "Embrace your identity with grace. Premium modest wear for the modern Muslim woman.",
  keywords: ["modest fashion", "abaya", "hijab", "khimar", "niqab", "luxury modest wear", "EL HUYAM"],
  openGraph: {
    type: "website",
    siteName: "EL HUYAM",
    title: "EL HUYAM  ",
    description: "Elegance in Modesty. Luxury Modest Fashion Reimagined.",
  },
  robots: { index: true, follow: true },
  verification: {
    google: "iMHtd7kTM8jeCZIBTSIdvgAc0UxkREu9lfcIVSJy9hw",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { cookies } from "next/headers";
import { RegionProvider, Region } from "@/providers/region-provider";
import { RegionModal } from "@/components/layout/region-modal";
import { getInternationalOrdersEnabled } from "@/lib/settings";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  
  const [cookieStore, isInternationalEnabled] = await Promise.all([
    cookies(),
    getInternationalOrdersEnabled(),
  ]);

  const regionCookie = cookieStore.get("region")?.value;
  let initialRegion: Region = (regionCookie === "ALGERIA" || regionCookie === "INTERNATIONAL") ? (regionCookie as Region) : null;

  if (!isInternationalEnabled) {
    initialRegion = "ALGERIA";
  }

  let session = null;
  try {
    session = await auth();
  } catch (error) {
    console.error("🔴 CRITICAL ERROR IN ROOT LAYOUT (NextAuth):", error);
  }

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className="scroll-smooth">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // PAGE_LOAD ping — fires when page is fully reachable on this device
              window.addEventListener('DOMContentLoaded', function() {
                try {
                  var t = performance.timing;
                  var loadTime = t.domContentLoadedEventEnd - t.navigationStart;
                  fetch('/api/debug-log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      level: 'PAGE_LOAD',
                      message: 'Page loaded successfully',
                      url: window.location.href,
                      loadTime: loadTime
                    })
                  });
                } catch(_) {}
              });
              // Client-side JS error capture
              window.addEventListener('error', function(e) {
                try {
                  // Ignore Facebook/Instagram IAB internal errors
                  if (e.filename && e.filename.indexOf('iabjs://') === 0) return;
                  fetch('/api/debug-log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      level: 'error',
                      message: e.message || 'Script error',
                      url: e.filename || window.location.href,
                      stack: e.error ? e.error.stack : null
                    })
                  });
                } catch(_) {}
              });
              window.addEventListener('unhandledrejection', function(e) {
                try {
                  fetch('/api/debug-log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      level: 'unhandledrejection',
                      message: String(e.reason),
                      url: window.location.href,
                      stack: e.reason && e.reason.stack ? e.reason.stack : null
                    })
                  });
                } catch(_) {}
              });
            `,
          }}
        />
        {locale === "ar" && (
          <style dangerouslySetInnerHTML={{ __html: `
            body {
              --font-display: var(--font-amiri) !important;
              --font-body: var(--font-arabic) !important;
            }
          `}} />
        )}
      </head>
      <body
        className={cn(
          "min-h-screen bg-warm-white text-brand-900 antialiased selection:bg-brand-200 selection:text-brand-900",
          cormorant.variable,
          dmSans.variable,
          cairo.variable,
          amiri.variable,
          // Switch the UI font to Cairo for Arabic — same weight/proportions, reads beautifully
          locale === "ar" ? "font-arabic" : "font-body"
        )}
      >
        <NextIntlClientProvider messages={messages} locale={locale}>
          <RegionProvider initialRegion={initialRegion} isInternationalEnabled={isInternationalEnabled}>
            <Providers session={session}>
              {children}
              <RegionModal />
              <Analytics />
            </Providers>
          </RegionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
