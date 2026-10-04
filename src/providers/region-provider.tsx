"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export type Region = "ALGERIA" | "INTERNATIONAL" | null;

interface RegionContextType {
  region: Region;
  setRegion: (region: Region) => void;
  isRegionModalOpen: boolean;
  setRegionModalOpen: (open: boolean) => void;
  isInternationalEnabled: boolean;
}

const RegionContext = createContext<RegionContextType | undefined>(undefined);

// ─────────────────────────────────────────────────────────────────────────────
// Helper: read a cookie by name from document.cookie (client-side only)
// ─────────────────────────────────────────────────────────────────────────────
function getClientCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function RegionProvider({
  children,
  initialRegion,
  isInternationalEnabled = true,
}: {
  children: React.ReactNode;
  initialRegion: Region;
  isInternationalEnabled?: boolean;
}) {
  // Start with the server-provided initialRegion (may be null if Root Layout
  // no longer reads cookies — the client-side effect below will hydrate it).
  const activeInitialRegion = isInternationalEnabled ? initialRegion : "ALGERIA";
  const [region, setRegionState] = useState<Region>(activeInitialRegion);
  const [isRegionModalOpen, setRegionModalOpen] = useState<boolean>(false);
  const router = useRouter();

  // ── Client-side cookie read ───────────────────────────────────────────────
  // Root Layout no longer calls cookies() server-side (it was causing 100% SSR
  // by opting the entire route tree out of caching). We read the cookie here
  // instead, after hydration, with no performance impact.
  useEffect(() => {
    if (!isInternationalEnabled) {
      setRegionState("ALGERIA");
      setRegionModalOpen(false);
      return;
    }
    const cookieVal = getClientCookie("region");
    const localVal = typeof window !== "undefined" ? localStorage.getItem("elhuyaam-region") : null;
    const resolved = cookieVal || localVal;
    const parsed: Region =
      resolved === "ALGERIA" || resolved === "INTERNATIONAL"
        ? (resolved as Region)
        : null;
    setRegionState(parsed);
    // Show the region modal only if no region is set yet
    setRegionModalOpen(!parsed);
  }, [isInternationalEnabled]);

  const setRegion = (newRegion: Region) => {
    if (!isInternationalEnabled && newRegion === "INTERNATIONAL") {
      newRegion = "ALGERIA";
    }

    setRegionState(newRegion);
    if (newRegion) {
      // Set region cookie & localStorage
      try {
        document.cookie = `region=${newRegion}; path=/; max-age=31536000; SameSite=Lax`;
        if (newRegion === "INTERNATIONAL") {
          document.cookie = `locale=en; path=/; max-age=31536000; SameSite=Lax`;
        }
        if (typeof window !== "undefined") {
          localStorage.setItem("elhuyaam-region", newRegion);
        }
      } catch {}
      setRegionModalOpen(false);
      
      router.refresh();
    }
  };

  return (
    <RegionContext.Provider
      value={{
        region: isInternationalEnabled ? region : "ALGERIA",
        setRegion,
        isRegionModalOpen: isInternationalEnabled ? isRegionModalOpen : false,
        setRegionModalOpen,
        isInternationalEnabled,
      }}
    >
      {children}
    </RegionContext.Provider>
  );
}

export function useRegion() {
  const context = useContext(RegionContext);
  if (context === undefined) {
    throw new Error("useRegion must be used within a RegionProvider");
  }
  return context;
}
