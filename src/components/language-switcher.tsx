"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { localeNames, type Locale } from "@/i18n/config";
import { Globe } from "lucide-react";

export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function switchLocale(next: Locale) {
    if (next === locale) return;
    await fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: next }),
    });
    startTransition(() => {
      router.refresh();
    });
  }

  const nextLocale: Locale = locale === "en" ? "ar" : "en";

  return (
    <button
      onClick={() => switchLocale(nextLocale)}
      disabled={isPending}
      aria-label={`Switch to ${localeNames[nextLocale]}`}
      className={`flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-medium transition-colors hover:opacity-70 disabled:opacity-40 ${className}`}
    >
      <Globe className="w-3.5 h-3.5 shrink-0" />
      <span>{localeNames[nextLocale]}</span>
    </button>
  );
}
