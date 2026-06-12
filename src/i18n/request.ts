import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { defaultLocale, locales, type Locale } from "./config";
import en from "../../messages/en.json";
import ar from "../../messages/ar.json";

const messages: Record<Locale, typeof en> = { en, ar };

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const raw = cookieStore.get("locale")?.value;
  const locale: Locale = (locales as readonly string[]).includes(raw ?? "")
    ? (raw as Locale)
    : defaultLocale;

  return {
    locale,
    messages: messages[locale] as any,
  };
});
