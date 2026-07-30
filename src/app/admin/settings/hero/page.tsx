import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import HeroSettingsClient from "./hero-settings-client";

export const metadata = {
  title: "Configuration Hero | EL HUYAM Admin",
};

export default async function HeroSettingsPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/auth/login");
  }

  const desktopSetting = await db.setting.findUnique({ where: { key: "hero_desktop_media" } });
  const mobileSetting = await db.setting.findUnique({ where: { key: "hero_mobile_media" } });

  const initialDesktop = desktopSetting?.value || "/hero-mobile.png";
  const initialMobile = mobileSetting?.value || "https://res.cloudinary.com/dzykepxqv/video/upload/q_auto,f_auto/v1785421463/el-huyaam/hero/hero-mobile.mov";

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Configuration Hero</h2>
          <p className="text-sm text-muted-foreground">
            Modifiez et ajoutez les photos/vidéos de la Hero Section pour la version Web (Desktop) et Mobile (Téléphone).
          </p>
        </div>
      </div>
      <HeroSettingsClient initialDesktop={initialDesktop} initialMobile={initialMobile} />
    </div>
  );
}
