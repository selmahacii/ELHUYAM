"use client";

import React from "react";
import { useRegion } from "@/providers/region-provider";
import { Globe, MapPin } from "lucide-react";

export function RegionModal() {
  const { isRegionModalOpen, setRegion, isInternationalEnabled } = useRegion();

  if (!isInternationalEnabled || !isRegionModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-2xl relative overflow-hidden">
        {/* Background Decorative elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-50 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-slate-100 rounded-full blur-3xl opacity-50" />

        <div className="relative text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-brand-50 text-brand-900 rounded-2xl flex items-center justify-center border border-brand-100 mb-2">
            <Globe className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-bold font-display text-slate-900">Welcome to ELHUYAM</h2>
            <p className="text-slate-500 text-sm mt-2 font-medium">
              Please select your shipping destination to see correct pricing and availability.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 pt-4">
            <button
              onClick={() => setRegion("ALGERIA")}
              className="flex items-center p-4 border-2 border-slate-100 rounded-2xl hover:border-brand-500 hover:bg-brand-50/30 transition-all group text-left"
            >
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600 group-hover:bg-brand-100 group-hover:text-brand-700 transition-colors">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="ml-4">
                <p className="font-bold text-slate-900 text-sm">Algeria (DZD)</p>
                <p className="text-xs text-slate-500 font-medium">Ship to 58 wilayas in Algeria</p>
              </div>
            </button>

            <button
              onClick={() => setRegion("INTERNATIONAL")}
              className="flex items-center p-4 border-2 border-slate-100 rounded-2xl hover:border-slate-800 hover:bg-slate-50 transition-all group text-left"
            >
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600 group-hover:bg-slate-200 group-hover:text-slate-800 transition-colors">
                <Globe className="w-5 h-5" />
              </div>
              <div className="ml-4">
                <p className="font-bold text-slate-900 text-sm">International (EUR)</p>
                <p className="text-xs text-slate-500 font-medium">Worldwide shipping in English</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
