import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getZRSettings } from "@/lib/zrexpress";
import { getInternationalOrdersEnabled, getEurExchangeRate } from "@/lib/settings";
import DeliverySettingsClient from "./delivery-settings-client";

export const metadata = { title: "Livraison & Commandes Internationales — Admin" };

export default async function DeliverySettingsPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/admin");

  const [settings, internationalOrdersEnabled, eurExchangeRate] = await Promise.all([
    getZRSettings(),
    getInternationalOrdersEnabled(),
    getEurExchangeRate(),
  ]);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl text-gray-900">Paramètres de Livraison & Commandes</h1>
        <p className="text-gray-400 text-sm mt-1">
          Gérez l'activation des <strong className="text-gray-700">commandes internationales (EUR)</strong>, le taux de change Square/Devise et la connexion <strong className="text-gray-700">ZR Express</strong>.
        </p>
      </div>

      <DeliverySettingsClient
        initialConfigured={!!settings}
        initialTenantId={settings?.tenantId ?? ""}
        initialInternationalOrdersEnabled={internationalOrdersEnabled}
        initialEurExchangeRate={eurExchangeRate}
      />
    </div>
  );
}
