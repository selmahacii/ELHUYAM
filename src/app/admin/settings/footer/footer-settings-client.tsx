"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FooterSettingsClientProps {
  initialContactTitle: string;
  initialAddress: string;
  initialEmail: string;
  initialPhone: string;
}

export default function FooterSettingsClient({
  initialContactTitle,
  initialAddress,
  initialEmail,
  initialPhone,
}: FooterSettingsClientProps) {
  const router = useRouter();
  const [contactTitle, setContactTitle] = useState(initialContactTitle);
  const [address, setAddress] = useState(initialAddress);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/footer-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactTitle,
          address,
          email,
          phone,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Une erreur est survenue");

      toast.success("Informations de contact du pied de page sauvegardées !");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message ?? "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Settings Card */}
      <div className="bg-white border border-gray-200 p-6 space-y-6">
        <div>
          <h2 className="font-display text-base text-gray-900 mb-1">Informations de contact (Pied de page)</h2>
          <p className="text-xs text-gray-400">
            Saisissez manuellement les informations qui s'affichent dans la section contact du pied de page.
          </p>
        </div>

        <div className="space-y-4">
          <Input
            label="Titre de contact (Ex: تواصلي معنا)"
            placeholder="تواصلي معنا"
            value={contactTitle}
            onChange={(e: any) => setContactTitle(e.target.value)}
          />

          <Input
            label="Adresse / Pays (Ex: Algérie)"
            placeholder="Algérie"
            value={address}
            onChange={(e: any) => setAddress(e.target.value)}
          />

          <Input
            label="Adresse E-mail"
            placeholder="hello@elhuyaam.com"
            type="email"
            value={email}
            onChange={(e: any) => setEmail(e.target.value)}
          />

          <Input
            label="Numéro de téléphone"
            placeholder="+213 772 51 54 48"
            value={phone}
            onChange={(e: any) => setPhone(e.target.value)}
          />

          {/* Action button */}
          <div className="pt-4 border-t border-gray-200 flex justify-end">
            <Button
              onClick={handleSave}
              className="px-8 py-5 text-xs uppercase tracking-widest font-semibold gap-2"
              variant="luxury"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sauvegarde en cours...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Sauvegarder les informations
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
