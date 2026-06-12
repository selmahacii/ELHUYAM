"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useCallback } from "react";

/**
 * Admin Query Provider
 * Configures TanStack Query with aggressive caching for admin SPA feel.
 * - staleTime: 60s  → data won't re-fetch on every navigation
 * - gcTime: 10min   → cached pages stay in memory for instant back-navigation
 * - retry: 1        → don't spam retries on expected 4xx errors
 */
export function AdminQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,          // 60s — navigating back feels instant
            gcTime: 10 * 60 * 1000,        // 10min — keep in memory
            retry: 1,
            refetchOnWindowFocus: false,   // don't re-fetch when alt-tabbing
            refetchOnMount: false,         // use cache on mount if fresh
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

/** Prefetch a list of admin API routes into the QueryClient cache */
export function usePrefetchAdminRoutes() {
  const prefetch = useCallback((client: QueryClient) => {
    const routes = [
      { key: ["admin", "orders"], url: "/api/admin/orders?limit=20&page=1" },
      { key: ["admin", "products"], url: "/api/products?limit=20&page=1" },
      { key: ["admin", "customers"], url: "/api/users?limit=20&page=1" },
    ];
    routes.forEach(({ key, url }) => {
      client.prefetchQuery({
        queryKey: key,
        queryFn: () => fetch(url).then((r) => r.json()),
        staleTime: 30 * 1000,
      });
    });
  }, []);
  return prefetch;
}
