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

export function RegionProvider({
  children,
  initialRegion,
  isInternationalEnabled = true,
}: {
  children: React.ReactNode;
  initialRegion: Region;
  isInternationalEnabled?: boolean;
}) {
  const activeInitialRegion = isInternationalEnabled ? initialRegion : "ALGERIA";
  const [region, setRegionState] = useState<Region>(activeInitialRegion);
  const [isRegionModalOpen, setRegionModalOpen] = useState<boolean>(
    isInternationalEnabled ? !activeInitialRegion : false
  );
  const router = useRouter();

  const setRegion = (newRegion: Region) => {
    if (!isInternationalEnabled && newRegion === "INTERNATIONAL") {
      newRegion = "ALGERIA";
    }

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
