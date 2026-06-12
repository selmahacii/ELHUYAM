"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, X } from "lucide-react";
import { toast } from "react-hot-toast";

export default function StockEditor({ productId, initialStock }: { productId: string; initialStock: number }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState(initialStock);
  const [value, setValue] = useState(String(initialStock));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const stock = Number(value);
    if (isNaN(stock) || stock < 0) { toast.error("Invalid value"); return; }
    if (stock === current) { setEditing(false); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Failed");
      setCurrent(stock);
      toast.success(`Stock → ${stock}`);
      router.refresh();
      setEditing(false);
    } catch {
      toast.error("Error updating stock");
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") { setEditing(false); setValue(String(current)); }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="number"
          min="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-16 border border-gray-400 px-1.5 py-0.5 text-sm text-gray-900 focus:outline-none focus:border-gray-700 text-center bg-white"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
          title="Save"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => { setEditing(false); setValue(String(current)); }}
          className="p-1 text-gray-400 hover:bg-gray-100 rounded transition-colors"
          title="Cancel"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 group/stock">
      <span className={
        current === 0 ? "font-medium text-red-500" :
        current <= 5 ? "font-medium text-amber-600" :
        "font-medium text-gray-700"
      }>
        {current}
      </span>
      <button
        onClick={() => { setValue(String(current)); setEditing(true); }}
        className="p-0.5 text-gray-300 hover:text-gray-600 transition-colors opacity-0 group-hover/stock:opacity-100"
        title="Edit stock"
      >
        <Pencil className="w-3 h-3" />
      </button>
    </div>
  );
}
