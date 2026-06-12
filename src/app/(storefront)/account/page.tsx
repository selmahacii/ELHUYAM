"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import {
  User, Package, Heart, MapPin, Lock, LogOut, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, formatPrice, getInitials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

/* ── Typed API shapes ─────────────────────────────────────────────────────── */
interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  totalAmount: number;
  items: { quantity: number }[];
}

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  _count: { orders: number; wishlistItems: number; reviews: number };
}

interface Address {
  id: string;
  label: string;
  isDefault: boolean;
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

/* ── Constants ────────────────────────────────────────────────────────────── */
const ORDER_STATUS_BADGE: Record<string, "info" | "warning" | "success" | "destructive" | "luxury"> = {
  PENDING: "warning",
  CONFIRMED: "info",
  PROCESSING: "info",
  SHIPPED: "info",
  OUT_FOR_DELIVERY: "info",
  DELIVERED: "success",
  CANCELLED: "destructive",
  REFUNDED: "luxury",
};

const TAB_ITEMS = [
  { id: "overview",   labelKey: "overview",   icon: User },
  { id: "orders",     labelKey: "orders",     icon: Package },
  { id: "wishlist",   labelKey: "wishlist",   icon: Heart },
  { id: "addresses",  labelKey: "addresses",  icon: MapPin },
  { id: "security",   labelKey: "security",   icon: Lock },
];

/* ── Main page ────────────────────────────────────────────────────────────── */
export default function AccountPage() {
  const { data: session } = useSession();
  const tAcc = useTranslations("account");
  const [tab, setTab] = useState("overview");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAccountData() {
      const parseSafeJson = async (response: Response) => {
        if (!response.ok) return null;
        const text = await response.text();
        if (!text) return null;

        try {
          return JSON.parse(text);
        } catch {
          return null;
        }
      };

      try {
        const [profileResponse, ordersResponse] = await Promise.all([
          fetch("/api/users/me"),
          fetch("/api/orders?limit=5"),
        ]);

        const [p, o] = await Promise.all([
          parseSafeJson(profileResponse),
          parseSafeJson(ordersResponse),
        ]);

        setProfile(p?.data ?? null);
        setOrders(Array.isArray(o?.data) ? o.data : []);
      } catch (error) {
        console.error("Failed to load account data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadAccountData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse">
        <div className="h-8 bg-brand-100 w-48 mb-6" />
        <div className="h-32 bg-brand-100" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="bg-brand-50 border border-brand-100 p-6 text-center mb-4">
            <div className="w-16 h-16 rounded-full bg-brand-200 flex items-center justify-center mx-auto mb-3 text-xl font-display text-brand-700 overflow-hidden">
              {session?.user?.image ? (
                <Image src={session.user.image} alt="Avatar" width={64} height={64} className="object-cover" />
              ) : (
                getInitials(session?.user?.name)
              )}
            </div>
            <p className="font-display text-base text-brand-900">{session?.user?.name ?? "—"}</p>
            <p className="text-xs text-brand-400 mt-0.5 truncate">{session?.user?.email}</p>
          </div>

          <nav className="space-y-0.5">
            {TAB_ITEMS.map(({ id, labelKey, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors text-left ${
                  tab === id
                    ? "bg-brand-900 text-white"
                    : "text-brand-600 hover:bg-brand-100 hover:text-brand-900"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {tAcc(labelKey as "overview" | "orders" | "wishlist" | "addresses" | "security")}
                <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-50" />
              </button>
            ))}

            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {tAcc("signOut")}
            </button>
          </nav>
        </aside>

        {/* Main content */}
        <div className="lg:col-span-3">
          {tab === "overview" && (
            <div className="space-y-6">
              <h1 className="font-display text-3xl text-brand-900">{tAcc("title")}</h1>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: tAcc("orders"),   value: profile?._count.orders ?? 0,       action: () => setTab("orders") },
                  { label: tAcc("wishlist"), value: profile?._count.wishlistItems ?? 0, action: () => setTab("wishlist") },
                  { label: tAcc("reviews"),  value: profile?._count.reviews ?? 0,       action: () => {} },
                ].map(({ label, value, action }) => (
                  <button
                    key={label}
                    onClick={action}
                    className="bg-brand-50 border border-brand-100 p-5 text-left hover:bg-brand-100 hover:border-brand-200 transition-colors"
                  >
                    <p className="font-display text-2xl text-brand-900">{value}</p>
                    <p className="text-xs uppercase tracking-widest text-brand-400 mt-1">{label}</p>
                  </button>
                ))}
              </div>

              <div className="border-t border-brand-100 pt-6">
                <h2 className="font-display text-xl text-brand-900 mb-4">{tAcc("recentOrders")}</h2>
                {orders.length === 0 ? (
                  <p className="text-brand-400 text-sm">{tAcc("noOrders")}</p>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <Link
                        key={order.id}
                        href={`/account/orders/${order.orderNumber}`}
                        className="flex items-center justify-between p-4 border border-brand-100 hover:border-brand-300 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium text-brand-900">{order.orderNumber}</p>
                          <p className="text-xs text-brand-400 mt-0.5">{formatDate(order.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-semibold text-brand-900">{formatPrice(order.totalAmount)}</span>
                          <Badge variant={ORDER_STATUS_BADGE[order.status] ?? "secondary"}>
                            {order.status.replace(/_/g, " ")}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setTab("orders")}
                  className="mt-4 text-xs uppercase tracking-widest text-brand-600 hover:text-brand-900 transition-colors block"
                >
                  {tAcc("viewAllOrders")} →
                </button>
              </div>
            </div>
          )}

          {tab === "orders"    && <OrdersTab />}
          {tab === "addresses" && <AddressesTab />}
          {tab === "security"  && <SecurityTab />}
          {tab === "wishlist"  && (
            <div>
              <h2 className="font-display text-2xl text-brand-900 mb-6">{tAcc("wishlist")}</h2>
              <p className="text-brand-400 text-sm mb-4">
                {tAcc("wishlistHint")}
              </p>
              <Link href="/wishlist">
                <Button variant="luxury-outline">{tAcc("viewWishlist")}</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Orders tab ───────────────────────────────────────────────────────────── */
function OrdersTab() {
  const tAcc = useTranslations("account");
  const tStatus = useTranslations("orderStatus");
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders?limit=50")
      .then((r) => r.json())
      .then((d) => setOrders(d.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse h-32 bg-brand-100" />;

  return (
    <div>
      <h2 className="font-display text-2xl text-brand-900 mb-6">{tAcc("orders")}</h2>
      {orders.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-brand-200 mx-auto mb-4" />
          <p className="text-brand-400 mb-4">{tAcc("noOrders")}</p>
          <Link href="/shop">
            <Button variant="luxury" size="sm">{tAcc("startShopping")}</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.orderNumber}`}
              className="block border border-brand-100 p-5 hover:border-brand-300 transition-colors group"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-medium text-brand-900 text-sm font-mono">{order.orderNumber}</p>
                  <p className="text-xs text-brand-400 mt-0.5">{formatDate(order.createdAt)}</p>
                  <p className="text-xs text-brand-500 mt-1">
                    {order.items.reduce((s, i) => s + i.quantity, 0)} {tAcc("itemCount")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-brand-900">{formatPrice(order.totalAmount)}</p>
                  <Badge className="mt-2" variant={ORDER_STATUS_BADGE[order.status] ?? "secondary"}>
                    {tStatus(order.status as keyof typeof ORDER_STATUS_BADGE)}
                  </Badge>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Addresses tab ────────────────────────────────────────────────────────── */
function AddressesTab() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users/addresses")
      .then((r) => r.json())
      .then((d) => setAddresses(d.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function deleteAddress(id: string) {
    if (!confirm("Delete this address?")) return;
    const res = await fetch(`/api/users/addresses/${id}`, { method: "DELETE" });
    if (res.ok) setAddresses((prev) => prev.filter((a) => a.id !== id));
  }

  if (loading) return <div className="animate-pulse h-32 bg-brand-100" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl text-brand-900">Adresses Sauvegardées</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {addresses.map((addr) => (
          <div key={addr.id} className="border border-brand-200 p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-medium text-brand-900 text-sm">{addr.label}</p>
                {addr.isDefault && (
                  <Badge variant="luxury" className="mt-1 text-[10px]">Par défaut</Badge>
                )}
              </div>
              <button
                onClick={() => deleteAddress(addr.id)}
                className="text-xs text-brand-400 hover:text-red-500 transition-colors"
              >
                Supprimer
              </button>
            </div>
            <address className="not-italic text-sm text-brand-600 leading-relaxed">
              <p>{addr.firstName} {addr.lastName}</p>
              <p>{addr.street}</p>
              <p>{addr.city}, {addr.state} {addr.postalCode}</p>
              <p>{addr.country}</p>
            </address>
          </div>
        ))}
        <Link
          href="/account/addresses/new"
          className="border border-dashed border-brand-300 p-5 flex items-center justify-center text-brand-400 hover:border-brand-600 hover:text-brand-700 transition-colors min-h-[120px]"
        >
          <span className="text-sm">+ Add address</span>
        </Link>
      </div>
    </div>
  );
}

/* ── Security tab ─────────────────────────────────────────────────────────── */
function SecurityTab() {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.newPassword.length < 8) { setError("Le nouveau mot de passe doit comporter au moins 8 caractères"); return; }
    if (form.newPassword !== form.confirmPassword) { setError("Les mots de passe ne correspondent pas"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSuccess(true);
        setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        const d = await res.json();
        setError(d.error ?? "Échec de la modification du mot de passe");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 className="font-display text-2xl text-brand-900 mb-6">Sécurité</h2>
      <div className="max-w-md">
        <h3 className="font-medium text-brand-900 mb-4 text-xs uppercase tracking-widest">
          Changer le mot de passe
        </h3>
        {success && (
          <p className="text-green-700 text-sm mb-4 p-3 bg-green-50 border border-green-200">
            Mot de passe modifié avec succès.
          </p>
        )}
        {error && (
          <p className="text-red-600 text-sm mb-4 p-3 bg-red-50 border border-red-200">{error}</p>
        )}
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            label="Mot de passe actuel"
            type="password"
            value={form.currentPassword}
            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
            required
          />
          <Input
            label="Nouveau mot de passe"
            type="password"
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            required
          />
          <Input
            label="Confirmer le nouveau mot de passe"
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            required
          />
          <Button type="submit" variant="luxury" loading={saving}>
            Mettre à jour le mot de passe
          </Button>
        </form>
      </div>
    </div>
  );
}
