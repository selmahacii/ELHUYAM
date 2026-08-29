import type { Metadata } from "next";
export const metadata: Metadata = { title: "Conditions générales — EL HUYAM" };
export const revalidate = false; // Static page — no dynamic content
export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-12">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-400 mb-2">Politique</p>
        <h1 className="font-display text-4xl text-brand-900 mb-4">Conditions générales d&apos;utilisation</h1>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px w-12 bg-soft-gold" />
          <span className="text-soft-gold text-xs">✦</span>
        </div>
        <p className="text-brand-400 text-sm">Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</p>
      </div>
      <div className="space-y-8 text-brand-600 text-sm leading-relaxed">
        {[
          { title: "Acceptation des conditions", body: "En accédant et en utilisant le site web et les services EL HUYAM, vous acceptez d'être lié par ces Conditions générales d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser nos services." },
          { title: "Informations produit", body: "Nous faisons tout notre possible pour afficher nos produits aussi précisément que possible. Cependant, les couleurs peuvent légèrement varier selon les paramètres de votre écran. Nous nous réservons le droit de corriger toute erreur dans les descriptions de produits ou les prix." },
          { title: "Prix & Paiement", body: "Tous les prix sont affichés en dinars algériens (DZD) sauf indication contraire. Les prix sont susceptibles de changer sans préavis. Le paiement intégral est requis au moment de la commande." },
          { title: "Acceptation de commande", body: "Votre commande constitue une offre d'achat. Nous nous réservons le droit de refuser ou d'annuler toute commande pour quelque raison que ce soit, notamment la disponibilité des produits, des erreurs de description ou de prix, ou une activité frauduleuse." },
          { title: "Propriété intellectuelle", body: "Tout le contenu de ce site web, y compris les images, textes, logos et designs, est la propriété d'EL HUYAM et est protégé par les lois applicables sur la propriété intellectuelle. Toute utilisation non autorisée est interdite." },
          { title: "Limitation de responsabilité", body: "EL HUYAM ne saurait être tenu responsable de tout dommage indirect, accessoire, spécial ou consécutif découlant de l'utilisation de nos produits ou services." },
          { title: "Droit applicable", body: "Ces conditions sont régies par les lois algériennes. Tout litige sera résolu devant les tribunaux compétents d'Algérie." },
          { title: "Contact", body: "Pour toute question concernant ces conditions, veuillez nous contacter à legal@elhuyaam.com." },
        ].map(({ title, body }) => (
          <section key={title}>
            <h2 className="font-display text-xl text-brand-900 mb-3">{title}</h2>
            <p className="whitespace-pre-line">{body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
