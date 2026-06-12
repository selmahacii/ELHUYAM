"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  title: string;
  slug: string;
  price: number;
  discountPrice?: number | null;
  images: string[];
  category: { name: string };
}

export default function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(q)}&limit=6`);
      const data = await res.json();
      setResults(data.data ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 300);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-warm-white shadow-2xl animate-slide-up">
        <div className="flex items-center border-b border-brand-100 px-4">
          <Search className="w-5 h-5 text-brand-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            placeholder="Search for abayas, hijabs, accessories..."
            className="flex-1 px-4 py-5 text-base bg-transparent outline-none placeholder-brand-300 text-brand-900"
          />
          <button onClick={onClose} className="p-2 text-brand-400 hover:text-brand-900 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {query.length >= 2 && (
          <div className="max-h-[60vh] overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-brand-200 border-t-brand-700 rounded-full animate-spin" />
              </div>
            )}

            {!loading && results.length === 0 && (
              <div className="py-12 text-center text-brand-400 text-sm">
                No results found for &ldquo;{query}&rdquo;
              </div>
            )}

            {!loading && results.length > 0 && (
              <div>
                {results.map((product) => (
                  <Link
                    key={product.id}
                    href={`/shop/${product.slug}`}
                    onClick={onClose}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-brand-50 transition-colors border-b border-brand-50 last:border-0"
                  >
                    <div className="w-14 h-14 bg-brand-100 shrink-0 relative overflow-hidden">
                      {product.images[0] && (
                        <Image src={product.images[0]} alt={product.title} fill className="object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-brand-900 truncate">{product.title}</p>
                      <p className="text-xs text-brand-400 uppercase tracking-wider">{product.category.name}</p>
                    </div>
                    <div className="text-sm font-semibold text-brand-900 shrink-0">
                      {formatPrice(product.discountPrice ?? product.price)}
                    </div>
                  </Link>
                ))}

                <Link
                  href={`/shop?search=${encodeURIComponent(query)}`}
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 py-4 text-xs uppercase tracking-widest text-brand-700 hover:text-brand-900 transition-colors font-medium"
                >
                  View all results <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        )}

        {query.length < 2 && (
          <div className="p-6">
            <p className="text-xs uppercase tracking-widest text-brand-400 mb-4">Popular Searches</p>
            <div className="flex flex-wrap gap-2">
              {["Abaya", "Khimar", "Hijab", "Niqab", "Gloves", "Modest Sets"].map((term) => (
                <button
                  key={term}
                  onClick={() => { setQuery(term); search(term); }}
                  className="px-4 py-2 border border-brand-200 text-xs uppercase tracking-widest text-brand-700 hover:bg-brand-50 transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
