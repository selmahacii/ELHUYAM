"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export type Region = "ALGERIA" | "INTERNATIONAL" | null;

interface RegionContextType {
  region: Region;
  setRegion: (region: Region) => void;
  isRegionModalOpen: boolean;
  setRegionModalOpen: (open: boolean) => void;
}

const RegionContext = createContext<RegionContextType | undefined>(undefined);

export function RegionProvider({
  children,
  initialRegion,
}: {
  children: React.ReactNode;
  initialRegion: Region;
}) {
  const [region, setRegionState] = useState<Region>(initialRegion);
  const [isRegionModalOpen, setRegionModalOpen] = useState<boolean>(!initialRegion);
  const router = useRouter();

  const setRegion = (newRegion: Region) => {
    setRegionState(newRegion);
    if (newRegion) {
      // Set region cookie
      document.cookie = `region=${newRegion}; path=/; max-age=31536000`;
      // Force English if International, else default to French (or leave current if Algerian)
      if (newRegion === "INTERNATIONAL") {
        document.cookie = `locale=en; path=/; max-age=31536000`;
      }
      setRegionModalOpen(false);
      
      // Hard refresh to ensure layout and next-intl picks up the new locale/region
      window.location.reload();
    }
  };

  return (
    <RegionContext.Provider
      value={{ region, setRegion, isRegionModalOpen, setRegionModalOpen }}
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
