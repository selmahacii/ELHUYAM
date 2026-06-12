"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Search, MapPin, CheckCircle, HelpCircle, Truck } from "lucide-react";

interface ShippingFee {
  code: string;
  name: string;
  domicile: number;
  stopdesk: number;
}

const SHIPPING_FEES: ShippingFee[] = [
  { code: "01", name: "Adrar", domicile: 1400, stopdesk: 970 },
  { code: "02", name: "Chlef", domicile: 750, stopdesk: 520 },
  { code: "03", name: "Laghouat", domicile: 950, stopdesk: 670 },
  { code: "04", name: "Oum El Bouaghi", domicile: 800, stopdesk: 520 },
  { code: "05", name: "Batna", domicile: 800, stopdesk: 520 },
  { code: "06", name: "Bejaia", domicile: 800, stopdesk: 520 },
  { code: "07", name: "Biskra", domicile: 950, stopdesk: 670 },
  { code: "08", name: "Bechar", domicile: 1100, stopdesk: 720 },
  { code: "09", name: "Blida", domicile: 400, stopdesk: 370 },
  { code: "10", name: "Bouira", domicile: 750, stopdesk: 520 },
  { code: "11", name: "Tamanrasset", domicile: 1600, stopdesk: 1120 },
  { code: "12", name: "Tebessa", domicile: 850, stopdesk: 520 },
  { code: "13", name: "Tlemcen", domicile: 850, stopdesk: 570 },
  { code: "14", name: "Tiaret", domicile: 800, stopdesk: 520 },
  { code: "15", name: "Tizi Ouzou", domicile: 750, stopdesk: 520 },
  { code: "16", name: "Alger", domicile: 500, stopdesk: 420 },
  { code: "17", name: "Djelfa", domicile: 950, stopdesk: 670 },
  { code: "18", name: "Jijel", domicile: 800, stopdesk: 520 },
  { code: "19", name: "Sétif", domicile: 750, stopdesk: 520 },
  { code: "20", name: "Saida", domicile: 800, stopdesk: 570 },
  { code: "21", name: "Skikda", domicile: 800, stopdesk: 520 },
  { code: "22", name: "Sidi Bel Abbès", domicile: 800, stopdesk: 520 },
  { code: "23", name: "Annaba", domicile: 800, stopdesk: 520 },
  { code: "24", name: "Guelma", domicile: 800, stopdesk: 520 },
  { code: "25", name: "Constantine", domicile: 800, stopdesk: 520 },
  { code: "26", name: "Medea", domicile: 750, stopdesk: 520 },
  { code: "27", name: "Mostaganem", domicile: 800, stopdesk: 520 },
  { code: "28", name: "M'Sila", domicile: 850, stopdesk: 570 },
  { code: "29", name: "Mascara", domicile: 800, stopdesk: 520 },
  { code: "30", name: "Ouargla", domicile: 950, stopdesk: 670 },
  { code: "31", name: "Oran", domicile: 800, stopdesk: 520 },
  { code: "32", name: "El Bayadh", domicile: 1100, stopdesk: 670 },
  { code: "33", name: "Illizi", domicile: 0, stopdesk: 0 },
  { code: "34", name: "Bordj Bou Arreridj", domicile: 750, stopdesk: 520 },
  { code: "35", name: "Boumerdes", domicile: 750, stopdesk: 520 },
  { code: "36", name: "El Tarf", domicile: 800, stopdesk: 520 },
  { code: "37", name: "Tindouf", domicile: 0, stopdesk: 0 },
  { code: "38", name: "Tissemsilt", domicile: 800, stopdesk: 520 },
  { code: "39", name: "El Oued", domicile: 950, stopdesk: 670 },
  { code: "40", name: "Khenchela", domicile: 800, stopdesk: 520 },
  { code: "41", name: "Souk Ahras", domicile: 800, stopdesk: 520 },
  { code: "42", name: "Tipaza", domicile: 750, stopdesk: 520 },
  { code: "43", name: "Mila", domicile: 800, stopdesk: 520 },
  { code: "44", name: "Ain Defla", domicile: 750, stopdesk: 520 },
  { code: "45", name: "Naama", domicile: 1100, stopdesk: 670 },
  { code: "46", name: "Ain Temouchent", domicile: 800, stopdesk: 520 },
  { code: "47", name: "Ghardaia", domicile: 950, stopdesk: 670 },
  { code: "48", name: "Relizane", domicile: 800, stopdesk: 520 },
  { code: "49", name: "Timimoun", domicile: 1400, stopdesk: 0 },
  { code: "50", name: "Bordj Badji Mokhtar", domicile: 0, stopdesk: 0 },
  { code: "51", name: "Ouled Djellal", domicile: 950, stopdesk: 670 },
  { code: "52", name: "Béni Abbès", domicile: 1000, stopdesk: 970 },
  { code: "53", name: "In Salah", domicile: 1600, stopdesk: 0 },
  { code: "54", name: "In Guezzam", domicile: 1600, stopdesk: 0 },
  { code: "55", name: "Touggourt", domicile: 950, stopdesk: 670 },
  { code: "56", name: "Djanet", domicile: 0, stopdesk: 0 },
  { code: "57", name: "M'Ghair", domicile: 950, stopdesk: 0 },
  { code: "58", name: "Meniaa", domicile: 1000, stopdesk: 0 }
];

