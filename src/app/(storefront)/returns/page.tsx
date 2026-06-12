import type { Metadata } from "next";
export const metadata: Metadata = { title: "Returns & Exchanges — EL HUYAM" };
export default function ReturnsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-12">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-400 mb-2">Policy</p>
        <h1 className="font-display text-4xl text-brand-900 mb-4">Returns & Exchanges</h1>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px w-12 bg-soft-gold" />
          <span className="text-soft-gold text-xs">✦</span>
        </div>
        <p className="text-brand-400 text-sm">We want you to love every piece. If you are not completely satisfied, we are here to help.</p>
      </div>
      <div className="space-y-8 text-brand-600 text-sm leading-relaxed">
        {[
          { title: "Return Policy", body: "You may return most items within 30 days of delivery for a full refund. Items must be:\n• Unworn and unwashed\n• In original packaging with tags attached\n• Free of perfume, deodorant, or any other odour\n• Unaltered and undamaged" },
          { title: "Non-Returnable Items", body: "• Sale items (unless defective)\n• Lingerie and accessories for hygiene reasons\n• Custom orders\n• Gift cards" },
          { title: "How to Initiate a Return", body: "1. Sign in to your account and go to your order history\n2. Select the order and click Request a Return\n3. Choose the items and reason for return\n4. Print the return label (free domestic returns)\n5. Drop off the package at a partner pickup point" },
          { title: "Exchanges", body: "To exchange for a different size or colour, initiate a return and place a new order. Exchanges are subject to stock availability. For assistance, contact our team at retours@elhuyaam.com." },
          { title: "Refunds", body: "Once your return is received and inspected, we will process your refund within 5-7 business days. Refunds are issued to the original payment method. Allow additional time for your bank to process the credit." },
        ].map(({ title, body }) => (
          <section key={title}>
            <h2 className="font-display text-xl text-brand-900 mb-3">{title}</h2>
            <p className="whitespace-pre-line">{body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
