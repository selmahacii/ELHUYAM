import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistStore {
  productIds: string[];
  isAuthenticated: boolean;
  setAuthenticated: (auth: boolean) => void;
  toggleItem: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  syncWithServer: () => Promise<void>;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      productIds: [],
      isAuthenticated: false,
      setAuthenticated: (auth) => {
        if (get().isAuthenticated !== auth) {
          set({ isAuthenticated: auth });
        }
      },

      toggleItem: async (productId) => {
        if (!get().isAuthenticated) {
          throw new Error("Unauthorized");
        }

        const res = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });

        if (res.status === 401) {
          set({ isAuthenticated: false });
          throw new Error("Unauthorized");
        }

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error ?? "Failed to update wishlist");
        }

        const data = await res.json();
        if (data.data?.action === "added") {
          set((state) => ({ productIds: [...state.productIds, productId] }));
        } else {
          set((state) => ({ productIds: state.productIds.filter((id) => id !== productId) }));
        }
      },

      isInWishlist: (productId) => get().productIds.includes(productId),

      syncWithServer: async () => {
        if (!get().isAuthenticated) return;
        try {
          const res = await fetch("/api/wishlist");
          if (res.ok) {
            const data = await res.json();
            const ids = (data.data ?? []).map((item: { productId: string }) => item.productId);
            set({ productIds: ids });
          } else if (res.status === 401) {
            set({ isAuthenticated: false });
          }
        } catch {
          // Silent
        }
      },
    }),
    { 
      name: "el-huyaam-wishlist",
      partialize: (state) => ({ productIds: state.productIds }),
    }
  )
);
