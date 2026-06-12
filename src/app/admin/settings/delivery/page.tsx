import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getZRSettings } from "@/lib/zrexpress";
import DeliverySettingsClient from "./delivery-settings-client";

export const metadata = { title: "Service de Livraison — Admin" };

export default async function DeliverySettingsPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/admin");

  const settings = await getZRSettings();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl text-gray-900">Service de Livraison</h1>
        <p className="text-gray-400 text-sm mt-1">
          Configurez votre connexion avec <strong className="text-gray-600">ZR Express</strong> pour activer le suivi en temps réel.
        </p>
      </div>

      <DeliverySettingsClient
        initialConfigured={!!settings}
        initialTenantId={settings?.tenantId ?? ""}
      />
    </div>
  );
}
