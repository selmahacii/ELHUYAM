"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useCallback, startTransition } from "react";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, Package, Tag, ShoppingBag, Users,
  BarChart3, Ticket, Star, Menu, X, LogOut, ExternalLink, Truck, Settings, Shield
} from "lucide-react";

const adminGroups = [
  {
    title: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    ]
  },
  {
    title: "Catalog & Sales",
    items: [
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/categories", label: "Categories", icon: Tag },
      { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
      { href: "/admin/customers", label: "Customers", icon: Users },
    ]
  },
  {
    title: "Marketing",
    items: [
      { href: "/admin/coupons", label: "Coupons & Promos", icon: Ticket },
      { href: "/admin/reviews", label: "Product Reviews", icon: Star },
      { href: "/admin/public-reviews", label: "Shop Reviews", icon: Star },
    ]
  },
  {
    title: "Settings",
    items: [
      { href: "/admin/users", label: "Staff Members", icon: Shield },
      { href: "/admin/settings/delivery", label: "Shipping Fees", icon: Truck },
      { href: "/admin/settings/hero", label: "Hero Design", icon: Settings },
      { href: "/admin/settings/footer", label: "Footer Info", icon: Settings },
    ]
  }
];

const confirmatriceGroups = [
  {
    title: "Management",
    items: [
      { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
      { href: "/admin/customers", label: "Customers", icon: Users },
      { href: "/admin/reviews", label: "Product Reviews", icon: Star },
      { href: "/admin/public-reviews", label: "Shop Reviews", icon: Star },
    ]
  }
];

function NavItem({
  href, label, icon: Icon, pendingOrders, lowStockCount, onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  pendingOrders?: number;
  lowStockCount?: number;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(href));
  const showBadge = (href === "/admin/orders" && (pendingOrders ?? 0) > 0) || (href === "/admin/products" && (lowStockCount ?? 0) > 0);
  const badgeValue = href === "/admin/orders" ? pendingOrders : lowStockCount;
  const badgeColor = href === "/admin/products" ? "bg-amber-600 text-white" : "bg-red-600 text-white";

  const handleMouseEnter = useCallback(() => {
    if (pathname !== href) router.prefetch(href);
  }, [href, pathname, router]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (pathname === href) return;
    onNavigate();
    if (typeof window !== "undefined" && window.__navProgressStart) {
      window.__navProgressStart();
    }
    // Defer the router push to let the close animation/paint complete and avoid blocking INP
    setTimeout(() => {
      router.push(href);
    }, 0);
  }, [href, pathname, onNavigate, router]);

  return (
    <a
      href={href}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      className={`
        flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl cursor-pointer select-none
        transition-all duration-250 w-full relative group
        ${isActive
          ? "bg-gradient-to-r from-zinc-900 to-zinc-950/30 text-white shadow-inner font-bold"
          : "text-zinc-400 hover:bg-zinc-900/40 hover:text-zinc-100 active:bg-zinc-900/60"
        }
      `}
    >
      {/* Absolute luxury glowing vertical bar on the active item */}
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-gradient-to-b from-[#C9A96E] to-[#A88244] rounded-r-full shadow-[0_0_10px_rgba(201,169,110,0.6)]" />
      )}

      <Icon 
        className={`w-4 h-4 shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:translate-x-0.5
          ${isActive ? "text-[#C9A96E] drop-shadow-[0_0_5px_rgba(201,169,110,0.3)]" : "text-zinc-500 group-hover:text-zinc-300"}
        `} 
      />
      
      <span className="flex-1 truncate tracking-wide">{label}</span>
      
      {showBadge && (
        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shrink-0 shadow-sm animate-pulse ${badgeColor}`}>
          {badgeValue}
        </span>
      )}
    </a>
  );
}

declare global { interface Window { __navProgressStart?: () => void; } }

export function AdminSidebar({
  user, pendingOrders = 0, lowStockCount = 0, role = "ADMIN",
}: {
  user: { name?: string | null; email?: string | null };
  pendingOrders?: number;
  lowStockCount?: number;
  role?: string;
}) {
  const groups = role === "CONFIRMATRICE" ? confirmatriceGroups : adminGroups;
  const [isOpen, setIsOpen] = useState(false);

  const sidebarContent = (
    <aside className="w-64 bg-[#0F0E0C] border-r border-zinc-900/70 flex flex-col h-full text-zinc-300">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-zinc-900/70 flex flex-col shrink-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3.5">
            <div className="p-1 bg-black rounded-xl border border-zinc-800 shadow-sm shrink-0">
              <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain" />
            </div>
            <div>
              <Link 
                href="/admin" 
                onClick={() => setIsOpen(false)} 
                className="font-display text-sm font-extrabold tracking-[0.18em] text-[#FAF9F6] hover:text-[#FAF9F6]/90 transition-colors"
              >
                EL HUYAM
              </Link>
              <p className="text-[#C9A96E]/70 text-[8.5px] mt-0.5 uppercase tracking-[0.14em] font-extrabold">
                {role === "CONFIRMATRICE" ? "Confirmatrice" : "Administration"}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              startTransition(() => {
                setIsOpen(false);
              });
            }}
            className="lg:hidden text-zinc-500 hover:text-white p-1 -mr-1 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Subtle decorative gold line under header */}
        <div className="h-[1px] bg-gradient-to-r from-transparent via-[#C9A96E]/20 to-transparent w-full mt-4" />
      </div>

      {/* Nav Link Groups */}
      <nav className="flex-1 overflow-y-auto px-3.5 py-5 space-y-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {groups.map((group) => (
          <div key={group.title} className="space-y-1.5">
            <h3 className="text-[9px] font-extrabold text-[#C9A96E]/60 uppercase tracking-[0.25em] px-3.5 mb-2.5 select-none">
              {group.title}
            </h3>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon }) => (
                <NavItem
                  key={href}
                  href={href}
                  label={label}
                  icon={icon}
                  pendingOrders={href === "/admin/orders" ? pendingOrders : 0}
                  lowStockCount={href === "/admin/products" ? lowStockCount : 0}
                  onNavigate={() => setIsOpen(false)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Area */}
      <div className="p-3.5 border-t border-zinc-900/70 space-y-3 shrink-0 bg-[#0A0908]">
        {/* User Status Profile Card */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-zinc-950/40 border border-zinc-900/40 shadow-inner">
          <div className="relative shrink-0">
            <div className="bg-gradient-to-br from-[#C9A96E] to-[#A88244] text-black font-extrabold flex items-center justify-center rounded-full w-8 h-8 text-xs select-none shadow-sm font-display">
              {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
            </div>
            {/* Breathing active status pulsing indicator */}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#0F0E0C] shadow-sm animate-pulse" />
          </div>
          
          <div className="min-w-0 flex-1">
            <p className="text-xs text-zinc-150 font-bold truncate leading-tight">{user?.name || "Administrator"}</p>
            <p className="text-[9.5px] text-zinc-500 font-medium truncate leading-none mt-1">{user?.email || "admin@elhuyaam.com"}</p>
          </div>
        </div>

        {/* Action Links */}
        <div className="space-y-0.5">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2.5 px-3.5 py-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30 text-xs transition-colors rounded-xl w-full font-semibold"
          >
            <ExternalLink className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
            <span>Visit Storefront</span>
          </a>
          <button
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="flex items-center gap-2.5 px-3.5 py-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/5 text-xs transition-colors rounded-xl w-full text-left font-semibold"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0 text-zinc-500 hover:text-rose-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden bg-[#0F0E0C] px-4 py-3.5 flex items-center justify-between shrink-0 border-b border-zinc-900/70 shadow-sm">
        <Link href="/admin" className="font-display text-sm font-extrabold tracking-[0.18em] text-[#FAF9F6]">EL HUYAM</Link>
        <button
          onClick={() => {
            startTransition(() => {
              setIsOpen(true);
            });
          }}
          className="text-zinc-400 p-2 -mr-2 hover:text-[#FAF9F6] active:bg-zinc-900 rounded-xl transition-all"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-xs" onClick={() => setIsOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
            {sidebarContent}
          </div>
        </>
      )}

      {/* Desktop sidebar — always visible */}
      <div className="hidden lg:block shrink-0 h-full">
        {sidebarContent}
      </div>
    </>
  );
}
