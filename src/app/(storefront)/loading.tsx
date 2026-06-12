import React from "react";

export default function StorefrontLoading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-warm-white relative overflow-hidden">
      {/* Subtle Arabesque background overlay for texture */}
      <div className="absolute inset-0 arabesque-bg opacity-[0.03] pointer-events-none" />

      {/* Gold radial aura background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-soft-gold/5 blur-[80px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-6 text-center select-none">
        {/* Spinner Frame with elegant gold ornaments */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-brand-100/40" />
          <div className="absolute inset-0 rounded-full border-t border-soft-gold animate-spin" style={{ animationDuration: "1s" }} />
          <span className="text-soft-gold text-lg animate-pulse">✦</span>
        </div>

        {/* Brand Text */}
        <div className="space-y-1 sm:space-y-2 animate-pulse" style={{ animationDuration: "1.8s" }}>
          <h2 className="font-display text-2xl sm:text-3xl tracking-[0.3em] font-semibold text-black">
            EL HUYAM
          </h2>
          <p className="font-amiri text-2xl text-soft-gold tracking-wide leading-none">
            الهُياَمْ
          </p>
        </div>

        {/* Minimal luxury loading indicator bar */}
        <div className="w-24 h-[1px] bg-brand-100 relative overflow-hidden mt-2">
          <div 
            className="absolute top-0 bottom-0 left-0 bg-gold-gradient w-1/2 animate-[shimmer_1.5s_infinite]" 
            style={{ backgroundSize: "200% 100%" }}
          />
        </div>
      </div>
    </div>
  );
}
