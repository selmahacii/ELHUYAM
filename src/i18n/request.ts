import { getRequestConfig } from "next-intl/server";
import { defaultLocale, type Locale } from "./config";
import en from "../../messages/en.json";
import ar from "../../messages/ar.json";

const messages: Record<Locale, typeof en> = { en, ar };

export default getRequestConfig(async () => {
  // Static-friendly locale configuration.
  // Intentionally avoids calling cookies() or headers() server-side so Next.js App Router
  // can generate static HTML (SSG) and ISR pages for public routes (/faq, /terms, /shop/[slug], etc.).
  return {
    locale: defaultLocale,
    messages: messages[defaultLocale] as any,
  };
});
