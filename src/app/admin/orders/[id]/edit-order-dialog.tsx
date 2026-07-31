"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { WILAYAS, getShippingCost } from "@/lib/wilayas";
import { formatPrice } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Edit3,
  User,
  ShoppingBag,
  Plus,
  Trash2,
  Search,
  Package,
  Loader2,
} from "lucide-react";
import Image from "next/image";

interface EditOrderDialogProps {
  order: any;
}

interface OrderItemEdit {
  id?: string;
  productId: string;
  productTitle: string;
  productImage?: string | null;
  quantity: number;
  price: number;
  size?: string | null;
  color?: string | null;
}

export default function EditOrderDialog({ order }: EditOrderDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const cur = order.isInternational ? "EUR" : "DZD";
  const curLabel = order.isInternational ? "EUR" : "DA";

  // Form states - Customer & Shipping
  const [firstName, setFirstName] = useState(order.shippingFirstName ?? "");
  const [lastName, setLastName] = useState(order.shippingLastName ?? "");
  const [phone, setPhone] = useState(order.shippingPhone ?? "");
  const [street, setStreet] = useState(order.shippingStreet ?? "");
  const [city, setCity] = useState(order.shippingCity ?? "");
  const [wilayaCode, setWilayaCode] = useState(order.wilayaCode ?? "16");
  const [deliveryType, setDeliveryType] = useState<"DOMICILE" | "STOPDESK">(
    order.deliveryType === "STOPDESK" ? "STOPDESK" : "DOMICILE"
  );
  const [notes, setNotes] = useState(order.notes ?? "");

  // Items state
  const [items, setItems] = useState<OrderItemEdit[]>([]);

  // Search product states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [newSize, setNewSize] = useState("");
  const [newColor, setNewColor] = useState("");
  const [newQty, setNewQty] = useState(1);
  const [newPrice, setNewPrice] = useState(0);

  // Initialize modal state whenever `order` or `open` changes
  useEffect(() => {
    if (open) {
      setFirstName(order.shippingFirstName ?? "");
      setLastName(order.shippingLastName ?? "");
      setPhone(order.shippingPhone ?? "");
      setStreet(order.shippingStreet ?? "");
      setCity(order.shippingCity ?? "");
      setWilayaCode(order.wilayaCode ?? "16");
      setDeliveryType(order.deliveryType === "STOPDESK" ? "STOPDESK" : "DOMICILE");
      setNotes(order.notes ?? "");

      setItems(
        order.items.map((i: any) => ({
          id: i.id,
          productId: i.productId,
          productTitle: i.productTitle,
          productImage: i.productImage ?? i.product?.images?.[0],
          quantity: i.quantity,
          price: i.price,
          size: i.size,
          color: i.color,
        }))
      );
    }
  }, [open, order]);

  // Product search effect
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/products/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.data ?? []);
        }
      } catch {
        // quiet fail
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, open]);

  // Handle select product for adding to cart
  const handleSelectProduct = (prod: any) => {
    setSelectedProduct(prod);
    const initialPrice = order.isInternational
      ? (prod.discountPriceEur ?? prod.priceEur ?? 0)
      : (prod.discountPrice ?? prod.price ?? 0);
    setNewPrice(initialPrice);
    setNewQty(1);

    if (prod.variants && prod.variants.length > 0) {
      const firstVar = prod.variants[0];
      setNewSize(firstVar.size ?? "");
      setNewColor(firstVar.color ?? "");
    } else {
      setNewSize("");
      setNewColor("");
    }
  };

  // Add selected item to order basket
  const handleAddItem = () => {
    if (!selectedProduct) return;

    setItems((prev) => [
      ...prev,
      {
        productId: selectedProduct.id,
        productTitle: selectedProduct.title,
        productImage: selectedProduct.images?.[0] ?? null,
        quantity: Math.max(1, newQty),
        price: Math.max(0, newPrice),
        size: newSize || null,
        color: newColor || null,
      },
    ]);

    setSelectedProduct(null);
    setSearchQuery("");
    toast.success("Produit ajouté au panier !");
  };

  // Remove item from basket
  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Update item quantity or price
  const handleUpdateItem = (index: number, field: keyof OrderItemEdit, val: any) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          return { ...item, [field]: val };
        }
        return item;
      })
    );
  };

  // Calculated financial totals
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = getShippingCost(wilayaCode, deliveryType, subtotal);
  const totalAmount = Math.max(0, subtotal + shippingFee - (order.discount ?? 0));

  // Save changes to API
  const handleSave = async () => {
    if (items.length === 0) {
      toast.error("Le panier de la commande ne peut pas être vide.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingFirstName: firstName,
          shippingLastName: lastName,
          shippingPhone: phone,
          shippingStreet: street,
          shippingCity: city,
          wilayaCode,
          deliveryType,
          notes,
          items,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        toast.error(data.error ?? "Erreur lors de la mise à jour de la commande.");
        return;
      }

      toast.success("Commande et panier mis à jour avec succès !");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Erreur de connexion avec le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full bg-amber-50 hover:bg-amber-100/80 text-amber-900 border-amber-300 font-bold uppercase tracking-wider text-[11px] h-9 shadow-xs"
        >
          <Edit3 className="w-3.5 h-3.5 mr-1.5 text-amber-700" />
          Modifier la commande & panier
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 gap-0 border-zinc-200 shadow-2xl rounded-sm">
        {/* Header */}
        <div className="px-6 py-4 bg-zinc-900 text-white flex items-center justify-between sticky top-0 z-20">
          <div>
            <div className="flex items-center gap-2">
              <DialogTitle className="text-base font-bold font-display text-white">
                Modifier la commande {order.orderNumber}
              </DialogTitle>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Mettez à jour les coordonnées de la cliente, les articles du panier et les prix.
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6 bg-zinc-50/50">
          {/* Section 1: Customer & Delivery Details */}
          <div className="bg-white border border-zinc-200 rounded-sm p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-zinc-150 pb-2">
              <User className="w-4 h-4 text-zinc-600" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-900">
                1. Coordonnées de la Cliente & Livraison
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  Prénom
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 border border-zinc-250 rounded-sm focus:outline-none focus:border-zinc-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 border border-zinc-250 rounded-sm focus:outline-none focus:border-zinc-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  Téléphone
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 border border-zinc-250 rounded-sm focus:outline-none focus:border-zinc-900 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  Wilaya
                </label>
                <select
                  value={wilayaCode}
                  onChange={(e) => setWilayaCode(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 border border-zinc-250 rounded-sm focus:outline-none focus:border-zinc-900 bg-white"
                >
                  {WILAYAS.map((w) => (
                    <option key={w.code} value={w.code}>
                      {w.code} - {w.name} ({w.nameAr})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  Commune / Ville
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 border border-zinc-250 rounded-sm focus:outline-none focus:border-zinc-900 bg-white"
                  placeholder="ex: Cheraga"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  Type de livraison
                </label>
                <select
                  value={deliveryType}
                  onChange={(e) => setDeliveryType(e.target.value as any)}
                  className="w-full text-xs font-medium px-3 py-2 border border-zinc-250 rounded-sm focus:outline-none focus:border-zinc-900 bg-white"
                >
                  <option value="DOMICILE">🏠 À domicile</option>
                  <option value="STOPDESK">📦 Stop Desk (Bureau ZR/Yalidine)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                Adresse exacte (Rue, quartier, bâtiment)
              </label>
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 border border-zinc-250 rounded-sm focus:outline-none focus:border-zinc-900 bg-white"
                placeholder="ex: Cité 1000 logements, N° 45"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                Instructions / Note cliente
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full text-xs font-medium p-2.5 border border-zinc-250 rounded-sm focus:outline-none focus:border-zinc-900 bg-white"
                placeholder="ex: Appeler avant d'arriver..."
              />
            </div>
          </div>

          {/* Section 2: Basket Items & Product Editor */}
          <div className="bg-white border border-zinc-200 rounded-sm p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-zinc-150 pb-2">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-zinc-600" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-900">
                  2. Contenu du Panier ({items.length} article{items.length > 1 ? "s" : ""})
                </h3>
              </div>
            </div>

            {/* Current Items List */}
            <div className="divide-y divide-zinc-200 border border-zinc-200 rounded-sm overflow-hidden bg-white">
              {items.length === 0 ? (
                <div className="p-8 text-center text-zinc-400 text-xs font-medium">
                  Le panier est vide. Recherchez et ajoutez un produit ci-dessous.
                </div>
              ) : (
                items.map((item, idx) => (
                  <div key={idx} className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-zinc-50/50">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {item.productImage ? (
                        <div className="w-10 h-12 relative rounded border border-zinc-200 overflow-hidden shrink-0 bg-zinc-100">
                          <Image src={item.productImage} alt={item.productTitle} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-12 rounded border border-zinc-200 bg-zinc-100 flex items-center justify-center shrink-0 text-zinc-400">
                          <Package className="w-4 h-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-900 truncate" title={item.productTitle}>
                          {item.productTitle}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="text"
                            placeholder="Taille"
                            value={item.size ?? ""}
                            onChange={(e) => handleUpdateItem(idx, "size", e.target.value)}
                            className="w-16 text-[10px] font-semibold uppercase px-1.5 py-0.5 border border-zinc-200 rounded bg-zinc-50"
                          />
                          <input
                            type="text"
                            placeholder="Couleur"
                            value={item.color ?? ""}
                            onChange={(e) => handleUpdateItem(idx, "color", e.target.value)}
                            className="w-20 text-[10px] font-semibold uppercase px-1.5 py-0.5 border border-zinc-200 rounded bg-zinc-50"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end">
                      {/* Quantity Input */}
                      <div className="flex items-center border border-zinc-250 rounded overflow-hidden">
                        <button
                          type="button"
                          onClick={() => handleUpdateItem(idx, "quantity", Math.max(1, item.quantity - 1))}
                          className="px-2 py-1 text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-mono font-bold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateItem(idx, "quantity", item.quantity + 1)}
                          className="px-2 py-1 text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                        >
                          +
                        </button>
                      </div>

                      {/* Price Input */}
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => handleUpdateItem(idx, "price", parseFloat(e.target.value) || 0)}
                          className="w-20 text-xs font-mono font-bold px-2 py-1 border border-zinc-250 rounded text-right bg-white"
                        />
                        <span className="text-[10px] font-bold text-zinc-400">{curLabel}</span>
                      </div>

                      {/* Line Subtotal */}
                      <p className="w-24 text-right text-xs font-mono font-bold text-zinc-900">
                        {formatPrice(item.price * item.quantity, cur)}
                      </p>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                        title="Supprimer l'article"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Product Search Section */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-sm p-4 space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-zinc-500" />
                Ajouter un article au panier
              </h4>

              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Rechercher un produit dans le catalogue..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs font-medium pl-9 pr-4 py-2 border border-zinc-250 rounded-sm focus:outline-none focus:border-zinc-900 bg-white"
                />
              </div>

              {/* Search Results list */}
              {searchResults.length > 0 && !selectedProduct && (
                <div className="max-h-48 overflow-y-auto border border-zinc-200 rounded bg-white divide-y divide-zinc-100">
                  {searchResults.map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => handleSelectProduct(prod)}
                      className="p-2.5 hover:bg-zinc-100/70 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        {prod.images?.[0] ? (
                          <div className="w-8 h-10 relative rounded overflow-hidden border border-zinc-200 shrink-0">
                            <Image src={prod.images[0]} alt={prod.title} fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-8 h-10 rounded border border-zinc-200 bg-zinc-100 flex items-center justify-center text-zinc-400 shrink-0">
                            <Package className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold text-zinc-900">{prod.title}</p>
                          <p className="text-[10px] text-zinc-400 font-mono">Stock: {prod.stock}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold font-mono text-zinc-800">
                        {formatPrice(
                          order.isInternational ? (prod.discountPriceEur ?? prod.priceEur) : (prod.discountPrice ?? prod.price),
                          cur
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Product Form */}
              {selectedProduct && (
                <div className="bg-white border-2 border-zinc-900 rounded p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-zinc-900">{selectedProduct.title}</p>
                    <button
                      type="button"
                      onClick={() => setSelectedProduct(null)}
                      className="text-xs text-zinc-400 hover:text-zinc-700 underline"
                    >
                      Changer de produit
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Size Selector */}
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                        Taille
                      </label>
                      {selectedProduct.variants && selectedProduct.variants.some((v: any) => v.size) ? (
                        <select
                          value={newSize}
                          onChange={(e) => setNewSize(e.target.value)}
                          className="w-full text-xs font-medium px-2 py-1.5 border border-zinc-250 rounded bg-white"
                        >
                          <option value="">Standard</option>
                          {Array.from(new Set(selectedProduct.variants.map((v: any) => v.size).filter(Boolean))).map(
                            (sz: any) => (
                              <option key={sz} value={sz}>
                                {sz}
                              </option>
                            )
                          )}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={newSize}
                          onChange={(e) => setNewSize(e.target.value)}
                          placeholder="Standard"
                          className="w-full text-xs font-medium px-2 py-1.5 border border-zinc-250 rounded bg-white"
                        />
                      )}
                    </div>

                    {/* Color Selector */}
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                        Couleur
                      </label>
                      {selectedProduct.variants && selectedProduct.variants.some((v: any) => v.color) ? (
                        <select
                          value={newColor}
                          onChange={(e) => setNewColor(e.target.value)}
                          className="w-full text-xs font-medium px-2 py-1.5 border border-zinc-250 rounded bg-white"
                        >
                          <option value="">Default</option>
                          {Array.from(new Set(selectedProduct.variants.map((v: any) => v.color).filter(Boolean))).map(
                            (cl: any) => (
                              <option key={cl} value={cl}>
                                {cl}
                              </option>
                            )
                          )}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={newColor}
                          onChange={(e) => setNewColor(e.target.value)}
                          placeholder="Unique"
                          className="w-full text-xs font-medium px-2 py-1.5 border border-zinc-250 rounded bg-white"
                        />
                      )}
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                        Quantité
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newQty}
                        onChange={(e) => setNewQty(parseInt(e.target.value) || 1)}
                        className="w-full text-xs font-mono font-bold px-2 py-1.5 border border-zinc-250 rounded bg-white"
                      />
                    </div>

                    {/* Unit Price */}
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                        Prix Unitaire ({curLabel})
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newPrice}
                        onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                        className="w-full text-xs font-mono font-bold px-2 py-1.5 border border-zinc-250 rounded bg-white"
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleAddItem}
                    size="sm"
                    className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold uppercase tracking-wider text-[10px] h-8"
                  >
                    Confirm & Ajouter au panier
                  </Button>
                </div>
              )}
            </div>

            {/* Live Recalculated Summary */}
            <div className="bg-zinc-100/70 border border-zinc-200 rounded-sm p-4 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-zinc-600">
                <span>Sous-total Panier:</span>
                <span className="font-bold">{formatPrice(subtotal, cur)}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Frais de Livraison ({deliveryType === "STOPDESK" ? "StopDesk" : "Domicile"}):</span>
                <span className="font-bold">{formatPrice(shippingFee, cur)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Remise appliquée:</span>
                  <span className="font-bold">-{formatPrice(order.discount, cur)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-zinc-950 border-t border-zinc-250 pt-2 font-display">
                <span>TOTAL NOUVEAU:</span>
                <span>{formatPrice(totalAmount, cur)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-zinc-100 border-t border-zinc-200 flex items-center justify-between sticky bottom-0 z-20">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
            className="text-xs font-bold uppercase tracking-wider"
          >
            Annuler
          </Button>

          <Button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wider text-xs px-6"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              "Enregistrer les modifications"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
