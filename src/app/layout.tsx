import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans, Cairo, Amiri } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Providers from "@/components/providers";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";
import { auth } from "@/auth";

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
};

import { cookies } from "next/headers";
import { RegionProvider, Region } from "@/providers/region-provider";
import { RegionModal } from "@/components/layout/region-modal";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  
  const cookieStore = await cookies();
  const regionCookie = cookieStore.get("region")?.value;
  const initialRegion = (regionCookie === "ALGERIA" || regionCookie === "INTERNATIONAL") ? (regionCookie as Region) : null;

  let session = null;
  try {
    session = await auth();
  } catch (error) {
    console.error("🔴 CRITICAL ERROR IN ROOT LAYOUT (NextAuth):", error);
  }

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className="scroll-smooth">
      <head>
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
          <RegionProvider initialRegion={initialRegion}>
            <Providers session={session}>
              {children}
              <RegionModal />
            </Providers>
          </RegionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
