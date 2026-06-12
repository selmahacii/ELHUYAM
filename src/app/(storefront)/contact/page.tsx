"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { useTranslations } from "next-intl";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const t = useTranslations("contact");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) { toast.error(data.error ?? t("errorMessage")); return; }
      toast.success(t("successMessage"));
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      toast.error(t("errorMessage"));
    } finally {
      setLoading(false);
    }
  }

  const infoCards = [
    { icon: Mail, title: t("email"), lines: ["hello@elhuyaam.com", "support@elhuyaam.com"] },
    { icon: Phone, title: t("phone"), lines: ["+213 772 51 54 48", t("phoneLine2")] },
    { icon: MapPin, title: t("address"), lines: [t("addressLines.0"), t("addressLines.1")] },
    { icon: Clock, title: t("responseTime"), lines: [t("responseLine1"), t("responseLine2")] },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-16">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-400 mb-2 font-arabic">{t("arabicTitle")}</p>
        <h1 className="font-display text-4xl md:text-5xl text-brand-900 mb-4">{t("title")}</h1>
        <p className="text-brand-400 max-w-lg mx-auto">{t("subtitle")}</p>
        <div className="flex items-center gap-3 mt-6 max-w-xs mx-auto">
          <div className="h-px flex-1 bg-brand-100" />
          <span className="text-soft-gold">✦</span>
          <div className="h-px flex-1 bg-brand-100" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="space-y-8">
          {infoCards.map(({ icon: Icon, title, lines }) => (
            <div key={title} className="flex gap-4">
              <div className="w-10 h-10 bg-brand-50 border border-brand-200 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-brand-700" />
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-widest text-brand-700 font-medium mb-1">{title}</h3>
                {lines.map((l) => <p key={l} className="text-sm text-brand-500">{l}</p>)}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label={t("yourName")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoComplete="name" />
            <Input label={t("emailAddress")} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required autoComplete="email" />
          </div>
          <Input label={t("subject")} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2 font-medium">{t("message")}</label>
            <textarea
              rows={6}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
              placeholder={t("messagePlaceholder")}
              className="w-full border border-brand-200 px-4 py-3 text-sm text-brand-700 placeholder-brand-300 focus:outline-none focus:border-brand-700 transition-colors resize-none"
            />
          </div>
          <Button type="submit" className="w-full bg-black text-white hover:bg-gray-900" size="lg" loading={loading}>{t("send")}</Button>
        </form>
      </div>
    </div>
  );
}
