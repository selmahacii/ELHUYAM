import type { Metadata } from "next";

export const metadata: Metadata = { title: "FAQ — EL HUYAM" };

const faqs = [
  { q: "Comment trouver ma taille ?", a: "Nous fournissons un guide des tailles détaillé sur chaque page produit. Nos abayas sont disponibles du XS au XXXL. Pour des demandes de tailles personnalisées, veuillez nous contacter." },
  { q: "Quels matériaux utilisez-vous ?", a: "Nous utilisons des tissus premium : lin respirant, crêpe de chine soyeux, mousseline luxueuse et mélanges de coton doux. Les détails des matières sont indiqués sur chaque page produit." },
  { q: "Quel est le délai de livraison ?", a: "La livraison standard en Algérie prend 3 à 5 jours ouvrables. La livraison express prend 1 à 2 jours ouvrables. Les commandes internationales prennent 7 à 14 jours ouvrables." },
  { q: "La livraison est-elle gratuite ?", a: "Oui ! Nous offrons la livraison standard gratuite pour toute commande supérieure à 5 000 DZD en Algérie. En dessous de ce montant, des frais forfaitaires s'appliquent." },
  { q: "Quelle est votre politique de retour ?", a: "Nous acceptons les retours dans les 30 jours suivant la livraison. Les articles doivent être non portés, non lavés, dans leur emballage d'origine avec les étiquettes. Consultez notre politique de retour pour tous les détails." },
  { q: "Puis-je échanger un article ?", a: "Oui, les échanges sont possibles pour des tailles ou des couleurs différentes, sous réserve de disponibilité. Contactez notre équipe dans les 30 jours suivant la réception de votre commande." },
  { q: "Livrez-vous à l'international ?", a: "Oui, nous livrons dans le monde entier. Les tarifs et délais de livraison internationale varient selon la destination. Des droits de douane et taxes peuvent s'appliquer." },
  { q: "Comment suivre ma commande ?", a: "Une fois votre commande expédiée, vous recevrez un numéro de suivi par e-mail. Vous pouvez également suivre votre commande depuis votre espace compte." },
  { q: "Vos produits respectent-ils la pudeur islamique ?", a: "Absolument. Chaque pièce de notre collection est conçue dans le respect des principes de la pudeur islamique — entièrement couvrante, non transparente et non moulante." },
  { q: "Proposez-vous un emballage cadeau ?", a: "Yes! Select gift wrapping at checkout. Every order comes in our signature EL HUYAM box with tissue paper and a handwritten card option." },
];

export default function FAQPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center mb-14">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-400 mb-2 font-arabic">أسئلة شائعة</p>
        <h1 className="font-display text-4xl md:text-5xl text-brand-900 mb-4">Questions fréquentes</h1>
        <p className="text-brand-400 text-sm">Tout ce que vous devez savoir pour acheter chez EL HUYAM.</p>
        <div className="flex items-center gap-3 mt-6 max-w-xs mx-auto">
          <div className="h-px flex-1 bg-brand-100" />
          <span className="text-soft-gold">✦</span>
          <div className="h-px flex-1 bg-brand-100" />
        </div>
      </div>

      <div className="space-y-0 divide-y divide-brand-100">
        {faqs.map(({ q, a }) => (
          <details key={q} className="group py-6">
            <summary className="flex items-center justify-between cursor-pointer list-none">
              <h3 className="font-display text-lg text-brand-900 pr-8">{q}</h3>
              <div className="w-5 h-5 shrink-0 border border-brand-300 flex items-center justify-center text-brand-500 group-open:rotate-45 transition-transform duration-200">
                +
              </div>
            </summary>
            <p className="mt-4 text-brand-500 leading-relaxed text-sm">{a}</p>
          </details>
        ))}
      </div>

      <div className="mt-16 bg-brand-900 p-8 text-center">
        <h3 className="font-display text-xl text-white mb-3">Vous avez encore des questions ?</h3>
        <p className="text-white/60 text-sm mb-6">Notre équipe est disponible pour vous aider par e-mail ou WhatsApp.</p>
        <a href="/contact" className="inline-flex items-center gap-2 border border-soft-gold text-soft-gold px-6 py-3 text-xs uppercase tracking-widest hover:bg-soft-gold hover:text-brand-900 transition-colors font-medium">
          Contactez-nous
        </a>
      </div>
    </div>
  );
}
