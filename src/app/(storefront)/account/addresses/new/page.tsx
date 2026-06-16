"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { ChevronRight, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { WILAYAS } from "@/lib/wilayas";
import { Button } from "@/components/ui/button";

const addressFormSchema = z.object({
  label: z.string().min(1, "Label requis").max(50),
  firstName: z.string().min(1, "Prénom requis").max(100),
  lastName: z.string().min(1, "Nom requis").max(100),
  street: z.string().min(1, "Rue requise").max(200),
  city: z.string().min(1, "Ville/Commune requise").max(100),
  wilayaCode: z.string().min(1, "Wilaya requise").max(5),
  phone: z.string().min(9, "Téléphone requis").max(20),
  isDefault: z.boolean().optional().default(false),
});

type AddressFormValues = z.infer<typeof addressFormSchema>;

const inputCls = "w-full border border-neutral-200 px-4 py-3 text-sm text-black focus:outline-none focus:border-black transition-colors bg-white placeholder-neutral-300";
const labelCls = "block text-xs uppercase tracking-[0.15em] text-black mb-1.5 font-bold";
const errorCls = "mt-1 text-xs text-red-500";

export default function NewAddressPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const tAcc = useTranslations("account");
  const tCommon = useTranslations("common");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      label: "Maison",
      isDefault: false,
    },
  });

  const selectedWilayaCode = watch("wilayaCode");

  // Sync city when wilaya changes
  useEffect(() => {
    if (selectedWilayaCode) {
      const wilaya = WILAYAS.find(w => w.code === selectedWilayaCode);
      if (wilaya) {
        setValue("city", wilaya.name);
      }
    }
  }, [selectedWilayaCode, setValue]);

  // Protect client side route
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?callbackUrl=/account/addresses/new");
    }
  }, [status, router]);

  async function onSubmit(data: AddressFormValues) {
    setSaving(true);
    const selectedWilaya = WILAYAS.find(w => w.code === data.wilayaCode);
    
    try {
      const res = await fetch("/api/users/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: data.label,
          firstName: data.firstName,
          lastName: data.lastName,
          street: data.street,
          city: data.city,
          state: selectedWilaya ? selectedWilaya.name : "Alger",
          postalCode: data.wilayaCode,
          country: "Algérie",
          phone: data.phone,
          isDefault: data.isDefault,
        }),
      });

      const result = await res.json();
      if (!result.success) {
        toast.error(result.error ?? "Erreur lors de l'enregistrement de l'adresse");
        return;
      }

      toast.success("Adresse enregistrée avec succès !");
      router.push("/account?tab=addresses");
    } catch {
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <p className="text-neutral-500">{tCommon("loading")}</p>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-warm-white/20 min-h-screen animate-fade-in">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-brand-500 mb-10 select-none">
        <Link href="/account?tab=addresses" className="hover:text-brand-800 transition-colors">
          {tAcc("title")}
        </Link>
        <ChevronRight className="w-3 h-3 text-brand-300" />
        <span className="text-brand-800 font-medium">
          Nouvelle Adresse
        </span>
      </nav>

      <div className="bg-white border border-brand-100/60 shadow-luxury p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gold-gradient" />
        
        <div className="flex items-center gap-2.5 pb-4 border-b border-brand-100/50 mb-6">
          <MapPin className="w-5 h-5 text-soft-gold" />
          <h1 className="font-display text-xl text-black uppercase tracking-wider font-semibold">
            Ajouter une adresse
          </h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Label alias */}
          <div>
            <label className={labelCls}>Libellé de l'adresse *</label>
            <input
              {...register("label")}
              className={inputCls}
              placeholder="Ex: Maison, Bureau..."
            />
            {errors.label && <p className={errorCls}>{errors.label.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label className={labelCls}>Prénom *</label>
              <input
                {...register("firstName")}
                className={inputCls}
                placeholder="Prénom"
              />
              {errors.firstName && <p className={errorCls}>{errors.firstName.message}</p>}
            </div>

            {/* Last Name */}
            <div>
              <label className={labelCls}>Nom *</label>
              <input
                {...register("lastName")}
                className={inputCls}
                placeholder="Nom"
              />
              {errors.lastName && <p className={errorCls}>{errors.lastName.message}</p>}
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className={labelCls}>Téléphone *</label>
            <input
              {...register("phone")}
              type="tel"
              className={inputCls}
              placeholder="05XXXXXXXX"
            />
            {errors.phone && <p className={errorCls}>{errors.phone.message}</p>}
          </div>

          {/* Wilaya select */}
          <div>
            <label className={labelCls}>Wilaya *</label>
            <select {...register("wilayaCode")} className={inputCls}>
              <option value="">Sélectionnez votre wilaya...</option>
              {WILAYAS.map((w) => (
                <option key={w.code} value={w.code}>
                  ({w.code}) {w.name}
                </option>
              ))}
            </select>
            {errors.wilayaCode && <p className={errorCls}>{errors.wilayaCode.message}</p>}
          </div>

          {/* City / Commune */}
          <div>
            <label className={labelCls}>Ville / Commune *</label>
            <input
              {...register("city")}
              className={inputCls}
              placeholder="Ville"
            />
            {errors.city && <p className={errorCls}>{errors.city.message}</p>}
          </div>

          {/* Street Address */}
          <div>
            <label className={labelCls}>Adresse *</label>
            <input
              {...register("street")}
              className={inputCls}
              placeholder="Rue, Cité, Numéro de porte..."
            />
            {errors.street && <p className={errorCls}>{errors.street.message}</p>}
          </div>

          {/* Default address checkbox */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isDefault"
              {...register("isDefault")}
              className="w-4 h-4 accent-black border-neutral-300 rounded cursor-pointer"
            />
            <label htmlFor="isDefault" className="text-xs uppercase tracking-wider text-neutral-700 font-semibold cursor-pointer select-none">
              Définir comme adresse par défaut
            </label>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-brand-100/50 mt-6">
            <Link
              href="/account?tab=addresses"
              className="text-xs uppercase tracking-wider font-semibold text-neutral-500 hover:text-black transition-colors"
            >
              Annuler
            </Link>
            <Button
              type="submit"
              variant="luxury"
              loading={saving}
              className="px-6 h-11"
            >
              Enregistrer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
