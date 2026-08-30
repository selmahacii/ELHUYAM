import Link from "next/link";
import { db } from "@/lib/db";
import { getTranslations, getLocale } from "next-intl/server";
import { Instagram } from "lucide-react";
import { unstable_cache } from "next/cache";

const getFooterData = unstable_cache(
  async () => {
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
    return { categories, addressSetting, emailSetting, phoneSetting, contactTitleSetting };
  },
  ["footer-data"],
  { revalidate: 3600, tags: ["footer"] }
);

export default async function Footer() {
  const t = await getTranslations("footer");

  const {
    categories,
    addressSetting,
    emailSetting,
    phoneSetting,
    contactTitleSetting
  } = await getFooterData();

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
    <footer className="bg-[#050505] text-white border-t border-neutral-900 min-h-[380px]">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-12 md:py-20 grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-12">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1 flex flex-col items-center md:items-start text-center md:text-left">
          <Link href="/" className="mb-4">
            <span className="font-display text-2xl sm:text-3xl tracking-[0.25em] text-white transition-opacity hover:opacity-90">EL HUYAM</span>
          </Link>
          <p className="text-neutral-400 text-xs sm:text-sm font-light leading-relaxed tracking-wider max-w-xs">{t("description")}</p>
          <div className="flex gap-6 mt-8 justify-center md:justify-start">
            <a
              href="https://www.instagram.com/elhuyam_collection/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-neutral-500 hover:text-white transition-colors duration-300"
            >
              <Instagram className="w-[18px] h-[18px]" />
            </a>
            <a
              href="https://www.tiktok.com/@elhuyam_collection?is_from_webapp=1&sender_device=pc"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="text-neutral-500 hover:text-white transition-colors duration-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-[18px] h-[18px]"
              >
                <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
              </svg>
            </a>
          </div>
        </div>

        {/* Shop — dynamic from DB */}
        <div className="col-span-1 flex flex-col items-center md:items-start text-center md:text-left">
          <h4 className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-neutral-200 font-semibold mb-6">
            {t("shop")}
          </h4>
          <ul className="space-y-3 sm:space-y-4">
            {categories.map((cat: { name: string; slug: string }) => (
              <li key={cat.slug}>
                <Link
                  href={`/shop?category=${cat.slug}`}
                  className="text-xs sm:text-sm text-neutral-400 hover:text-white transition-colors duration-300 tracking-wider font-light block"
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Help */}
        <div className="col-span-1 flex flex-col items-center md:items-start text-center md:text-left">
          <h4 className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-neutral-200 font-semibold mb-6">
            {t("help")}
          </h4>
          <ul className="space-y-3 sm:space-y-4">
            {helpLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-xs sm:text-sm text-neutral-400 hover:text-white transition-colors duration-300 tracking-wider font-light block">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div className="col-span-2 md:col-span-1 flex flex-col items-center md:items-start text-center md:text-left">
          <h4 className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-neutral-200 font-semibold mb-6">
            {footerContactTitle}
          </h4>
          <address className="not-italic space-y-3 sm:space-y-4 text-xs sm:text-sm text-neutral-400 tracking-wider font-light flex flex-col items-center md:items-start">
            <p className="hover:text-white transition-colors duration-300">{footerAddress}</p>
            {footerEmail && (
              <a href={`mailto:${footerEmail}`} className="hover:text-white transition-colors duration-300 block">
                {footerEmail}
              </a>
            )}
            {footerPhone && (
              <a href={`tel:${footerPhone.replace(/\s+/g, "")}`} className="hover:text-white transition-colors duration-300 block">
                {footerPhone}
              </a>
            )}
          </address>
        </div>
      </div>

      <div className="border-t border-neutral-900/50">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <p className="text-neutral-500 text-[10px] tracking-wider uppercase font-light">
            &copy; {new Date().getFullYear()} EL HUYAM. {t("allRights")}
          </p>
          <div className="flex items-center gap-6">
            {legalLinks.map((link, i) => (
              <span key={link.href} className="flex items-center gap-4">
                <Link href={link.href} className="text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors uppercase tracking-wider font-light">
                  {link.label}
                </Link>
                {i < legalLinks.length - 1 && <span className="text-neutral-800 text-xs">·</span>}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
