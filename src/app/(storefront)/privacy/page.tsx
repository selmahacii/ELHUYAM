import type { Metadata } from "next";
export const metadata: Metadata = { title: "Confidentialité — EL HUYAM" };
export const revalidate = false; // Static page — no dynamic content
export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-12">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-400 mb-2">Politique</p>
        <h1 className="font-display text-4xl text-brand-900 mb-4">Politique de confidentialité</h1>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px w-12 bg-soft-gold" />
          <span className="text-soft-gold text-xs">✦</span>
        </div>
        <p className="text-brand-400 text-sm">Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</p>
      </div>
      <div className="space-y-8 text-brand-600 text-sm leading-relaxed">
        {[
          { title: "Informations que nous collectons", body: "Lorsque vous créez un compte ou passez une commande, nous collectons des informations personnelles telles que votre nom, adresse e-mail, adresse de livraison et informations de paiement. Nous collectons également des données de navigation pour améliorer votre expérience." },
          { title: "Utilisation de vos informations", body: "Nous utilisons vos informations pour :\n• Traiter et exécuter vos commandes\n• Envoyer des confirmations de commande et des mises à jour d'expédition\n• Répondre aux demandes du service client\n• Envoyer des communications marketing (avec votre consentement)\n• Améliorer notre site web et nos services" },
          { title: "Sécurité des données", body: "Nous mettons en œuvre des mesures de sécurité conformes aux standards du secteur pour protéger vos informations personnelles. Les données de paiement sont chiffrées via SSL et traitées par des prestataires conformes PCI-DSS. Nous ne stockons jamais les numéros de carte bancaire complets." },
          { title: "Cookies", body: "Nous utilisons des cookies pour améliorer votre expérience de navigation, mémoriser vos préférences et analyser le trafic du site. Vous pouvez contrôler les paramètres des cookies via votre navigateur." },
          { title: "Services tiers", body: "Nous pouvons partager vos informations avec des prestataires de services tiers de confiance qui nous aident à exploiter notre site web et notre activité, sous réserve d'accords de confidentialité." },
          { title: "Vos droits", body: "Vous avez le droit d'accéder, de mettre à jour ou de supprimer vos informations personnelles à tout moment. Vous pouvez également vous désabonner des communications marketing en cliquant sur « Se désabonner » dans tout e-mail ou en nous contactant directement." },
          { title: "Contact", body: "Pour toute question relative à la confidentialité, contactez-nous à privacy@elhuyaam.com." },
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
