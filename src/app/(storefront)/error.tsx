"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Storefront Error Boundary caught an exception:", error);
  }, [error]);

  return (
    <div className="py-24 px-4 bg-warm-white text-center relative overflow-hidden flex items-center justify-center min-h-[60vh]">
      {/* Subtle Arabesque overlay */}
      <div className="absolute inset-0 arabesque-bg opacity-[0.02] pointer-events-none" />

      <div className="max-w-md w-full space-y-6 relative z-10">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center border border-brand-100">
            <span className="text-soft-gold text-xl">✦</span>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="font-display text-2xl font-light text-brand-900 tracking-wider">
            Une erreur est survenue sur cette page
          </h2>
          <p className="text-brand-600/80 text-xs leading-relaxed max-w-sm mx-auto">
            Nous n'avons pas pu charger le module. Veuillez réessayer ou retourner à la boutique.
          </p>
        </div>

        {error.digest && (
          <p className="text-[9px] font-mono text-brand-400 bg-brand-50/50 py-1 px-2.5 inline-block">
            Réf: {error.digest}
          </p>
        )}

        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => reset()}
            variant="luxury"
            className="px-6 py-2.5 text-[9px] uppercase tracking-widest font-semibold"
          >
            Réessayer
          </Button>
          <Button
            onClick={() => (window.location.href = "/shop")}
            variant="luxury-outline"
            className="px-6 py-2.5 text-[9px] uppercase tracking-widest font-semibold"
          >
            Voir la boutique
          </Button>
        </div>
      </div>
    </div>
  );
}
