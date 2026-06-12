"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, X, Loader2, Eye, EyeOff, ShieldCheck, ShoppingBag, Users, Phone, Mail, User } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";

const ROLE_META = {
  CUSTOMER: {
    icon: ShoppingBag,
    label: "Client",
    color: "text-slate-600 bg-slate-50 border-slate-200",
    activeColor: "text-slate-900 bg-white border-slate-900 shadow-sm",
    perms: ["Accès boutique", "Passer des commandes", "Gérer son profil", "Ajouter des avis"],
  },
  CONFIRMATRICE: {
    icon: Users,
    label: "Confirmatrice",
    color: "text-blue-600 bg-blue-50/50 border-blue-100",
    activeColor: "text-blue-900 bg-blue-50 border-blue-700 shadow-sm",
    perms: ["Voir les commandes", "Confirmer / modifier statuts", "Voir les clients", "Créer des commandes manuelles"],
  },
  ADMIN: {
    icon: ShieldCheck,
    label: "Administrateur",
    color: "text-purple-600 bg-purple-50/50 border-purple-100",
    activeColor: "text-purple-900 bg-purple-50 border-purple-700 shadow-sm",
    perms: ["Accès complet au panel admin", "Gérer produits & catégories", "Gérer utilisateurs", "Analytiques & configuration"],
  },
} as const;

type Role = keyof typeof ROLE_META;

export default function CreateUserModal({ defaultRoleOnly = false }: { defaultRoleOnly?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "CUSTOMER" as Role,
  });

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function handleClose() {
    if (saving) return;
    setOpen(false);
    setForm({ name: "", email: "", phone: "", password: "", role: "CUSTOMER" });
  }

  async function handleCreate() {
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      toast.error("Le nom, l'email et le mot de passe sont requis");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          password: form.password,
          role: form.role,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error ?? "Une erreur est survenue lors de la création");
        return;
      }
      toast.success(
        defaultRoleOnly 
          ? "Nouveau compte client créé avec succès ✓" 
          : `Compte ${ROLE_META[form.role].label} créé avec succès ✓`
      );
      handleClose();
      router.refresh();
    } catch (err) {
      toast.error("Erreur réseau");
    } finally {
      setSaving(false);
    }
  }

  const selected = ROLE_META[form.role];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all h-10 shrink-0"
      >
        <UserPlus className="w-4 h-4 shrink-0" /> 
        {defaultRoleOnly ? "Créer un client" : "Créer un compte"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300" onClick={handleClose} />
          
          <div className="relative bg-white w-full max-w-lg shadow-2xl rounded-3xl overflow-hidden max-h-[90vh] flex flex-col border border-gray-100 animate-fade-in">
            {/* Top decorative gold line */}
            <div className="h-1 bg-gold-gradient w-full shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-slate-50 rounded-lg text-slate-800 border border-gray-100">
                  <UserPlus className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-display text-sm font-bold text-slate-900">
                    {defaultRoleOnly ? "Créer un Compte Client" : "Créer un Nouvel Utilisateur"}
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Remplissez les informations ci-dessous pour activer le compte.
                  </p>
                </div>
              </div>
              <button 
                onClick={handleClose} 
                className="w-8 h-8 rounded-full hover:bg-gray-50 flex items-center justify-center text-gray-400 hover:text-slate-950 transition-colors border border-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              {/* Role selector (Shown only if defaultRoleOnly is FALSE) */}
              {!defaultRoleOnly && (
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">
                    Rôle & Droits d&apos;accès
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.entries(ROLE_META) as [Role, typeof ROLE_META[Role]][]).map(([role, meta]) => {
                      const Icon = meta.icon;
                      const isActive = form.role === role;
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => set("role", role)}
                          className={`flex flex-col items-center gap-1.5 py-3 px-2 border-2 rounded-2xl text-center transition-all ${
                            isActive 
                              ? "border-slate-900 bg-slate-50 text-slate-950 shadow-sm font-bold" 
                              : "border-gray-100 text-slate-400 hover:border-gray-200 bg-white"
                          }`}
                        >
                          <Icon className="w-5 h-5 shrink-0" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">{meta.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Permission list for selected role */}
                  <div className={`p-4 border rounded-2xl text-xs space-y-2 transition-all duration-300 ${selected.color}`}>
                    <p className="font-bold text-[10.5px] uppercase tracking-wide">Droits d&apos;accès accordés :</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5">
                      {selected.perms.map((p) => (
                        <div key={p} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                          <span className="font-medium text-[11px] text-slate-700">{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Fields */}
              <div className="space-y-4">
                
                {/* Name and Phone Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">Nom Complet *</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        value={form.name}
                        onChange={(e) => set("name", e.target.value)}
                        placeholder="Ex: Fatima Zohra"
                        className="w-full border border-gray-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-800 transition-all h-10 font-semibold"
                      />
                    </div>
                  </div>
                  
                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">Numéro de Téléphone</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        value={form.phone}
                        onChange={(e) => set("phone", e.target.value)}
                        placeholder="Ex: 0555 123 456"
                        className="w-full border border-gray-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-800 transition-all h-10 font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">Adresse Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      placeholder="Ex: exemple@email.com"
                      className="w-full border border-gray-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-800 transition-all h-10 font-semibold"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">Mot de Passe Provisoire *</label>
                  <div className="relative">
                    <input
                      type={showPwd ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => set("password", e.target.value)}
                      placeholder="Minimum 8 caractères"
                      className="w-full border border-gray-200 rounded-2xl pl-4 pr-12 py-2.5 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-800 transition-all h-10 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors"
                    >
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 shrink-0 bg-gray-50/55">
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl py-3 text-xs font-semibold shadow-sm transition-all disabled:opacity-40 h-11"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <UserPlus className="w-4 h-4" />}
                Enregistrer le compte
              </button>
              <button
                onClick={handleClose}
                disabled={saving}
                className="flex-1 border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-slate-700 rounded-2xl transition-all h-11 bg-white shadow-sm"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
