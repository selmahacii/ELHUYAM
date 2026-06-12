"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!data.success) { toast.error(data.error ?? "Failed to subscribe"); return; }
      setSubscribed(true);
      setEmail("");
      toast.success(data.data?.message ?? "Subscribed!");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (subscribed) {
    return (
      <div className="text-sm text-brand-200 border border-brand-700 px-5 py-3">
        ✓ Welcome to the House of Huyaam
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full md:w-auto gap-0">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email address"
        required
        className="flex-1 md:w-72 bg-brand-800 border border-brand-700 text-white placeholder-brand-500 px-4 py-3 text-sm focus:outline-none focus:border-brand-500 transition-colors"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-brand-200 text-brand-900 px-6 py-3 text-xs uppercase tracking-widest font-medium hover:bg-white transition-colors whitespace-nowrap disabled:opacity-70"
      >
        {loading ? "..." : "Subscribe"}
      </button>
    </form>
  );
}
