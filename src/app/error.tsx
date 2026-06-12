"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console or error monitoring service in production
    console.error("Global Error Boundary caught an exception:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-warm-white text-center p-6 relative">
      {/* Texture ornaments */}
      <div className="absolute inset-0 arabesque-bg opacity-[0.02] pointer-events-none" />

      <div className="max-w-md w-full space-y-6 relative z-10">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center border border-brand-100">
            <span className="text-soft-gold text-2xl">✦</span>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-3xl font-semibold tracking-wider text-black uppercase">
            Une erreur est survenue
          </h1>
          <p className="text-brand-600 text-sm leading-relaxed max-w-sm mx-auto">
            Nous nous excusons pour ce désagrément. Notre équipe a été notifiée et résout le problème.
          </p>
        </div>

        {error.digest && (
          <p className="text-[10px] font-mono text-brand-400 bg-brand-50/50 py-1.5 px-3 inline-block">
            ID de suivi: {error.digest}
          </p>
        )}

        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => reset()}
            variant="luxury"
            className="px-8 py-3 rounded-none tracking-widest text-[10px] uppercase font-semibold w-full sm:w-auto"
          >
            Réessayer la page
          </Button>
          <Button
            onClick={() => (window.location.href = "/")}
            variant="luxury-outline"
            className="px-8 py-3 rounded-none tracking-widest text-[10px] uppercase font-semibold w-full sm:w-auto"
          >
            Retour à l'accueil
          </Button>
        </div>
      </div>
    </div>
  );
}
