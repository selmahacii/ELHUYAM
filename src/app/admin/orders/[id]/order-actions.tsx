"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { AlertTriangle, Truck } from "lucide-react";
import EditOrderDialog from "./edit-order-dialog";

const ORDER_STATUSES = [
  { value: "PENDING",          label: "Pending" },
  { value: "CONFIRMED",        label: "Confirmed" },
  { value: "PROCESSING",       label: "Processing" },
  { value: "SHIPPED",          label: "Shipped" },
  { value: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { value: "DELIVERED",        label: "Delivered" },
  { value: "CANCELLED",        label: "Cancelled" },
  { value: "REFUNDED",         label: "Refunded" },
];

const ALL_PAYMENT_STATUSES = [
  { value: "PENDING",  label: "Pending" },
  { value: "PAID",     label: "Paid" },
  { value: "FAILED",   label: "Failed" },
  { value: "REFUNDED", label: "Refunded" },
];

const DESTRUCTIVE_STATUSES = ["CANCELLED", "REFUNDED"];

interface Order {
  id: string;
  status: string;
  paymentStatus: string;
  trackingNumber?: string | null;
  carrier?: string | null;
}

export default function OrderActions({ order, role }: { order: Order; role?: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(order.status);
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
  const [tracking, setTracking] = useState(order.trackingNumber ?? "");
  const [carrier, setCarrier] = useState(order.carrier ?? "ZR_EXPRESS");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [transmitting, setTransmitting] = useState(false);

  const paymentStatuses = role === "CONFIRMATRICE" && paymentStatus !== "PAID"
    ? ALL_PAYMENT_STATUSES.filter((s) => s.value !== "PAID")
    : ALL_PAYMENT_STATUSES;

  function handleStatusChange(newStatus: string) {
    if (DESTRUCTIVE_STATUSES.includes(newStatus) && !DESTRUCTIVE_STATUSES.includes(order.status)) {
      setPendingStatus(newStatus);
    } else {
      setStatus(newStatus);
      if (newStatus === "DELIVERED") {
        setPaymentStatus("PAID");
      }
    }
  }

  function confirmDestructive() {
    if (pendingStatus) {
      setStatus(pendingStatus);
      setPendingStatus(null);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          paymentStatus,
          trackingNumber: tracking || null,
          carrier: carrier || null,
          note: note || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) { toast.error(data.error ?? "Failed to update"); return; }
      toast.success("Order updated successfully");
      setNote("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleTransmitZR() {
    setTransmitting(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/ship-zr`, {
        method: "POST",
      });
      const data = await res.json();
      if (!data.success) {
        const errMsg = typeof data.error === "string" ? data.error : (data.error ? JSON.stringify(data.error) : "Transmission failed");
        toast.error(errMsg, { duration: 6000 });
        return;
      }
      toast.success(data.message ?? "Package successfully created!");
      setTracking(data.trackingNumber);
      setStatus("CONFIRMED");
      router.refresh();
    } catch {
      toast.error("Connection error");
    } finally {
      setTransmitting(false);
    }
  }

  const hasChanges =
    status !== order.status ||
    paymentStatus !== order.paymentStatus ||
    tracking !== (order.trackingNumber ?? "") ||
    carrier !== (order.carrier ?? "") ||
    note.length > 0;

  return (
    <>
      {/* Destructive action confirmation dialog */}
      {pendingStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white border border-black/10 p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-display text-base text-black font-semibold mb-1">
                  Confirm {pendingStatus === "CANCELLED" ? "Cancellation" : "Refund"}
                </h4>
                <p className="text-sm text-gray-500">
                  {pendingStatus === "CANCELLED"
                    ? "This will cancel the order. This action is difficult to reverse and may need to trigger a stock restock manually."
                    : "Marking as refunded does not process the refund automatically. Ensure the refund is handled in your payment processor."}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="destructive"
                size="sm"
                className="flex-1"
                onClick={confirmDestructive}
              >
                Yes, {pendingStatus === "CANCELLED" ? "Cancel Order" : "Mark Refunded"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-black/20 text-black hover:border-black"
                onClick={() => setPendingStatus(null)}
              >
                Go Back
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-black/10 p-5 space-y-4">
        <h3 className="font-display text-base text-black font-semibold border-b border-black/10 pb-3 flex items-center justify-between">
          Update Order
        </h3>

        {/* Full Order & Cart Edit Dialog */}
        <EditOrderDialog order={order} />

        {/* Order status */}
        <div>
          <label className="block text-xs uppercase tracking-widest text-black mb-2 font-medium">
            Order Status
          </label>
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full border border-black/20 px-3 py-2 text-sm bg-white text-black focus:outline-none focus:border-black transition-colors disabled:opacity-75"
          >
            {(!!tracking && carrier === "ZR_EXPRESS"
              ? [
                  ORDER_STATUSES.find((s) => s.value === status) || { value: status, label: status },
                  ...(status !== "CANCELLED" ? [ORDER_STATUSES.find((s) => s.value === "CANCELLED")].filter(Boolean) : [])
                ]
              : ORDER_STATUSES
            ).map((s: any) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          {DESTRUCTIVE_STATUSES.includes(status) && (
            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> This is a destructive status
            </p>
          )}
        </div>

        {/* Payment status */}
        <div>
          <label className="block text-xs uppercase tracking-widest text-black mb-2 font-medium">
            Payment Status
          </label>
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="w-full border border-black/20 px-3 py-2 text-sm bg-white text-black focus:outline-none focus:border-black transition-colors"
          >
            {paymentStatuses.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Tracking info — shown when shipping-related */}
        {["CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(status) && (
          <div className="space-y-3 border-t border-black/10 pt-3">
            <p className="text-xs text-black uppercase tracking-widest font-semibold">Delivery & Tracking</p>
            <div>
              <label className="block text-xs uppercase tracking-widest text-black/60 mb-2 font-medium">Carrier</label>
              <select
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="w-full border border-black/20 px-3 py-2 text-sm bg-white text-black focus:outline-none focus:border-black transition-colors"
                disabled={carrier === "ZR_EXPRESS" && !!tracking}
              >
                <option value="ZR_EXPRESS">ZR Express</option>
              </select>
            </div>
            <Input
              label={carrier === "ZR_EXPRESS" ? "ZR Express tracking number" : "Tracking number"}
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              placeholder={carrier === "ZR_EXPRESS" ? "e.g., ZR-2024-XXXXXX" : "Tracking number..."}
              className="border-black/20 focus:border-black text-black bg-white"
              disabled={carrier === "ZR_EXPRESS" && !!tracking}
            />
            {carrier === "ZR_EXPRESS" && tracking && (
              <p className="text-[10px] text-emerald-600 flex items-center gap-1">
                ✦ Real-time ZR Express tracking will be displayed on this page after saving.
              </p>
            )}
          </div>
        )}

        {/* Internal note */}
        <div>
          <label className="block text-xs uppercase tracking-widest text-black mb-2 font-medium">
            Internal Note <span className="normal-case text-black/60 font-normal">(optional — added to timeline)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="e.g. Customer requested express handling..."
            className="w-full border border-black/20 px-3 py-2 text-sm focus:outline-none focus:border-black text-black bg-white resize-none transition-colors"
          />
        </div>

        {carrier === "ZR_EXPRESS" && !tracking && (
          <Button
            type="button"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 py-2 px-4 shadow-sm border border-emerald-500 hover:border-emerald-600 transition-all font-medium text-sm"
            onClick={handleTransmitZR}
            loading={transmitting}
          >
            <Truck className="w-4 h-4 animate-bounce" />
            Transmit to ZR Express
          </Button>
        )}

        <Button
          className="w-full bg-black hover:bg-gray-800 text-white transition-colors"
          onClick={handleSave}
          loading={saving}
          disabled={!hasChanges}
        >
          {hasChanges ? "Save Changes" : "No Changes"}
        </Button>

        {hasChanges && (
          <div className="text-xs text-center text-black space-y-1">
            <p>
              Status will change: <strong className="text-black">{order.status}</strong> → <strong className="text-black font-semibold">{status}</strong>
            </p>
            {status === "DELIVERED" && order.paymentStatus !== "PAID" && (
              <p className="text-emerald-600 font-semibold flex items-center justify-center gap-1">
                ✦ Auto-settle: Payment Status → Paid (Boosts Dashboard Revenue!)
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