export default function ShippingPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFees = SHIPPING_FEES.filter((fee) =>
    fee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fee.code.includes(searchQuery)
  );

  function formatFee(amount: number) {
    if (amount === 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-100">
          Free
        </span>
      );
    }
    return <span className="font-mono font-semibold text-slate-800">{amount} DZD</span>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      
      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-2 text-xs uppercase tracking-widest text-brand-400 mb-8">
        <Link href="/" className="hover:text-brand-700 transition-colors">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-brand-700">Shipping Policy</span>
      </nav>

      {/* ── Header ── */}
      <div className="mb-12 text-center sm:text-left">
        <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-brand-400 mb-2">Policy</p>
        <h1 className="font-display text-4xl text-brand-900 font-bold tracking-tight">Shipping Info & Rates</h1>
        <div className="flex items-center justify-center sm:justify-start gap-3 mt-3 mb-4">
          <div className="h-px w-12 bg-soft-gold" />
          <span className="text-soft-gold text-xs">✦</span>
        </div>
        <p className="text-neutral-500 text-xs font-semibold">Last updated: June 2026</p>
      </div>

      {/* ── Main Policy Content ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start mb-16">
        
        {/* Left column - General Terms */}
        <div className="md:col-span-2 space-y-8 text-neutral-700 leading-relaxed text-sm">
          <section className="bg-warm-white/40 border border-neutral-100 p-6 rounded-2xl">
            <h2 className="font-display text-lg text-brand-900 font-bold mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-soft-gold" /> Processing Time
            </h2>
            <p>
              All orders are processed within 1 to 2 business days. Orders placed on weekends or public holidays will be processed on the next business day. You will receive an email confirmation with tracking details once your order has been dispatched.
            </p>
          </section>

          <section className="bg-warm-white/40 border border-neutral-100 p-6 rounded-2xl">
            <h2 className="font-display text-lg text-brand-900 font-bold mb-3 flex items-center gap-2">
              <Truck className="w-4 h-4 text-soft-gold" /> Domestic Shipping (Algeria)
            </h2>
            <p className="mb-2">
              We provide delivery services across all 58 provinces (wilayas) of Algeria. 
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs text-neutral-600 pl-2">
              <li><strong>Standard Delivery</strong>: 3 to 5 business days.</li>
              <li><strong>Express Delivery</strong>: 1 to 2 business days.</li>
              <li><strong>Same-Day Delivery</strong>: Available in selected central wilayas.</li>
            </ul>
          </section>

          <section className="bg-warm-white/40 border border-neutral-100 p-6 rounded-2xl">
            <h2 className="font-display text-lg text-brand-900 font-bold mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-soft-gold" /> International Shipping
            </h2>
            <p className="mb-3">
              We ship worldwide. International deliveries typically take 7 to 14 business days depending on destination customs clearance processes. Delivery rates are calculated during checkout based on parcel weight and location.
            </p>
            <p className="text-xs text-neutral-500 italic bg-amber-50/50 border border-amber-100/50 p-3 rounded">
              * International clients are responsible for any customs clearance duties, taxes, or entry fees applied by the customs authorities of their destination country.
            </p>
          </section>
        </div>

        {/* Right column - Quick Info / Help */}
        <div className="space-y-4">
          <div className="bg-brand-950 text-white p-6 rounded-2xl shadow-sm border border-brand-900 space-y-4">
            <h3 className="font-display text-base font-bold text-soft-gold">Order Tracking</h3>
            <p className="text-xs text-brand-200/90 leading-relaxed">
              Once shipped, you will receive a tracking number via email. You can also view real-time shipping updates by logging into your account under your order history.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-3">
            <h3 className="font-display text-sm font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-slate-500" /> Need Help?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              If your package is delayed, damaged, or lost, please contact us within 7 days of the estimated delivery date. We will launch an inquiry with our carrier and arrange a replacement or refund.
            </p>
            <Link 
              href="/contact" 
              className="inline-block text-[10px] uppercase font-extrabold tracking-widest text-slate-900 hover:underline pt-1"
            >
              Contact Support →
            </Link>
          </div>
        </div>

      </div>

      {/* ── Shipping Fees Section (Dynamic Table) ── */}
      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden p-6 space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="font-display text-xl text-slate-900 font-bold">Algeria Delivery Tariffs</h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Search by Wilaya name or code to view our specific Home (Domicile) and Desk (Stopdesk) pickup rates.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Wilaya..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:outline-none focus:border-slate-800 transition-colors font-medium h-9"
            />
          </div>
        </div>

        {/* Fees Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-wider text-slate-400 w-16">Code</th>
                <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-wider text-slate-400">Wilaya Name</th>
                <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-wider text-slate-400">Home Delivery (Domicile)</th>
                <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-wider text-slate-400">Desk Pickup (Stopdesk)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredFees.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-400 italic">
                    No wilaya matching your query.
                  </td>
                </tr>
              ) : (
                filteredFees.map((fee) => (
                  <tr key={fee.code} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-500">{fee.code}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-800 text-sm">{fee.name}</td>
                    <td className="px-4 py-3.5">{formatFee(fee.domicile)}</td>
                    <td className="px-4 py-3.5">{formatFee(fee.stopdesk)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
