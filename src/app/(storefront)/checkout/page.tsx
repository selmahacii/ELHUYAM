"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCartStore } from "@/stores/cart-store";
import { formatPrice, getOptimizedImageUrl } from "@/lib/utils";
import { getThumbnail } from "@/lib/cloudinary";
import { WILAYAS, getShippingCost } from "@/lib/wilayas";
import { COUNTRIES } from "@/lib/countries";
import { COMMUNES } from "@/lib/communes";
import { BUREAUX } from "@/lib/bureaux";
import { useRegion } from "@/providers/region-provider";
import { cleanPhoneNumber, validatePhoneNumber } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { Check, Tag, Home, Store, Truck, MessageCircle, Mail, ShieldCheck, AlertTriangle, Phone, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";

const checkoutSchema = z.object({
  firstName: z.string().min(1, "Le prénom est obligatoire"),
  lastName: z.string().min(1, "Le nom est obligatoire"),
  phone: z.string().min(1, "Le numéro de téléphone est obligatoire"),
  email: z.string().transform(v => (v ? v.trim() : "")).refine((val) => val.length > 0, { message: "L'adresse e-mail est obligatoire" }).refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), { message: "Veuillez saisir une adresse e-mail valide" }),
  isInternational: z.boolean().optional().default(false),
  country: z.string().optional(),
  wilayaCode: z.string().optional(),
  deliveryType: z.enum(["DOMICILE", "STOPDESK"]).optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  commune: z.string().optional(),
  customCommune: z.string().optional(),
  bureau: z.string().optional(),
  paymentMethod: z.enum(["cod", "stripe"]),
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
  // Validate Phone
  const phoneRes = validatePhoneNumber(data.phone, data.isInternational);
  if (!phoneRes.isValid) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: phoneRes.error || "Numéro de téléphone invalide",
      path: ["phone"],
    });
  }

  // Validate Delivery details
  if (data.isInternational) {
    if (!data.country || data.country.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Veuillez sélectionner le pays de destination",
        path: ["country"],
      });
    }
    if (!data.street || data.street.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Veuillez préciser votre adresse complète",
        path: ["street"],
      });
    }
    if (!data.city || data.city.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Veuillez préciser votre ville",
        path: ["city"],
      });
    }
  } else {
    if (!data.wilayaCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Veuillez sélectionner votre wilaya",
        path: ["wilayaCode"],
      });
    }
    if (!data.deliveryType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Veuillez choisir le mode de livraison",
        path: ["deliveryType"],
      });
    }
    if (data.deliveryType === "DOMICILE") {
      if (!data.commune) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Veuillez sélectionner votre commune",
          path: ["commune"],
        });
      }
      if (data.commune === "AUTRE" && (!data.customCommune || data.customCommune.trim().length === 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Veuillez préciser le nom de votre commune",
          path: ["customCommune"],
        });
      }
      if (!data.street || data.street.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Veuillez préciser votre adresse (quartier, rue...)",
          path: ["street"],
        });
      }
    } else if (data.deliveryType === "STOPDESK") {
      if (!data.bureau) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Veuillez sélectionner le bureau de retrait Stop Desk",
          path: ["bureau"],
        });
      }
    }
  }
});
type CheckoutForm = z.infer<typeof checkoutSchema>;

