import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "EL HUYAM — Our Story" };

const values = [
  {
    arabic: "الحشمة",
    french: "Modestie",
    description:
      "Nous célébrons la modestie comme une forme d'expression de soi. Nos créations honorent la tradition tout en embrassant l'esthétique contemporaine.",
  },
  {
    arabic: "الجودة",
    french: "Qualité",
    description:
      "Nous utilisons uniquement les matières les plus nobles — linens respirants, crêpes soyeux et chiffons luxueux — conçus pour durer toute une vie.",
  },
  {
    arabic: "الأناقة",
    french: "Élégance",
    description:
      "Chaque décision de design est guidée par l'élégance. Du choix du tissu à la coupe de chaque vêtement, nous visons la perfection.",
  },
];

async function getStats() {
  const [customers, products, orders] = await Promise.all([
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.product.count({ where: { archived: false } }),
    db.order.count({ where: { status: "DELIVERED" } }),
  ]);
  return { customers, products, orders };
}

export default async function AboutPage() {
  const { customers, products, orders } = await getStats();
  return (
    <div>
      {/* Hero */}
      <section className="relative h-[65vh] flex items-end justify-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1544441892-794166f1e3be?q=80&w=2000&auto=format&fit=crop"
          alt="La Maison Huyaam"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="relative z-10 text-center px-4 pb-16">
          <p className="font-arabic text-soft-gold text-xl mb-3 animate-fade-in opacity-90">
            بيت الحياء
          </p>
          <h1 className="font-display text-5xl md:text-6xl text-white animate-slide-up">
            La Maison Huyaam
          </h1>
          <div className="flex items-center justify-center gap-4 mt-6">
            <div className="h-px w-16 bg-soft-gold/50" />
            <span className="text-soft-gold text-sm">✦</span>
            <div className="h-px w-16 bg-soft-gold/50" />
          </div>
          <p className="text-white/70 text-sm mt-4 uppercase tracking-[0.3em]">Notre Histoire</p>
        </div>
      </section>

      {/* Quran verse strip */}
      <div className="bg-emerald-900 text-center py-8 px-4">
        <p className="font-arabic text-white text-lg md:text-xl leading-relaxed mb-2">
          ﴿ وَقُل لِّلْمُؤْمِنَاتِ يَغْضُضْنَ مِنْ أَبْصَارِهِنَّ ﴾
        </p>
        <p className="text-emerald-300 text-xs uppercase tracking-widest">Sourate An-Nûr · Verset 31</p>
      </div>

      {/* Story */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="ornament-divider mb-8">
              <span className="text-soft-gold text-xs">✦</span>
            </div>
            <span className="text-[10px] uppercase tracking-[0.3em] text-soft-gold font-medium block mb-4">
              Notre Philosophie
            </span>
            <h2 className="font-display text-3xl md:text-4xl text-brand-900 mb-6 leading-tight">
              Née d&apos;un amour de la modestie et d&apos;un désir de luxe
            </h2>
            <p className="text-brand-600 leading-relaxed mb-5 text-sm">
              EL HUYAM a été fondée avec une vision singulière : créer une marque de mode modeste qui ne demande pas aux femmes de choisir entre leur foi et leur style. Nous croyons que la modestie n&apos;est pas une limitation — c&apos;est une expression d&apos;identité, de dignité et de grâce.
            </p>
            <p className="text-brand-600 leading-relaxed text-sm">
              Chaque pièce de notre collection est conçue avec la Muslimah moderne à l&apos;esprit — confectionnée à partir de matières premières, réfléchie dans sa construction et finie avec l&apos;attention aux détails qu&apos;exige le luxe.
            </p>
            <div className="mt-8 border-l-2 border-soft-gold/40 pl-4">
              <p className="font-arabic text-soft-gold text-base leading-relaxed">
                الحشمة في أبهى صورها
              </p>
              <p className="text-brand-400 text-xs mt-1 tracking-wider">
                La modestie dans sa plus belle forme
              </p>
            </div>
          </div>
          <div className="aspect-[4/5] relative bg-brand-100 shadow-luxury-lg">
            <Image
              src="https://images.unsplash.com/photo-1565324192624-6c72a3c9a574?q=80&w=800&auto=format&fit=crop"
              alt="Savoir-faire EL HUYAM"
              fill
              className="object-cover"
            />
            {/* Gold corner accents */}
            <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-soft-gold/60" />
            <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-soft-gold/60" />
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-brand-50 arabesque-bg py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-[10px] uppercase tracking-[0.35em] text-soft-gold font-medium block mb-4">
              Nos Valeurs
            </span>
            <h2 className="font-display text-3xl md:text-4xl text-brand-900 mb-2">Ce Que Nous Défendons</h2>
            <p className="font-arabic text-soft-gold opacity-70">ما نؤمن به</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {values.map(({ arabic, french, description }, i) => (
              <div key={french} className={`text-center animate-fade-in stagger-${i + 1}`}>
                {/* Islamic star ornament */}
                <div className="flex items-center justify-center mb-6">
                  <div className="w-12 h-12 border border-soft-gold/40 flex items-center justify-center rotate-45">
                    <div className="w-8 h-8 border border-soft-gold/20 flex items-center justify-center -rotate-45">
                      <span className="text-soft-gold text-xs">✦</span>
                    </div>
                  </div>
                </div>
                <p className="font-arabic text-soft-gold text-xl mb-1">{arabic}</p>
                <h3 className="font-display text-xl text-brand-900 mb-4">{french}</h3>
                <p className="text-brand-500 leading-relaxed text-sm">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-brand-900 py-16">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 md:grid-cols-3 gap-8 text-center">
          {[
            { num: customers.toLocaleString("fr-DZ"), label: "Clientes fidèles", arabic: "عميلة" },
            { num: products.toLocaleString("fr-DZ"), label: "Pièces disponibles", arabic: "قطعة" },
            { num: orders.toLocaleString("fr-DZ"), label: "Commandes livrées", arabic: "طلب" },
          ].map(({ num, label, arabic }) => (
            <div key={label}>
              <p className="font-display text-3xl text-white mb-1">{num}</p>
              <p className="text-brand-400 text-xs uppercase tracking-widest mb-1">{label}</p>
              <p className="font-arabic text-soft-gold text-sm opacity-60">{arabic}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center px-4 star-pattern">
        <div className="ornament-divider max-w-xs mx-auto mb-8">
          <span className="text-soft-gold text-xs">✦</span>
        </div>
        <h2 className="font-display text-3xl md:text-4xl text-brand-900 mb-3">
          Découvrez la Collection
        </h2>
        <p className="font-arabic text-soft-gold text-base mb-8 opacity-80">اكتشفي مجموعتنا</p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-3 bg-brand-900 text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-medium hover:bg-soft-gold transition-all duration-300"
        >
          Explorer la Boutique <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
