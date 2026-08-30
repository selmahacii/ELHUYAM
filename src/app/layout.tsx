import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans, Cairo, Amiri } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Providers from "@/components/providers";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";
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

import { RegionProvider } from "@/providers/region-provider";
import { RegionModal } from "@/components/layout/region-modal";
import { getInternationalOrdersEnabled } from "@/lib/settings";

// ─────────────────────────────────────────────────────────────────────────────
// ROOT LAYOUT — Intentionally does NOT call cookies() or auth().
//
// Calling those Dynamic APIs here would force EVERY route in the app to SSR,
// including totally static pages like /faq, /terms, /privacy, /shipping —
// destroying ISR and CDN caching for 100% of routes (confirmed: 0 ISR Reads).
//
// Instead:
// - Session is loaded client-side by SessionProvider (auto-fetches /api/auth/session)
// - Region cookie is read client-side by RegionProvider (document.cookie in useEffect)
// - isInternationalEnabled uses unstable_cache (no Dynamic API, safe here)
// ─────────────────────────────────────────────────────────────────────────────
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  // Safe: uses unstable_cache internally, does NOT call cookies()/headers()
  const isInternationalEnabled = await getInternationalOrdersEnabled();

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className="scroll-smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Client-side JS error capture only (no continuous pinging)
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
                  var msg = String(e.reason || '');
                  if (msg.indexOf('AbortError') !== -1 || msg.indexOf('Transition was skipped') !== -1) return;
                  fetch('/api/debug-log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      level: 'unhandledrejection',
                      message: msg,
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
        suppressHydrationWarning
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
          {/* initialRegion is null — RegionProvider reads document.cookie client-side */}
          <RegionProvider initialRegion={null} isInternationalEnabled={isInternationalEnabled}>
            {/* No session prop — SessionProvider auto-fetches /api/auth/session client-side */}
            <Providers>
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
