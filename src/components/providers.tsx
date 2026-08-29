"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { useCartStore } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import toast from "react-hot-toast";

/**
 * StateSync — Client component that listens to session and connectivity states.
 * - Restores and synchronizes Zustand stores on user login or mounting.
 * - Provides premium UI feedback toasts when internet connectivity drops/re-establishes.
 * - Safely handles offline mode and recovers once back online.
 */
function StateSync() {
  const { status } = useSession();
  const lastStatus = useRef<string | null>(null);
  const isSyncing = useRef(false);

  // 1. Synchronize state with backend when authenticated
  useEffect(() => {
    if (lastStatus.current === status) return;

    const authenticated = status === "authenticated";
    useCartStore.getState().setAuthenticated(authenticated);
    useWishlistStore.getState().setAuthenticated(authenticated);

    if (authenticated && lastStatus.current !== "authenticated") {
      if (!isSyncing.current) {
        isSyncing.current = true;
        Promise.all([
          useCartStore.getState().syncWithServer(),
          useWishlistStore.getState().syncWithServer(),
        ]).finally(() => {
          isSyncing.current = false;
        });
      }
    }
    lastStatus.current = status;
  }, [status]);

  // 2. Offline / online connection monitoring
  useEffect(() => {
    const handleOnline = () => {
      toast.success("Connexion rétablie. Synchronisation...", {
        id: "connection-status",
        style: {
          background: "#155724",
          color: "#FAF9F6",
          borderRadius: "0",
          fontSize: "12px",
          letterSpacing: "0.05em",
        },
      });
      
      // Auto-sync stores once back online
      if (status === "authenticated") {
        useCartStore.getState().syncWithServer();
        useWishlistStore.getState().syncWithServer();
      }
    };

    const handleOffline = () => {
      toast.error("Mode hors ligne. Certaines fonctionnalités sont limitées.", {
        id: "connection-status",
        style: {
          background: "#721c24",
          color: "#FAF9F6",
          borderRadius: "0",
          fontSize: "12px",
          letterSpacing: "0.05em",
        },
        duration: 5000,
      });
    };

    window.addEventListener("online", handleOnline, { passive: true });
    window.addEventListener("offline", handleOffline, { passive: true });

    // Check current state on load
    if (typeof window !== "undefined" && !window.navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [status]);

  return null;
}

interface ProvidersProps {
  children: React.ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
// Providers — No longer accepts a `session` prop.
//
// Previously, RootLayout called auth() server-side and passed the session here,
// which forced the ENTIRE Next.js route tree into SSR (cookies() + auth() in
// Root Layout = 0 ISR Reads across the whole app).
//
// SessionProvider with no `session` prop auto-fetches /api/auth/session once
// on the client side. The session is available ~50-100ms after hydration —
// imperceptible to users, and the navbar handles its own loading state.
// ─────────────────────────────────────────────────────────────────────────────
export default function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <SessionProvider basePath="/api/auth">
      <QueryClientProvider client={queryClient}>
        <StateSync />
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#1A1A1A",
              color: "#FAF9F6",
              fontSize: "13px",
              letterSpacing: "0.05em",
              borderRadius: "0",
              padding: "12px 20px",
            },
            success: { iconTheme: { primary: "#C9A96E", secondary: "#1A1A1A" } },
            error: { iconTheme: { primary: "#ef4444", secondary: "#FAF9F6" } },
          }}
        />
      </QueryClientProvider>
    </SessionProvider>
  );
}
