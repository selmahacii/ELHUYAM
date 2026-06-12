"use client";

import { useState } from "react";
import { Eye, EyeOff, Key, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useTranslations } from "next-intl";

export default function CustomerPasswordReset({ userId }: { userId: string }) {
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [updating, setUpdating] = useState(false);
  const t = useTranslations("admin.passwordReset");

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!password) {
      toast.error(t("requirePwd"));
      return;
    }
    if (password.length < 8) {
      toast.error(t("minChars"));
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!data.success) {
        toast.error(data.error ?? t("fail"));
        return;
      }

      toast.success(t("success"));
      setPassword("");
    } catch {
      toast.error(t("error"));
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="bg-white border border-brand-100 p-5 mt-5">
      <h3 className="font-display text-sm text-brand-900 mb-3 uppercase tracking-wider font-semibold flex items-center gap-2">
        <Key className="w-4 h-4 text-brand-900" /> {t("title")}
      </h3>
      <p className="text-xs text-brand-400 mb-4 leading-relaxed">
        {t("description")}
      </p>
      <form onSubmit={handleResetPassword} className="space-y-3">
        <div className="relative">
          <input
            type={showPwd ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("placeholder")}
            className="w-full border border-gray-200 px-3 py-2 pr-10 text-xs text-gray-800 focus:outline-none focus:border-gray-700 bg-white rounded-none"
          />
          <button
            type="button"
            onClick={() => setShowPwd(!showPwd)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
          >
            {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
        <button
          type="submit"
          disabled={updating}
          className="w-full flex items-center justify-center gap-2 bg-black text-white hover:bg-neutral-900 border border-black hover:border-soft-gold py-2 text-xs uppercase tracking-widest font-semibold transition-all duration-300 rounded-none disabled:opacity-40"
        >
          {updating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            t("saveBtn")
          )}
        </button>
      </form>
    </div>
  );
}
