import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import FooterSettingsClient from "./footer-settings-client";

export const metadata = {
  title: "Configuration Pied de Page | EL HUYAM Admin",
};

export default async function FooterSettingsPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/auth/login");
  }

  const contactTitleSetting = await db.setting.findUnique({ where: { key: "footer_contact_title" } });
  const addressSetting = await db.setting.findUnique({ where: { key: "footer_address" } });
  const emailSetting = await db.setting.findUnique({ where: { key: "footer_email" } });
  const phoneSetting = await db.setting.findUnique({ where: { key: "footer_phone" } });

  const initialContactTitle = contactTitleSetting?.value || "";
  const initialAddress = addressSetting?.value || "Algérie";
  const initialEmail = emailSetting?.value || "hello@elhuyaam.com";
  const initialPhone = phoneSetting?.value || "+213 772 51 54 48";

  return (
    <div className="flex-1 space-y-6 p-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Configuration du Pied de Page</h2>
          <p className="text-sm text-muted-foreground">
            Modifiez manuellement les coordonnées de contact qui s'affichent dans la section de pied de page du site.
          </p>
        </div>
      </div>
      <FooterSettingsClient
        initialContactTitle={initialContactTitle}
        initialAddress={initialAddress}
        initialEmail={initialEmail}
        initialPhone={initialPhone}
      />
    </div>
  );
}