const inputCls = "w-full border border-neutral-200 px-4 py-3 text-sm text-black focus:outline-none focus:border-black transition-colors bg-white placeholder-neutral-300";
const labelCls = "block text-xs uppercase tracking-[0.15em] text-black mb-1.5 font-bold";
const errorCls = "mt-1 text-xs text-red-500 font-medium";

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { items, subtotal, clearCart } = useCartStore();
  const { region, isInternationalEnabled } = useRegion();
  const [placing, setPlacing] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponValidating, setCouponValidating] = useState(false);
  const [couponApplied, setCouponApplied] = useState(false);
  const [showInternationalModal, setShowInternationalModal] = useState(false);

  const t = useTranslations("checkout");
  const tCart = useTranslations("cart");
  const tCommon = useTranslations("common");

  const regionIsInternational = isInternationalEnabled && region === "INTERNATIONAL";

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { paymentMethod: "cod", deliveryType: "DOMICILE", isInternational: regionIsInternational },
  });

  const isInternationalRaw = watch("isInternational");
  const isInternational = isInternationalEnabled && isInternationalRaw;
  const currency = isInternational ? "EUR" : "DZD";
  const sub = subtotal(isInternational);
  const selectedWilaya = watch("wilayaCode");
  const deliveryType = watch("deliveryType");
  const selectedCountry = watch("country");
  const selectedCommune = watch("commune");
  const shippingFee = !isInternational && selectedWilaya
    ? getShippingCost(selectedWilaya, deliveryType!, sub)
    : isInternational ? 0 : null;
  const total = Math.max(0, sub + (shippingFee ?? 0) - couponDiscount);

  const phoneValue = watch("phone") || "";
  const phoneValidationLive = validatePhoneNumber(phoneValue, isInternational);
  const cleanPhoneDigits = cleanPhoneNumber(phoneValue).replace(/\D/g, "");
  const isAlgerianPhone = !isInternational || /^(\+213|00213|213|0[567])/.test(cleanPhoneNumber(phoneValue));

  useEffect(() => {
    if (phoneValue && isInternationalEnabled) {
      const p = phoneValue.trim();
      if (p.length >= 2) {
        let detectedIntl = false;
        if (p.startsWith("+")) {
          if (!p.startsWith("+213")) {
            detectedIntl = true;
          }
        } else if (p.startsWith("00")) {
          if (!p.startsWith("00213")) {
            detectedIntl = true;
          }
        } else {
          const firstChar = p[0];
          if (firstChar >= "1" && firstChar <= "9") {
            if (!p.startsWith("213")) {
              detectedIntl = true;
            }
          }
        }

        if (detectedIntl && !isInternational) {
          setValue("isInternational", true);
          const matchedCountry = COUNTRIES.find(
            (c) => p.startsWith(c.code) || p.startsWith(c.code.replace("+", "00")) || p.startsWith(c.code.replace("+", ""))
          );
          if (matchedCountry) {
            setValue("country", matchedCountry.name);
          }
        }
      }
    }
  }, [phoneValue, isInternational, setValue]);

  useEffect(() => {
    if (selectedCountry) {
      const countryObj = COUNTRIES.find((c) => c.name === selectedCountry);
      if (countryObj) {
        const code = countryObj.code;
        const currentPhone = getValues("phone") || "";
        if (!currentPhone.startsWith("+")) {
          const cleanPhone = currentPhone.replace(/^0+/, "");
          setValue("phone", `${code} ${cleanPhone}`);
        } else {
          const oldCountry = COUNTRIES.find((c) => currentPhone.startsWith(c.code));
          if (oldCountry && oldCountry.code !== code) {
            setValue("phone", currentPhone.replace(oldCountry.code, code));
          } else if (!oldCountry) {
            setValue("phone", `${code} ${currentPhone}`);
          }
        }
      }
    }
  }, [selectedCountry, setValue, getValues]);

  async function validateCoupon() {
    if (!couponCode.trim()) return;
    setCouponValidating(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode,
          subtotal: sub,
          productIds: items.map((i) => i.productId),
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            variantId: item.variantId,
          })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCouponDiscount(data.data.discount);
        setCouponApplied(true);
        toast.success(`Coupon appliqué ! Vous économisez ${formatPrice(data.data.discount, currency)}`);
      } else {
        toast.error(data.error ?? "Coupon invalide");
      }
    } catch {
      toast.error("Échec de la validation du coupon");
    } finally {
      setCouponValidating(false);
    }
  }

  async function onSubmit(data: CheckoutForm) {
    if (items.length === 0) { toast.error(t("emptyCart")); return; }
    if (!data.isInternational && !data.wilayaCode) { toast.error("Please select your wilaya"); return; }
    if (data.isInternational && !data.country) { toast.error("Please select your destination country"); return; }
    setPlacing(true);
    try {
      let resolvedStreet = data.street;
      let resolvedCity = data.city;

      if (!data.isInternational) {
        if (data.deliveryType === "DOMICILE") {
          resolvedCity = data.commune === "AUTRE" ? data.customCommune : data.commune;
        } else if (data.deliveryType === "STOPDESK") {
          resolvedStreet = `Bureau Stop Desk: ${data.bureau}`;
          const matchedBureau = BUREAUX.find((b) => b.name === data.bureau);
          resolvedCity = matchedBureau ? matchedBureau.city : "Stop Desk Bureau";
        }
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          email: data.email,
          isInternational: data.isInternational,
          country: data.country,
          wilayaCode: data.isInternational ? undefined : data.wilayaCode,
          deliveryType: data.isInternational ? undefined : data.deliveryType,
          street: resolvedStreet,
          city: resolvedCity,
          paymentMethod: data.paymentMethod,
          notes: data.notes,
          couponCode: couponApplied ? couponCode : undefined,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            variantId: item.variantId,
            size: item.size,
            color: item.color,
          })),
        }),
      });
      const result = await res.json();
      if (!result.success) { toast.error(result.error ?? "Erreur lors de la commande"); return; }
      const order = result.data;
      clearCart();
      router.push(`/checkout/success?order=${order.orderNumber}`);
    } catch {
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setPlacing(false);
    }
  }

  const onFormError = (formErrors: typeof errors) => {
    console.warn("[Checkout] Validation errors:", formErrors);
    if (formErrors.firstName) toast.error(formErrors.firstName.message ?? "Prénom requis");
    else if (formErrors.lastName) toast.error(formErrors.lastName.message ?? "Nom requis");
    else if (formErrors.phone) toast.error(formErrors.phone.message ?? "Téléphone requis");
    else if (formErrors.email) toast.error(formErrors.email.message ?? "Email invalide");
    else if (formErrors.country) toast.error("Veuillez sélectionner le pays de destination");
    else if (formErrors.wilayaCode) toast.error("Veuillez sélectionner votre wilaya");
    else if (formErrors.deliveryType) toast.error("Veuillez choisir le mode de livraison");
    else if (formErrors.commune) toast.error("Veuillez sélectionner votre commune");
    else if (formErrors.customCommune) toast.error("Veuillez préciser le nom de votre commune");
    else if (formErrors.bureau) toast.error("Veuillez sélectionner le bureau de retrait Stop Desk");
    else if (formErrors.street) toast.error("Veuillez préciser votre adresse");
    else toast.error("Veuillez remplir tous les champs obligatoires");
  };

  if (status === "loading") {
    return <div className="max-w-2xl mx-auto px-4 py-24 text-center"><p className="text-neutral-500">{tCommon("loading")}</p></div>;
  }
  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-4">
        <p className="text-neutral-500">{t("emptyCart")}</p>
        <Link href="/shop" className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 text-xs uppercase tracking-widest hover:bg-neutral-900 transition-colors">
          {tCart("continueShopping")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {isInternationalEnabled && showInternationalModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/50 backdrop-blur-xs px-4">
          <div className="bg-white p-6 max-w-md w-full border border-neutral-200 shadow-2xl space-y-4 rounded-2xl">
            <div className="text-center space-y-2">
              <span className="text-3xl">🌍</span>
              <h3 className="font-display text-lg font-bold text-black">International Delivery</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Shipping fees for international orders vary depending on the destination country and package weight. They will be calculated and confirmed with you after validation.
              </p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl text-xs text-emerald-800 space-y-1.5 font-medium">
              <p className="font-bold">⚠️ Action Required:</p>
              <p>
                Please provide a valid phone number with <strong className="font-extrabold text-emerald-950">WhatsApp</strong> (including your country code, e.g. +33 for France). We will contact you on WhatsApp to confirm the final shipping fees before dispatch.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowInternationalModal(false)}
              className="w-full bg-black hover:bg-neutral-900 text-white py-3 text-xs uppercase tracking-widest font-bold transition-all"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.3em] text-neutral-500 mb-2">{t("title")}</p>
        <h1 className="font-display text-4xl text-black uppercase font-bold tracking-wider">{t("shippingAddress")}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onFormError)} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* LEFT: Form */}
        <div className="lg:col-span-2 space-y-8">
          {/* Destination Type Toggle (Only if International is Enabled by Admin) */}
          {isInternationalEnabled && (
            <div className="flex bg-neutral-100 p-1 border border-neutral-200 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => {
                  setValue("isInternational", false);
                  setValue("country", undefined);
                }}
                className={`flex-1 py-2.5 rounded-lg text-center transition-all ${
                  !isInternational
                    ? "bg-white text-black shadow-sm"
                    : "text-neutral-500 hover:text-black"
                }`}
              >
                🇩🇿 National Delivery (Algeria)
              </button>
              <button
                type="button"
                onClick={() => {
                  setValue("isInternational", true);
                  setShowInternationalModal(true);
                }}
                className={`flex-1 py-2.5 rounded-lg text-center transition-all ${
                  isInternational
                    ? "bg-white text-black shadow-sm"
                    : "text-neutral-500 hover:text-black"
                }`}
              >
                🌍 International Delivery
              </button>
            </div>
          )}

          {/* Contact */}
          <section className="space-y-4">
            <h2 className="font-display text-xl text-black font-bold border-b border-neutral-200 pb-3">{t("delivery")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{t("firstName")} *</label>
                <input {...register("firstName")} className={inputCls} placeholder="Aïcha" autoComplete="given-name" />
                {errors.firstName && <p className={errorCls}>{errors.firstName.message}</p>}
              </div>
              <div>
                <label className={labelCls}>{t("lastName")} *</label>
                <input {...register("lastName")} className={inputCls} placeholder="Benmoussa" autoComplete="family-name" />
                {errors.lastName && <p className={errorCls}>{errors.lastName.message}</p>}
              </div>
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs uppercase tracking-[0.15em] text-black font-bold flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-neutral-800" />
                    <span>{t("phone")} *</span>
                  </label>
                  {phoneValue && phoneValue.trim().length > 0 && isAlgerianPhone && (
                    <div>
                      {phoneValidationLive.isValid ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          10/10 chiffres (valide)
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border ${
                          cleanPhoneDigits.length < 10 
                            ? "bg-amber-50 text-amber-800 border-amber-200" 
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}>
                          <AlertTriangle className="w-3 h-3" />
                          {cleanPhoneDigits.length}/10 chiffres
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <input
                  {...register("phone")}
                  type="tel"
                  className={inputCls}
                  placeholder={isInternational ? "Ex: +33 6 12 34 56 78 (Indicatif pays inclus)" : "Ex: 0550123456 (10 chiffres)"}
                  autoComplete="tel"
                />
                {errors.phone && <p className={errorCls}>{errors.phone.message}</p>}

                {/* WhatsApp Order Confirmation Notice Box */}
                <div className="mt-3 p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl space-y-2 shadow-2xs">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                      <MessageCircle className="w-4 h-4 fill-white" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-[#14532D]">
                          Numéro WhatsApp obligatoire pour la confirmation
                        </p>
                        <span className="text-[9px] uppercase font-extrabold px-2 py-0.5 bg-[#DCFCE7] text-[#166534] border border-[#86EFAC] rounded-full">
                          Obligatoire
                        </span>
                      </div>
                      <p className="text-xs text-[#166534] leading-relaxed">
                        Le numéro indiqué <strong>doit impérativement être relié à un compte WhatsApp actif</strong>. Notre équipe vous contactera sur WhatsApp pour confirmer les détails de votre commande avant son expédition.
                      </p>
                      <div className="p-2.5 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-xs text-[#991B1B] font-semibold flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                        <p className="leading-snug">
                          <strong>Attention :</strong> Si nous ne parvenons pas à vous joindre sur WhatsApp, votre commande ne pourra être ni confirmée ni expédiée.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs uppercase tracking-[0.15em] text-black font-bold flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-neutral-800" />
                    <span>{t("email")} *</span>
                  </label>
                </div>
                <input
                  {...register("email")}
                  type="email"
                  inputMode="email"
                  className={inputCls}
                  placeholder="exemple@domaine.com"
                  autoComplete="email"
                />
                {errors.email && <p className={errorCls}>{errors.email.message}</p>}

                {/* Email Inbox Notice Box */}
                <div className="mt-2.5 p-3.5 bg-brand-50/80 border border-brand-200/80 rounded-2xl flex items-start gap-3 text-xs text-brand-900 shadow-2xs">
                  <div className="w-7 h-7 rounded-xl bg-brand-900 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-soft-gold" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-brand-950 text-xs">Vérification de votre boîte e-mail</p>
                    <p className="text-[11px] text-brand-800 leading-relaxed">
                      Votre récapitulatif de commande et votre reçu officiel vous seront envoyés immédiatement. <strong>Veuillez consulter votre boîte e-mail</strong> (ainsi que vos courriers indésirables / spams si nécessaire).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Wilaya + Delivery Type or Country */}
          <section className="space-y-4">
            <h2 className="font-display text-xl text-black font-bold border-b border-neutral-200 pb-3">
              {isInternational ? "Destination" : t("deliveryType")}
            </h2>

            {isInternational ? (
              <div>
                <label className={labelCls}>Destination Country *</label>
                <select
                  {...register("country")}
                  className={inputCls}
                >
                  <option value="">Select a country</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
                {errors.country && <p className={errorCls}>{errors.country.message}</p>}
              </div>
            ) : (
              <>
                {/* Delivery type */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "DOMICILE", label: t("domicile"), desc: t("domicileDesc"), icon: Home },
                    { value: "STOPDESK", label: t("stopdesk"), desc: t("stopDeskDesc"), icon: Store },
                  ].map(({ value, label, desc, icon: Icon }) => (
                    <label
                      key={value}
                      className={`flex items-start gap-3 p-4 border-2 cursor-pointer transition-all ${
                        deliveryType === value ? "border-black bg-neutral-50" : "border-neutral-200 hover:border-neutral-400"
                      }`}
                    >
                      <input type="radio" {...register("deliveryType")} value={value} className="mt-0.5 accent-black" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Icon className="w-3.5 h-3.5 text-neutral-800" />
                          <p className="text-sm font-semibold text-black">{label}</p>
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Wilaya selector */}
                <div>
                  <label className={labelCls}>{t("wilaya")} *</label>
                  <select
                    {...register("wilayaCode", {
                      onChange: () => {
                        setValue("commune", "");
                        setValue("customCommune", "");
                        setValue("bureau", "");
                      }
                    })}
                    className={inputCls}
                  >
                    <option value="">{t("selectWilaya")}</option>
                    {WILAYAS.map((w) => {
                      const rate = deliveryType === "STOPDESK" ? w.stopdesk : w.domicile;
                      return (
                        <option key={w.code} value={w.code} disabled={rate === 0} className="text-black font-medium">
                          ({w.code}) {w.name} —{" "}
                          {rate === 0
                            ? "Non disponible"
                            : `${rate} DZD`}
                        </option>
                      );
                    })}
                  </select>
                  {errors.wilayaCode && <p className={errorCls}>{errors.wilayaCode.message}</p>}
                </div>

                {/* Commune selector (Domicile only) */}
                {!isInternational && deliveryType === "DOMICILE" && selectedWilaya && (
                  <div>
                    <label className={labelCls}>Commune *</label>
                    <select {...register("commune")} className={inputCls}>
                      <option value="">Sélectionnez votre commune...</option>
                      {COMMUNES[selectedWilaya]?.map((comm) => (
                        <option key={comm} value={comm}>{comm}</option>
                      ))}
                      <option value="AUTRE">✦ Autre commune...</option>
                    </select>
                    {errors.commune && <p className={errorCls}>{errors.commune.message}</p>}
                  </div>
                )}

                {/* Custom Commune input (if AUTRE selected) */}
                {!isInternational && deliveryType === "DOMICILE" && selectedWilaya && selectedCommune === "AUTRE" && (
                  <div>
                    <label className={labelCls}>Nom de la commune *</label>
                    <input
                      {...register("customCommune")}
                      className={inputCls}
                      placeholder="Saisissez le nom de votre commune"
                    />
                    {errors.customCommune && <p className={errorCls}>{errors.customCommune.message}</p>}
                  </div>
                )}

                {/* Bureau Stop Desk selector (Stopdesk only) */}
                {!isInternational && deliveryType === "STOPDESK" && selectedWilaya && (
                  <div>
                    <label className={labelCls}>Bureau de retrait Stop Desk *</label>
                    <select {...register("bureau")} className={inputCls}>
                      <option value="">Sélectionnez le bureau de retrait...</option>
                      {BUREAUX.filter((b) => b.wilayaCode === selectedWilaya).map((b) => (
                        <option key={b.name} value={b.name}>
                          {b.nameAr} ({b.name.replace(/Hub\s+/i, "").replace(/\s+\d+\s+مكتب\s+\S+/i, "")}) — {b.address}
                        </option>
                      ))}
                    </select>
                    {errors.bureau && <p className={errorCls}>{errors.bureau.message}</p>}
                  </div>
                )}

                {/* Shipping cost info box */}
                {selectedWilaya && (
                  <div className={`flex items-center gap-3 px-4 py-3 border text-sm ${
                    (selectedWilaya && (deliveryType === "STOPDESK" ? WILAYAS.find(w => w.code === selectedWilaya)?.stopdesk === 0 : WILAYAS.find(w => w.code === selectedWilaya)?.domicile === 0))
                      ? "border-red-200 bg-red-50 text-red-700 font-medium"
                      : "border-neutral-200 bg-neutral-50 text-black font-semibold"
                  }`}>
                    <Truck className="w-4 h-4 shrink-0" />
                    {(deliveryType === "STOPDESK" ? WILAYAS.find(w => w.code === selectedWilaya)?.stopdesk === 0 : WILAYAS.find(w => w.code === selectedWilaya)?.domicile === 0) ? (
                      <span>⚠️ Delivery <strong>not available</strong> for this option in your wilaya.</span>
                    ) : (
                      <span>
                        Shipping fee: <strong>{formatPrice(shippingFee!, currency)}</strong>
                        {deliveryType === "DOMICILE" ? " (home delivery)" : " (stop desk)"}
                      </span>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Address input (International and Domicile only) */}
            {isInternational && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="sm:col-span-2">
                  <label className={labelCls}>{t("street")} *</label>
                  <input {...register("street")} className={inputCls} placeholder="Street address, building, apartment..." autoComplete="street-address" />
                  {errors.street && <p className={errorCls}>{errors.street.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>{t("city")} *</label>
                  <input {...register("city")} className={inputCls} placeholder="City, town, region..." autoComplete="address-level2" />
                  {errors.city && <p className={errorCls}>{errors.city.message}</p>}
                </div>
              </div>
            )}

            {!isInternational && deliveryType === "DOMICILE" && selectedWilaya && (
              <div className="pt-1">
                <label className={labelCls}>{t("street")} *</label>
                <input {...register("street")} className={inputCls} placeholder="Quartier, rue, numéro de maison..." autoComplete="street-address" />
                {errors.street && <p className={errorCls}>{errors.street.message}</p>}
              </div>
            )}
          </section>


          {/* Notes */}
          <section>
            <h2 className="font-display text-lg text-black font-semibold mb-3">{t("notes")}</h2>
            <textarea
              {...register("notes")}
              rows={3}
              placeholder={t("notesPlaceholder")}
              className={`${inputCls} resize-none`}
            />
          </section>
        </div>

        {/* RIGHT: Order summary */}
        <div className="lg:col-span-1">
          <div className="bg-neutral-50 border border-neutral-200 p-6 space-y-5 sticky top-28">
            <h2 className="font-display text-xl text-black font-bold">{t("orderSummary")}</h2>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 border-b border-neutral-100 pb-3 last:border-0 last:pb-0">
                  <div className="w-14 h-14 bg-neutral-200 shrink-0 relative overflow-hidden">
                    {item.image && <Image src={getThumbnail(item.image)} alt={item.title} fill sizes="56px" loading="lazy" className="object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-black truncate font-semibold">{item.title}</p>
                    {(item.size || item.color) && (
                      <p className="text-xs text-neutral-500">{[item.size, item.color].filter(Boolean).join(" · ")}</p>
                    )}
                    <p className="text-xs text-neutral-600 font-medium">Qté : {item.quantity}</p>
                  </div>
                  <span className="text-sm font-bold text-black shrink-0">{formatPrice((isInternational ? item.priceEur : item.price) * item.quantity, currency)}</span>
                </div>
              ))}
            </div>

            {/* Coupon */}
            <div className="border-t border-neutral-200 pt-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder={t("couponPlaceholder")}
                  disabled={couponApplied}
                  className="flex-1 border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-black disabled:bg-neutral-100 disabled:text-neutral-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={validateCoupon}
                  disabled={couponApplied || !couponCode || couponValidating}
                  className="px-3 border border-neutral-200 text-black hover:border-black disabled:opacity-40 transition-colors"
                >
                  {couponApplied ? <Check className="w-4 h-4 text-green-600" /> : <Tag className="w-4 h-4" />}
                </button>
              </div>
              {couponApplied && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Coupon appliqué
                </p>
              )}
            </div>

            {/* Totals */}
            <div className="space-y-2 text-sm border-t border-neutral-200 pt-4">
              <div className="flex justify-between text-neutral-700 font-medium">
                <span>{t("subtotal")}</span><span>{formatPrice(sub, currency)}</span>
              </div>
              <div className="flex justify-between text-neutral-700 font-medium">
                <span>{t("shipping")}</span>
                <span>
                  {isInternational ? (
                    <span className="text-emerald-600 font-semibold">Calculated after confirmation</span>
                  ) : shippingFee === null ? (
                    <span className="text-neutral-400 italic">{t("selectWilayaFirst")}</span>
                  ) : (
                    formatPrice(shippingFee, currency)
                  )}
                </span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>{t("discount")}</span><span>-{formatPrice(couponDiscount, currency)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-black border-t border-neutral-200 pt-3 text-base">
                <span>{t("total")}</span>
                <span>
                  {isInternational ? (
                    <span className="text-emerald-700 font-extrabold uppercase">Under Quote</span>
                  ) : shippingFee === null ? (
                    "—"
                  ) : (
                    formatPrice(total, currency)
                  )}
                </span>
              </div>
            </div>

            {/* Order Confirmation Steps & Security */}
            <div className="bg-white border border-neutral-200/90 p-4 rounded-2xl space-y-2.5 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-black border-b border-neutral-100 pb-2">
                <ShieldCheck className="w-4 h-4 text-soft-gold shrink-0" />
                <span className="uppercase tracking-wider text-[10px]">Confirmation & Expédition</span>
              </div>
              <div className="space-y-2 text-xs text-neutral-600">
                <div className="flex items-start gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <p className="leading-snug text-[11px]">
                    <strong className="text-black">Confirmation WhatsApp :</strong> Obligatoire avant préparation et expédition.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-brand-100 text-brand-800 text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <p className="leading-snug text-[11px]">
                    <strong className="text-black">Notification E-mail :</strong> Récapitulatif et suivi envoyés instantanément.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-neutral-100 text-neutral-800 text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <p className="leading-snug text-[11px]">
                    <strong className="text-black">Livraison :</strong> Remise à ZR Express après confirmation.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={
                !!(placing ||
                (!isInternational && (shippingFee === null ||
                (selectedWilaya &&
                  (deliveryType === "STOPDESK"
                    ? WILAYAS.find((w) => w.code === selectedWilaya)?.stopdesk === 0
                    : WILAYAS.find((w) => w.code === selectedWilaya)?.domicile === 0)))))
              }
              className="w-full bg-black text-white py-4 text-xs uppercase tracking-[0.25em] font-bold border border-black hover:bg-white hover:text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {placing ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t("processing")}
                </span>
              ) : t("placeOrder")}
            </button>

            <p className="text-xs text-neutral-500 text-center">
              {t("termsAgreement")}{" "}
              <Link href="/terms" className="underline hover:text-black transition-colors font-medium">
                {t("termsLink")}
              </Link>
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
