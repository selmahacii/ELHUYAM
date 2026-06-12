"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

interface Props {
  customer: { id: string; isBanned: boolean; name: string };
}

export default function CustomerActions({ customer }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showBanConfirm, setShowBanConfirm] = useState(false);
  const [banReason, setBanReason] = useState("");

  async function handleBanToggle() {
    if (!customer.isBanned && !showBanConfirm) {
      setShowBanConfirm(true);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBanned: !customer.isBanned, banReason: banReason || undefined }),
      });
      const data = await res.json();
      if (!data.success) { toast.error(data.error ?? "Failed"); return; }
      toast.success(customer.isBanned ? "Customer unbanned" : "Customer banned");
      setShowBanConfirm(false);
      setBanReason("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-3">
      {showBanConfirm && !customer.isBanned && (
        <div className="bg-white border border-red-200 p-4 space-y-3 w-72">
          <p className="text-sm text-brand-900 font-medium">Ban {customer.name}?</p>
          <textarea
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            placeholder="Reason (optional)..."
            rows={2}
            className="w-full border border-brand-200 px-3 py-2 text-sm focus:outline-none focus:border-brand-700 resize-none"
          />
          <div className="flex gap-2">
            <Button variant="destructive" className="flex-1 text-xs" onClick={handleBanToggle} loading={loading}>
              Confirm Ban
            </Button>
            <Button variant="outline" className="flex-1 text-xs" onClick={() => setShowBanConfirm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
      {(!showBanConfirm || customer.isBanned) && (
        <Button
          variant={customer.isBanned ? "outline" : "destructive"}
          onClick={handleBanToggle}
          loading={loading}
          className="text-xs"
        >
          {customer.isBanned ? "Unban Customer" : "Ban Customer"}
        </Button>
      )}
    </div>
  );
}
