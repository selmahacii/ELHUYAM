"use client";

import { useState, useCallback, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Trash2, Search, Loader2, PackagePlus } from "lucide-react";
import { WILAYAS } from "@/lib/wilayas";
import { formatPrice } from "@/lib/utils";

interface CategoryProp {
  id: string;
  name: string;
}

interface ProductVariantProp {
  id: string;
  size: string | null;
  color: string | null;
  colorHex: string | null;
  image: string | null;
  stock: number;
  price: number | null;
}

interface ProductProp {
  id: string;
  title: string;
  price: number;
  discountPrice: number | null;
  stock: number;
  images: string[];
  categoryId: string | null;
  variants?: ProductVariantProp[];
}

interface OrderItem {
  id: string; // unique item key: productId-size-color
  productId: string;
  title: string;
  image: string | null;
  basePrice: number;
  priceOverride: string;
  quantity: number;
  stock: number;
  size?: string | null;
  color?: string | null;
}

export default function ManualOrderModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Product/category picker data used to always be fetched server-side on
  // every /admin/orders page load (even just paginating). It's only needed
  // once this modal is actually opened, so fetch it lazily then instead.
  const [categories, setCategories] = useState<CategoryProp[]>([]);
  const [products, setProducts] = useState<ProductProp[]>([]);
  const [loadingPickerData, setLoadingPickerData] = useState(false);
  const pickerDataLoaded = useRef(false);

  useEffect(() => {
    if (!open || pickerDataLoaded.current) return;
    pickerDataLoaded.current = true;
    setLoadingPickerData(true);
    fetch("/api/admin/orders/manual-order-data")
      .then((res) => res.json())
      .then((json) => {
        if (json?.success) {
          setProducts(json.data.products ?? []);
          setCategories(json.data.categories ?? []);
        }
      })
      .finally(() => setLoadingPickerData(false));
  }, [open]);

  // Customer
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  // Product filters & selection
  const [selectedFilterCategory, setSelectedFilterCategory] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, { size?: string; color?: string }>>({});

  // Delivery
  const [wilayaCode, setWilayaCode] = useState("");
  const [deliveryType, setDeliveryType] = useState<"DOMICILE" | "STOPDESK">("DOMICILE");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");

  // Payment & order meta
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "virement" | "autre">("cod");
  const [paymentStatus, setPaymentStatus] = useState<"PENDING" | "PAID">("PENDING");
  const [status, setStatus] = useState<"PENDING" | "CONFIRMED" | "PROCESSING">("CONFIRMED");
  const [discount, setDiscount] = useState("0");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Filter products locally from the loaded props
  const filteredProducts = products.filter((p) => {
    const matchesCategory = !selectedFilterCategory || p.categoryId === selectedFilterCategory;
    const matchesSearch = !productSearch || p.title.toLowerCase().includes(productSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate live linked color-to-size variant attributes
  const getSelectedVariantInfo = (p: ProductProp) => {
    const selection = selectedVariants[p.id] || {};
    const hasVariants = p.variants && p.variants.length > 0;

    if (!hasVariants) {
      return {
        size: null,
        color: null,
        price: p.discountPrice ?? p.price,
        image: p.images[0] ?? null,
        stock: p.stock,
        sizes: [],
        colors: [],
      };
    }

    // 1. Unique Colors available globally
    const allColors = Array.from(new Set(p.variants!.map((v) => v.color).filter(Boolean))) as string[];

    // Default color to the first available if not set yet
    let color = selection.color;
    if (!color && allColors.length > 0) {
      color = allColors[0];
    }

    // 2. Unique Sizes available specifically for this selected color
    const availableSizes = Array.from(
      new Set(
        p.variants!
          .filter((v) => !color || v.color === color)
          .map((v) => v.size)
          .filter(Boolean)
      )
    ) as string[];

    // Default size to the first available size for the selected color
    let size = selection.size;
    if ((!size || !availableSizes.includes(size)) && availableSizes.length > 0) {
      size = availableSizes[0];
    }

    // Find corresponding variant row
    const variant = p.variants!.find((v) =>
      (!size || v.size === size) &&
      (!color || v.color === color)
    ) || p.variants![0];

    return {
      size: variant?.size ?? null,
      color: variant?.color ?? null,
      price: variant?.price ?? p.discountPrice ?? p.price,
      image: variant?.image ?? p.images[0] ?? null,
      stock: variant?.stock ?? p.stock,
      sizes: availableSizes,
      colors: allColors,
    };
  };

  const addItemWithVariant = (p: ProductProp, vInfo: any) => {
    const itemKey = `${p.id}-${vInfo.size || ""}-${vInfo.color || ""}`;
    setItems((prev) => {
      const existing = prev.find((i) => i.id === itemKey);
      if (existing) {
        return prev.map((i) =>
          i.id === itemKey ? { ...i, quantity: Math.min(i.quantity + 1, i.stock) } : i
        );
      }
      return [
        ...prev,
        {
          id: itemKey,
          productId: p.id,
          title: p.title,
          image: vInfo.image,
          basePrice: vInfo.price,
          priceOverride: "",
          quantity: 1,
          stock: vInfo.stock,
          size: vInfo.size,
          color: vInfo.color,
        },
      ];
    });
  };

  const removeItem = (id: string) => setItems((p) => p.filter((i) => i.id !== id));

  const updateItem = (id: string, field: "quantity" | "priceOverride", value: string | number) =>
    setItems((p) => p.map((i) => (i.id === id ? { ...i, [field]: value } : i)));

  const selectedWilaya = WILAYAS.find((w) => w.code === wilayaCode);
  const shippingFee = selectedWilaya
    ? deliveryType === "DOMICILE" ? selectedWilaya.domicile : selectedWilaya.stopdesk
    : 0;

  const subtotal = items.reduce((sum, i) => {
    const price = i.priceOverride !== "" ? parseFloat(i.priceOverride) || 0 : i.basePrice;
    return sum + price * i.quantity;
  }, 0);
  const discountNum = parseFloat(discount) || 0;
  const total = Math.max(0, subtotal + shippingFee - discountNum);

  const reset = () => {
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setItems([]);
    setProductSearch("");
    setSelectedFilterCategory("");
    setSelectedVariants({});
    setWilayaCode("");
    setDeliveryType("DOMICILE");
    setStreet("");
    setCity("");
    setPaymentMethod("cod");
    setPaymentStatus("PENDING");
    setStatus("CONFIRMED");
    setDiscount("0");
    setNotes("");
    setError("");
  };

  const handleClose = () => {
    reset();
    setOpen(false);
  };

  const handleSubmit = async () => {
    setError("");
    if (!customerName.trim()) return setError("Client name is required.");
    if (!customerPhone.trim()) return setError("Phone number is required.");
    if (!customerEmail.trim()) return setError("Email address is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
      return setError("Please enter a valid email address.");
    }
    if (items.length === 0) return setError("Add at least one product.");
    if (!wilayaCode) return setError("Select a wilaya.");

    const selectedRate = deliveryType === "DOMICILE" ? selectedWilaya?.domicile : selectedWilaya?.stopdesk;
    if (selectedRate === 0) return setError("Delivery for this method is not available for the selected wilaya.");

    setSubmitting(true);
    try {
      const payload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim().toLowerCase(),
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          priceOverride: i.priceOverride !== "" ? parseFloat(i.priceOverride) : undefined,
          size: i.size || undefined,
          color: i.color || undefined,
        })),
        wilayaCode,
        deliveryType,
        street: street.trim() || undefined,
        city: city.trim() || undefined,
        paymentMethod,
        paymentStatus,
        status,
        discount: discountNum,
        notes: notes.trim() || undefined,
      };

      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error during creation.");
        return;
      }

      handleClose();
      startTransition(() => router.refresh());
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors"
      >
        <PackagePlus className="w-4 h-4" />
        New order
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

          {/* Panel */}
          <div className="relative ml-auto w-full max-w-2xl bg-white h-full flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/10">
              <div>
                <h2 className="font-display text-xl text-black">New manual order</h2>
                <p className="text-xs text-black/60 mt-0.5">Create an order for a customer</p>
              </div>
              <button onClick={handleClose} className="p-2 hover:bg-gray-50 rounded transition-colors">
                <X className="w-4 h-4 text-black" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Customer */}
              <section>
                <h3 className="text-xs uppercase tracking-widest text-black font-semibold mb-3">Customer</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs text-black font-medium mb-1 block">Full name *</label>
                    <input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Fatima Zahra"
                      className="w-full border border-black/20 px-3 py-2 text-sm focus:outline-none focus:border-black text-black bg-white"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs text-black font-medium mb-1 block">Phone *</label>
                    <input
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="0555 123 456"
                      className="w-full border border-black/20 px-3 py-2 text-sm focus:outline-none focus:border-black text-black bg-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-black font-medium mb-1 block">Email *</label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="fatima@domain.com"
                      className="w-full border border-black/20 px-3 py-2 text-sm focus:outline-none focus:border-black text-black bg-white"
                    />
                  </div>
                </div>
              </section>

              {/* Products */}
              <section>
                <h3 className="text-xs uppercase tracking-widest text-black font-semibold mb-3">Products</h3>

                {/* Search & Category Filter */}
                <div className="flex gap-2 mb-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40" />
                    <input
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Search by name..."
                      className="w-full border border-black/20 pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-black text-black bg-white"
                    />
                  </div>
                  <select
                    value={selectedFilterCategory}
                    onChange={(e) => setSelectedFilterCategory(e.target.value)}
                    className="border border-black/20 px-3 py-2 text-sm focus:outline-none focus:border-black text-black bg-white min-w-[150px]"
                  >
                    <option value="">All categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Products Dropdown List */}
                <div className="border border-black/20 max-h-64 overflow-y-auto divide-y divide-black/10 bg-white mb-4 shadow-sm">
                  {loadingPickerData ? (
                    <p className="p-4 text-xs text-black/50 text-center font-medium flex items-center justify-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading products…
                    </p>
                  ) : filteredProducts.length === 0 ? (
                    <p className="p-4 text-xs text-black/50 text-center font-medium">No product found</p>
                  ) : (
                    filteredProducts.map((p) => {
                      const vInfo = getSelectedVariantInfo(p);
                      return (
                        <div
                          key={p.id}
                          className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3 py-3 hover:bg-gray-50 transition-colors"
                        >
                          {/* Product Details (Image, Title, Price, Stock) */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {vInfo.image ? (
                              <img
                                src={vInfo.image}
                                alt=""
                                className="w-10 h-12 object-cover flex-shrink-0 border border-black/10"
                              />
                            ) : (
                              <div className="w-10 h-12 bg-gray-100 flex items-center justify-center text-black/40 text-[10px] uppercase font-semibold">
                                No Px
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-black font-semibold truncate">{p.title}</p>
                              <p className="text-xs text-black/60">
                                {formatPrice(vInfo.price)} · Variant stock: <span className="font-semibold text-black">{vInfo.stock}</span>
                              </p>
                            </div>
                          </div>

                          {/* Inline variant options dropdown & add button */}
                          <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                            {/* Colors Select */}
                            {vInfo.colors.length > 0 && (
                              <div className="flex flex-col">
                                <span className="text-[9px] uppercase tracking-wider text-black/40 font-semibold mb-0.5">Color</span>
                                <select
                                  value={vInfo.color || ""}
                                  onChange={(e) => {
                                    const newColor = e.target.value;
                                    // Get the first size available for the selected color
                                    const nextSizes = Array.from(
                                      new Set(
                                        p.variants!
                                          .filter((v) => v.color === newColor)
                                          .map((v) => v.size)
                                          .filter(Boolean)
                                      )
                                    ) as string[];
                                    setSelectedVariants((prev) => ({
                                      ...prev,
                                      [p.id]: {
                                        color: newColor,
                                        size: nextSizes[0] || "",
                                      },
                                    }));
                                  }}
                                  className="border border-black/20 px-2 py-1 text-xs text-black bg-white focus:outline-none focus:border-black font-medium min-w-[75px]"
                                >
                                  {vInfo.colors.map((c) => (
                                    <option key={c} value={c}>
                                      {c}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {/* Sizes Select (Filtered by active color selection) */}
                            {vInfo.sizes.length > 0 && (
                              <div className="flex flex-col">
                                <span className="text-[9px] uppercase tracking-wider text-black/40 font-semibold mb-0.5">Size</span>
                                <select
                                  value={vInfo.size || ""}
                                  onChange={(e) =>
                                    setSelectedVariants((prev) => ({
                                      ...prev,
                                      [p.id]: { ...(prev[p.id] || {}), size: e.target.value },
                                    }))
                                  }
                                  className="border border-black/20 px-2 py-1 text-xs text-black bg-white focus:outline-none focus:border-black font-medium min-w-[65px]"
                                >
                                  {vInfo.sizes.map((s) => (
                                    <option key={s} value={s}>
                                      {s}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => addItemWithVariant(p, vInfo)}
                              className="inline-flex items-center justify-center p-2 bg-black hover:bg-gray-800 text-white rounded transition-colors mt-4 self-end"
                              title="Add this variant"
                              disabled={vInfo.stock <= 0}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Items list */}
                {items.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] uppercase tracking-wider text-black/60 font-semibold">Shopping cart</h4>
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 border border-black/10 p-3 bg-gray-50">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt=""
                            className="w-10 h-12 object-cover flex-shrink-0 border border-black/10"
                          />
                        ) : (
                          <div className="w-10 h-12 bg-gray-200 flex items-center justify-center text-black/40 text-[9px] uppercase font-semibold">
                            No Px
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-black font-semibold truncate">{item.title}</p>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {item.size && (
                              <span className="text-[9px] bg-black/5 text-black px-1.5 py-0.5 font-medium rounded-sm">
                                S: {item.size}
                              </span>
                            )}
                            {item.color && (
                              <span className="text-[9px] bg-black/5 text-black px-1.5 py-0.5 font-medium rounded-sm">
                                C: {item.color}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-black/60 mt-1">Base price: {formatPrice(item.basePrice)}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div>
                            <label className="text-[10px] text-black font-medium block text-center">Price</label>
                            <input
                              value={item.priceOverride}
                              onChange={(e) => updateItem(item.id, "priceOverride", e.target.value)}
                              placeholder={String(item.basePrice)}
                              className="w-20 border border-black/20 px-2 py-1 text-xs text-center focus:outline-none focus:border-black text-black bg-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-black font-medium block text-center">Qty</label>
                            <input
                              type="number"
                              min={1}
                              max={item.stock}
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(
                                  item.id,
                                  "quantity",
                                  Math.max(1, Math.min(item.stock, parseInt(e.target.value) || 1))
                                )
                              }
                              className="w-14 border border-black/20 px-2 py-1 text-xs text-center focus:outline-none focus:border-black text-black bg-white"
                            />
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors mt-3"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Delivery */}
              <section>
                <h3 className="text-xs uppercase tracking-widest text-black font-semibold mb-3">Delivery</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs text-black font-medium mb-1 block">Wilaya *</label>
                    <select
                      value={wilayaCode}
                      onChange={(e) => setWilayaCode(e.target.value)}
                      className="w-full border border-black/20 px-3 py-2 text-sm focus:outline-none focus:border-black text-black bg-white"
                    >
                      <option value="">Select a wilaya...</option>
                      {WILAYAS.map((w) => (
                        <option key={w.code} value={w.code}>
                          {w.code} — {w.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="text-xs text-black font-medium mb-2 block">Delivery type</label>
                    <div className="flex gap-2">
                      {(["DOMICILE", "STOPDESK"] as const).map((t) => {
                        const rate = t === "DOMICILE" ? selectedWilaya?.domicile : selectedWilaya?.stopdesk;
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setDeliveryType(t)}
                            className={`flex-1 py-2 text-xs uppercase tracking-widest border transition-colors ${
                              deliveryType === t
                                ? "bg-black text-white border-black"
                                : "border-black/20 text-black hover:border-black"
                            }`}
                          >
                            {t === "DOMICILE" ? "Home" : "Stop Desk"}
                            {selectedWilaya && (
                              <span className="ml-1 normal-case tracking-normal">
                                ({rate === 0 ? "Not available" : formatPrice(rate!)})
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {deliveryType === "DOMICILE" && (
                    <>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="text-xs text-black font-medium mb-1 block">Street / Address</label>
                        <input
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                          placeholder="Rue Ibn Khaldoun"
                          className="w-full border border-black/20 px-3 py-2 text-sm focus:outline-none focus:border-black text-black bg-white"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="text-xs text-black font-medium mb-1 block">City</label>
                        <input
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Centre-ville"
                          className="w-full border border-black/20 px-3 py-2 text-sm focus:outline-none focus:border-black text-black bg-white"
                        />
                      </div>
                    </>
                  )}
                </div>
              </section>

              {/* Payment */}
              <section>
                <h3 className="text-xs uppercase tracking-widest text-black font-semibold mb-3">Payment</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-black font-medium mb-1 block">Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
                      className="w-full border border-black/20 px-3 py-2 text-sm focus:outline-none focus:border-black text-black bg-white"
                    >
                      <option value="cod">Cash on delivery</option>
                      <option value="virement">Bank transfer</option>
                      <option value="autre">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-black font-medium mb-1 block">Payment status</label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value as typeof paymentStatus)}
                      className="w-full border border-black/20 px-3 py-2 text-sm focus:outline-none focus:border-black text-black bg-white"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="PAID">Paid</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-black font-medium mb-1 block">Order status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as typeof status)}
                      className="w-full border border-black/20 px-3 py-2 text-sm focus:outline-none focus:border-black text-black bg-white"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="PROCESSING">Processing</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-black font-medium mb-1 block">Discount (DA)</label>
                    <input
                      type="number"
                      min="0"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      className="w-full border border-black/20 px-3 py-2 text-sm focus:outline-none focus:border-black text-black bg-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-black font-medium mb-1 block">Internal notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      placeholder="Notes, special instructions..."
                      className="w-full border border-black/20 px-3 py-2 text-sm focus:outline-none focus:border-black text-black bg-white resize-none"
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* Footer: summary + submit */}
            <div className="border-t border-black/10 px-6 py-4 space-y-3 bg-white">
              {items.length > 0 && (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between text-black/75">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-black/75">
                    <span>Delivery</span>
                    <span>{formatPrice(shippingFee)}</span>
                  </div>
                  {discountNum > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Discount</span>
                      <span>-{formatPrice(discountNum)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-black pt-1 border-t border-black/10">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
              )}

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2">{error}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 py-2.5 text-xs uppercase tracking-widest border border-black/20 text-black hover:border-black transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || isPending}
                  className="flex-1 py-2.5 text-xs uppercase tracking-widest bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {(submitting || isPending) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
