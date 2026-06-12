import Link from "next/link";
import { Package, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";

interface Props { searchParams: Promise<{ order?: string }> }

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { order } = await searchParams;
  const t = await getTranslations("checkout");

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 bg-warm-white relative overflow-hidden">
      {/* Subtle Arabesque background overlay for luxury texture */}
      <div className="absolute inset-0 arabesque-bg opacity-[0.03] pointer-events-none" />

      {/* Gold radial aura background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] bg-soft-gold/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-2xl w-full bg-white border border-brand-100/60 shadow-luxury-lg px-6 py-12 sm:p-16 text-center relative z-10">
        {/* Top gold bar of luxury prestige */}
        <div className="absolute top-0 left-0 right-0 h-[4px] bg-gold-gradient" />

        {/* EL HUYAM in Arabic as header, in black, no Bismillah, no boule */}
        <p className="font-amiri text-5xl text-black font-semibold tracking-wide mb-8 leading-none select-none">
          الهُيَام
        </p>

        <h1 className="font-display text-2xl sm:text-3xl text-brand-900 font-light tracking-widest mb-2 uppercase">
          {t("success.title")}
        </h1>

        {/* Premium Divider */}
        <div className="flex items-center justify-center gap-4 my-6">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-soft-gold/30" />
          <span className="text-soft-gold text-xs">✦</span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-soft-gold/30" />
        </div>

        {/* Main Success message - with deep highly readable text color */}
        <p className="text-brand-900 text-sm sm:text-base mb-6 leading-relaxed max-w-lg mx-auto">
          {t("success.message")}
        </p>

        {/* Order Reference Badge - High Contrast & Extremely polished */}
        {order && (
          <div className="inline-block bg-brand-50 border border-brand-100/80 py-3 px-6 sm:px-8 mb-6">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-brand-800 font-medium">
              {t("success.orderRef")} <span className="text-black font-semibold font-mono tracking-wider pl-1">{order}</span>
            </p>
          </div>
        )}

        {/* Confirmation notification description */}
        <p className="text-xs sm:text-sm text-brand-600 max-w-md mx-auto mb-10 leading-relaxed">
          {t("success.emailSent")}
        </p>

        {/* Actions Button container */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {order && (
            <Link href={`/account/orders/${order}`} className="w-full sm:w-auto">
              <Button variant="luxury" size="lg" className="w-full justify-center gap-2 tracking-[0.15em] text-[10px] uppercase font-semibold py-4 px-8 rounded-none">
                <Package className="w-3.5 h-3.5 text-soft-gold" />
                {t("success.track")}
              </Button>
            </Link>
          )}
          <Link href="/shop" className="w-full sm:w-auto">
            <Button variant="luxury-outline" size="lg" className="w-full justify-center gap-2 tracking-[0.15em] text-[10px] uppercase font-semibold py-4 px-8 rounded-none">
              {t("success.continue")}
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
