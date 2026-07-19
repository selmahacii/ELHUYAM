import Link from "next/link";
import { db } from "@/lib/db";
import { getTranslations, getLocale } from "next-intl/server";
import { Instagram } from "lucide-react";

export default async function Footer() {
  const t = await getTranslations("footer");

  const [
    categories,
    addressSetting,
    emailSetting,
    phoneSetting,
    contactTitleSetting
  ] = await Promise.all([
    db.category.findMany({
      where: { parentId: null },
      orderBy: { sortOrder: "asc" },
      select: { name: true, slug: true },
    }),
    db.setting.findUnique({ where: { key: "footer_address" } }),
    db.setting.findUnique({ where: { key: "footer_email" } }),
    db.setting.findUnique({ where: { key: "footer_phone" } }),
    db.setting.findUnique({ where: { key: "footer_contact_title" } }),
  ]);

  const locale = await getLocale();
  let footerAddress = addressSetting?.value || "Algeria";
  if (footerAddress === "Algérie") {
    footerAddress = locale === "ar" ? "الجزائر" : "Algeria";
  }
  const footerEmail = emailSetting?.value || "hello@elhuyaam.com";
  const footerPhone = phoneSetting?.value || "+213 772 51 54 48";
  const footerContactTitle = contactTitleSetting?.value || t("contact");

  const helpLinks = [
    { label: t("trackOrder"), href: "/orders/track" },
    { label: t("faq"), href: "/faq" },
    { label: t("shipping"), href: "/shipping" },
    { label: t("contact"), href: "/contact" },
  ];

  const legalLinks = [
    { label: t("privacy"), href: "/privacy" },
    { label: t("terms"), href: "/terms" },
  ];

  return (
    <footer className="bg-black text-white">
      <div className="flex items-center justify-center py-4 md:py-6 gap-4 px-8">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-soft-gold/30" />
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-soft-gold/30" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16 grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
        {/* Brand */}
        <div className="col-span-2 sm:col-span-1 lg:col-span-1">
          <Link href="/" className="flex flex-col items-start gap-1 mb-6 group">
            <span className="font-display text-3xl tracking-[0.25em] text-white">EL HUYAM</span>
          </Link>
          <p className="text-white text-base md:text-lg font-display italic font-normal leading-relaxed tracking-wide">{t("description")}</p>
          <div className="flex gap-4 mt-12">
            <a
              href="https://www.instagram.com/elhuyam_collection/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-white/60 hover:text-soft-gold transition-colors"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="https://www.tiktok.com/@elhuyam_collection?is_from_webapp=1&sender_device=pc"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="text-white/60 hover:text-soft-gold transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
              </svg>
            </a>
          </div>
        </div>

        {/* Shop — dynamic from DB */}
        <div className="col-span-1">
          <h4 className="text-xs sm:text-sm uppercase tracking-[0.3em] text-white font-bold mb-4 md:mb-6 flex items-center gap-2 border-b border-white/10 pb-2">
            <span className="text-soft-gold text-[10px]">◆</span> {t("shop")}
          </h4>
          <ul className="space-y-2 md:space-y-3">
            {categories.map((cat: { name: string; slug: string }) => (
              <li key={cat.slug}>
                <Link
                  href={`/shop?category=${cat.slug}`}
                  className="text-xs sm:text-sm text-white/60 hover:text-soft-gold hover:ps-2 transition-all duration-300 tracking-wider font-light block"
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Help */}
        <div className="col-span-1">
          <h4 className="text-xs sm:text-sm uppercase tracking-[0.3em] text-white font-bold mb-4 md:mb-6 flex items-center gap-2 border-b border-white/10 pb-2">
            <span className="text-soft-gold text-[10px]">◆</span> {t("help")}
          </h4>
          <ul className="space-y-2 md:space-y-3">
            {helpLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-xs sm:text-sm text-white/60 hover:text-soft-gold hover:ps-2 transition-all duration-300 tracking-wider font-light block">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div className="col-span-2 sm:col-span-1 lg:col-span-1 flex flex-col items-center sm:items-start text-center sm:text-left">
          <h4 className="w-full text-xs sm:text-sm uppercase tracking-[0.3em] text-white font-bold mb-4 md:mb-6 flex items-center justify-center sm:justify-start gap-2 border-b border-white/10 pb-2">
            <span className="text-soft-gold text-[10px]">◆</span> {footerContactTitle}
          </h4>
          <address className="not-italic space-y-2 md:space-y-3 text-xs sm:text-sm text-white/70 tracking-wider font-light flex flex-col items-center sm:items-start">
            <p>{footerAddress}</p>
            {footerEmail && (
              <a href={`mailto:${footerEmail}`} className="block hover:text-soft-gold transition-colors">
                {footerEmail}
              </a>
            )}
            {footerPhone && (
              <a href={`tel:${footerPhone.replace(/\s+/g, "")}`} className="block hover:text-soft-gold transition-colors">
                {footerPhone}
              </a>
            )}
          </address>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-white/40 text-[11px] tracking-wider font-light">
            &copy; {new Date().getFullYear()} EL HUYAM. {t("allRights")}
          </p>
          <div className="flex items-center gap-4">
            <span className="text-soft-gold/40 text-xs font-arabic">✦</span>
            {legalLinks.map((link, i) => (
              <span key={link.href} className="flex items-center gap-4">
                <Link href={link.href} className="text-[11px] text-white/40 hover:text-soft-gold transition-colors tracking-wide font-light">
                  {link.label}
                </Link>
                {i < legalLinks.length - 1 && <span className="text-white/10 text-xs">·</span>}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
