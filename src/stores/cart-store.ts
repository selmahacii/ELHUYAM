import { create } from "zustand";
import { persist } from "zustand/middleware";
import { signOut } from "next-auth/react";

interface CartItem {
  id: string;
  productId: string;
  title: string;
  price: number;
  priceEur: number;
  image?: string;
  quantity: number;
  size?: string | null;
  color?: string | null;
  variantId?: string | null;
}

interface AddItemPayload {
  productId: string;
  quantity: number;
  size?: string | null;
  color?: string | null;
  variantId?: string | null;
  productData?: {
    title: string;
    price: number;
    discountPrice?: number | null;
    priceEur: number;
    discountPriceEur?: number | null;
    images: string[] | any;
    variants?: any[];
    stock: number;
  };
}

interface CartStore {
  items: CartItem[];
  isAuthenticated: boolean;
  setAuthenticated: (auth: boolean) => void;
  addItem: (payload: AddItemPayload) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => void;
  syncWithServer: () => Promise<void>;
  subtotal: (isInternational?: boolean) => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isAuthenticated: false,
      setAuthenticated: (auth) => set({ isAuthenticated: auth }),

      addItem: async ({ productId, quantity, size, color, variantId, productData }) => {
        try {
          // If not authenticated, bypass server and run guest logic directly
          if (!get().isAuthenticated) {
            let product;
            if (productData) {
              product = productData;
            } else {
              const prodRes = await fetch(`/api/products/${productId}`);
              if (!prodRes.ok) throw new Error("Produit non trouvé");
              
              const prodData = await prodRes.json();
              if (!prodData.success || !prodData.data) throw new Error("Produit invalide");
              product = prodData.data;
            }

            let price = product.discountPrice ?? product.price;
            let priceEur = product.discountPriceEur ?? product.priceEur ?? 0;
            let maxStock = product.stock;
            let productImages = Array.isArray(product.images) 
              ? product.images 
              : (typeof product.images === "string" ? JSON.parse(product.images) : []);
            let image = productImages?.[0] ?? "/placeholder-product.jpg";

            if (variantId && product.variants) {
              const variant = product.variants.find((v: { id: string }) => v.id === variantId);
              if (variant) {
                price = variant.price ?? price;
                priceEur = variant.priceEur ?? priceEur;
                maxStock = variant.stock;
                if (variant.image) image = variant.image;
              }
            }

            const localId = `local-${productId}-${variantId ?? "none"}-${size ?? "none"}-${color ?? "none"}`;
            const currentItems = get().items;
            const existingIndex = currentItems.findIndex((item) => item.id === localId);

            if (existingIndex > -1) {
              const newQty = currentItems[existingIndex].quantity + quantity;
              if (newQty > maxStock) {
                throw new Error(`Stock insuffisant. Stock maximum disponible: ${maxStock}.`);
              }
              const updatedItems = [...currentItems];
              updatedItems[existingIndex] = {
                ...updatedItems[existingIndex],
                quantity: newQty,
              };
              set({ items: updatedItems });
            } else {
              if (quantity > maxStock) {
                throw new Error(`Stock insuffisant. Stock maximum disponible: ${maxStock}.`);
              }
              const newItem: CartItem = {
                id: localId,
                productId,
                title: product.title,
                price,
                priceEur,
                image,
                quantity,
                size: size ?? null,
                color: color ?? null,
                variantId: variantId ?? null,
              };
              set({ items: [...currentItems, newItem] });
            }
            return;
          }

          // Otherwise, attempt server request
          const res = await fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId, quantity, size, color, variantId }),
          });

          if (res.ok) {
            const resData = await res.json().catch(() => null);
            if (resData?.success && resData?.data) {
              const dbItem = resData.data;
              const dbId = dbItem.id;
              
              const currentItems = get().items;
              const existingIndex = currentItems.findIndex((item) => item.id === dbId);
              
              if (existingIndex > -1) {
                const updatedItems = [...currentItems];
                updatedItems[existingIndex] = {
                  ...updatedItems[existingIndex],
                  quantity: dbItem.quantity,
                };
                set({ items: updatedItems });
              } else {
                let product = productData;
                let price = product?.discountPrice ?? product?.price ?? dbItem.product?.price ?? 0;
                let priceEur = product?.discountPriceEur ?? product?.priceEur ?? dbItem.product?.priceEur ?? 0;
                let productImages = product ? (Array.isArray(product.images) ? product.images : (typeof product.images === "string" ? JSON.parse(product.images) : [])) : (dbItem.product?.images ?? []);
                let image = productImages?.[0] ?? "/placeholder-product.jpg";

                if (variantId && product?.variants) {
                  const variant = product.variants.find((v: { id: string }) => v.id === variantId);
                  if (variant) {
                    price = variant.price ?? price;
                priceEur = variant.priceEur ?? priceEur;
                    if (variant.image) image = variant.image;
                  }
                }
                const newItem: CartItem = {
                  id: dbId,
                  productId,
                  title: product?.title ?? dbItem.product?.title ?? "",
                  price,
                  priceEur,
                  image,
                  quantity: dbItem.quantity,
                  size: size ?? null,
                  color: color ?? null,
                  variantId: variantId ?? null,
                };
                set({ items: [...currentItems, newItem] });
              }
            } else {
              await get().syncWithServer();
            }
            // Trigger background sync to ensure data consistency
            get().syncWithServer().catch(() => null);
            return;
          }

          if (res.status === 401) {
            console.warn("[Cart Store] AddItem request returned 401 Unauthorized. Invalidating client-side session...");
            set({ isAuthenticated: false });
            signOut({ redirect: false }).catch(() => null);
            // Guest fallback logic
            let product;
            if (productData) {
              product = productData;
            } else {
              const prodRes = await fetch(`/api/products/${productId}`);
              if (!prodRes.ok) throw new Error("Produit non trouvé");
              
              const prodData = await prodRes.json();
              if (!prodData.success || !prodData.data) throw new Error("Produit invalide");
              product = prodData.data;
            }

            let price = product.discountPrice ?? product.price;
            let priceEur = product.discountPriceEur ?? product.priceEur ?? 0;
            let maxStock = product.stock;
            let productImages = Array.isArray(product.images) 
              ? product.images 
              : (typeof product.images === "string" ? JSON.parse(product.images) : []);
            let image = productImages?.[0] ?? "/placeholder-product.jpg";

            if (variantId && product.variants) {
              const variant = product.variants.find((v: { id: string }) => v.id === variantId);
              if (variant) {
                price = variant.price ?? price;
                priceEur = variant.priceEur ?? priceEur;
                maxStock = variant.stock;
                if (variant.image) image = variant.image;
              }
            }

            const localId = `local-${productId}-${variantId ?? "none"}-${size ?? "none"}-${color ?? "none"}`;
            const currentItems = get().items;
            const existingIndex = currentItems.findIndex((item) => item.id === localId);

            if (existingIndex > -1) {
              const newQty = currentItems[existingIndex].quantity + quantity;
              if (newQty > maxStock) {
                throw new Error(`Stock insuffisant. Stock maximum disponible: ${maxStock}.`);
              }
              const updatedItems = [...currentItems];
              updatedItems[existingIndex] = {
                ...updatedItems[existingIndex],
                quantity: newQty,
              };
              set({ items: updatedItems });
            } else {
              if (quantity > maxStock) {
                throw new Error(`Stock insuffisant. Stock maximum disponible: ${maxStock}.`);
              }
              const newItem: CartItem = {
                id: localId,
                productId,
                title: product.title,
                price,
                priceEur,
                image,
                quantity,
                size: size ?? null,
                color: color ?? null,
                variantId: variantId ?? null,
              };
              set({ items: [...currentItems, newItem] });
            }
            return;
          }

          const resData = await res.json().catch(() => null);
          throw new Error(resData?.error ?? "Échec de l'ajout au panier");
        } catch (err) {
          throw err;
        }
      },

      removeItem: async (itemId) => {
        if (itemId.startsWith("local-") || !get().isAuthenticated) {
          set((state) => ({ items: state.items.filter((i) => i.id !== itemId) }));
          return;
        }

        try {
          const res = await fetch("/api/cart", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ itemId }),
          });

          if (res.ok) {
            set((state) => ({ items: state.items.filter((i) => i.id !== itemId) }));
          } else if (res.status === 401) {
            console.warn("[Cart Store] RemoveItem request returned 401 Unauthorized. Invalidating client-side session...");
            set({ isAuthenticated: false });
            signOut({ redirect: false }).catch(() => null);
            set((state) => ({ items: state.items.filter((i) => i.id !== itemId) }));
          }
        } catch {
          set((state) => ({ items: state.items.filter((i) => i.id !== itemId) }));
        }
      },

      updateQuantity: async (itemId, quantity) => {
        if (quantity <= 0) {
          await get().removeItem(itemId);
          return;
        }

        set((state) => ({
          items: state.items.map((i) => (i.id === itemId ? { ...i, quantity } : i)),
        }));

        if (itemId.startsWith("local-") || !get().isAuthenticated) {
          return;
        }

        try {
          const res = await fetch("/api/cart", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ itemId, quantity }),
          });
          if (res.status === 401) {
            console.warn("[Cart Store] UpdateQuantity request returned 401 Unauthorized. Invalidating client-side session...");
            set({ isAuthenticated: false });
            signOut({ redirect: false }).catch(() => null);
          } else if (!res.ok) {
            await get().syncWithServer();
          }
        } catch {
          // Silent local fallback
        }
      },

      clearCart: () => set({ items: [] }),

      syncWithServer: async () => {
        if (!get().isAuthenticated) return;
        try {
          const res = await fetch("/api/cart");
          if (res.ok) {
            const data = await res.json();
            const serverItems = (data.data ?? []).map((item: {
              id: string;
              productId: string;
              product: { title: string; price: number; discountPrice?: number | null; priceEur: number; discountPriceEur?: number | null; images: string[] };
              variant?: { id: string; price?: number | null; priceEur?: number | null } | null;
              quantity: number;
              size?: string | null;
              color?: string | null;
              variantId?: string | null;
            }) => ({
              id: item.id,
              productId: item.productId,
              title: item.product.title,
              price: item.variant?.price ?? item.product.discountPrice ?? item.product.price,
              priceEur: item.variant?.priceEur ?? item.product.discountPriceEur ?? item.product.priceEur ?? 0,
              image: item.product.images[0],
              quantity: item.quantity,
              size: item.size,
              color: item.color,
              variantId: item.variantId,
            }));
            set({ items: serverItems });
          } else if (res.status === 401) {
            console.warn("[Cart Store] SyncWithServer request returned 401 Unauthorized. Invalidating client-side session...");
            set({ isAuthenticated: false });
            signOut({ redirect: false }).catch(() => null);
          }
        } catch {
          // Keep local state on fetch failures
        }
      },

      subtotal: (isInternational?: boolean) => get().items.reduce((sum, item) => sum + (isInternational ? (item.priceEur || 0) : item.price) * item.quantity, 0),
    }),
    {
      name: "el-huyaam-cart",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
