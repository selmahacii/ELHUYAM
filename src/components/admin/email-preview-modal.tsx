"use client";

import React, { useState } from "react";
import { Mail, Check, Copy, X, Truck, FileCheck } from "lucide-react";
import { toast } from "react-hot-toast";

interface EmailPreviewItem {
  productTitle: string;
  quantity: number;
  price: number;
  size?: string | null;
  color?: string | null;
}

export interface EmailPreviewOrder {
  id: string;
  orderNumber: string;
  totalAmount: number;
  isInternational?: boolean;
  trackingNumber?: string | null;
  shippingFirstName?: string | null;
  shippingLastName?: string | null;
  shippingPhone?: string | null;
  user?: {
    email?: string | null;
    name?: string | null;
  } | null;
  items: EmailPreviewItem[];
}

interface EmailPreviewModalProps {
  order: EmailPreviewOrder;
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "confirmation" | "shipped";
}

export default function EmailPreviewModal({
  order,
  isOpen,
  onClose,
  defaultTab = "confirmation",
}: EmailPreviewModalProps) {
  const [activeTab, setActiveTab] = useState<"confirmation" | "shipped">(defaultTab);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const customerName =
    `${order.shippingFirstName ?? ""} ${order.shippingLastName ?? ""}`.trim() ||
    order.user?.name ||
    "Customer";

  const customerEmail = order.user?.email || "Not specified";
  const currency = order.isInternational ? "EUR" : "DZD";
  const locale = order.isInternational ? "fr-FR" : "fr-DZ";

  const formattedTotal = new Intl.NumberFormat(locale === "fr-FR" ? "en-US" : "fr-DZ", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  })
    .format(order.totalAmount)
    .replace(/[\u00a0\u202f]/g, " ");

  const trackingToUse = order.trackingNumber || "ZR-XXXXXXXXXX";

  const itemsHtml = order.items
    .map((item) => {
      const formattedPrice = new Intl.NumberFormat(locale === "fr-FR" ? "en-US" : "fr-DZ", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 2,
      })
        .format(item.price ?? 0)
        .replace(/[\u00a0\u202f]/g, " ");

      const variantDetails = [item.color, item.size].filter(Boolean).join(" • ");

      return `
        <tr>
          <td style="padding: 16px 0; border-bottom: 1px solid #EBE4D8; vertical-align: middle;">
            <div style="font-family: Georgia, serif; font-size: 14.5px; font-weight: bold; color: #141414;">${item.productTitle}</div>
            ${variantDetails ? `<div style="display: inline-block; font-size: 11px; color: #7A5C38; background: #FAF5EE; border: 1px solid #EADBCE; padding: 2px 8px; border-radius: 4px; margin-top: 5px; font-weight: 500;">${variantDetails}</div>` : ""}
          </td>
          <td align="center" style="padding: 16px 0; border-bottom: 1px solid #EBE4D8; vertical-align: middle;">
            <span style="font-family: -apple-system, sans-serif; font-weight: 700; font-size: 12px; background: #F3EFE9; color: #3D2F24; padding: 4px 10px; border-radius: 20px;">x${item.quantity}</span>
          </td>
          <td align="right" style="padding: 16px 0; border-bottom: 1px solid #EBE4D8; vertical-align: middle; font-family: -apple-system, sans-serif; font-size: 14px; font-weight: 700; color: #141414;">
            ${formattedPrice}
          </td>
        </tr>
      `;
    })
    .join("");

  const confirmationHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F7F5F0; padding: 30px 10px;">
      <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #EBE4D8; overflow: hidden; box-shadow: 0 4px 25px rgba(0,0,0,0.04);">
        
        <!-- Top Ribbon -->
        <div style="background: linear-gradient(90deg, #141414 0%, #C5A880 50%, #141414 100%); height: 5px;"></div>

        <!-- Header -->
        <div style="padding: 35px 30px 15px 30px; text-align: center;">
          <h1 style="font-family: Georgia, 'Playfair Display', serif; font-size: 30px; letter-spacing: 6px; color: #141414; text-transform: uppercase; margin: 0; font-weight: 700;">EL HUYAAM</h1>
          <p style="font-size: 10px; letter-spacing: 3.5px; color: #9A7A52; text-transform: uppercase; margin: 6px 0 0 0; font-weight: 600;">MODEST HAUTE COUTURE</p>
          <div style="margin: 16px auto 0 auto; color: #C5A880; font-size: 13px;">✦ ✦ ✦</div>
        </div>

        <!-- Greeting -->
        <div style="padding: 15px 35px 25px 35px; text-align: center;">
          <div style="display: inline-block; background: #FAF5EE; border: 1px solid #E3D5C1; color: #8A6538; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; padding: 6px 16px; border-radius: 20px; margin-bottom: 18px;">
            ✦ ORDER CONFIRMED & DISPATCHED ✦
          </div>
          <h2 style="font-family: Georgia, serif; color: #2B2118; font-size: 22px; margin: 0 0 12px 0; font-weight: normal;">Dear ${customerName},</h2>
          <p style="color: #6B5744; font-size: 14px; line-height: 1.8; margin: 0;">
            We are delighted to confirm that your order <strong>#${order.orderNumber}</strong> has been officially confirmed and handed over to our delivery partner (<strong>ZR Express</strong>). Your bespoke pieces are now on their way to you with the utmost care and refinement.
          </p>
        </div>

        <!-- Order Ref Card -->
        <div style="padding: 0 35px 20px 35px;">
          <div style="background: #FDFBF7; border: 1px dashed #E2D3BE; border-radius: 12px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 11px; color: #8C7355; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">
              ORDER NUMBER: <span style="font-family: monospace; font-size: 13.5px; color: #141414; font-weight: bold;">#${order.orderNumber}</span>
            </div>
            <div style="font-size: 11px; color: #236E39; font-weight: 700; text-transform: uppercase;">
              ✓ HANDED OVER TO COURIER
            </div>
          </div>
        </div>

        <!-- Items Table -->
        <div style="padding: 0 35px 20px 35px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
            <thead>
              <tr>
                <th align="left" style="padding: 10px 0; border-bottom: 2px solid #141414; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: #141414; text-transform: uppercase;">CREATION</th>
                <th align="center" style="padding: 10px 0; border-bottom: 2px solid #141414; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: #141414; text-transform: uppercase;">QTY</th>
                <th align="right" style="padding: 10px 0; border-bottom: 2px solid #141414; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: #141414; text-transform: uppercase;">PRICE</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>

        <!-- Total Box -->
        <div style="padding: 0 35px 25px 35px;">
          <div style="background: #FAF7F2; border: 1px solid #E8D5B7; border-radius: 12px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-family: Georgia, serif; font-size: 13.5px; font-weight: bold; color: #4A3520; text-transform: uppercase; letter-spacing: 1.5px;">
              TOTAL AMOUNT
            </div>
            <div style="font-size: 18px; font-weight: 800; color: #141414;">
              ${formattedTotal}
            </div>
          </div>
        </div>

        <!-- CTAs -->
        <div style="padding: 0 35px 30px 35px; text-align: center;">
          <a href="https://www.elhuyam.com/orders/track?orderNumber=${order.orderNumber}"
             style="display: block; width: 85%; max-width: 360px; margin: 0 auto 10px auto; padding: 14px 0; background: #141414; color: #FAF9F6; text-decoration: none; letter-spacing: 2px; font-size: 11.5px; font-weight: bold; text-transform: uppercase; border-radius: 6px; text-align: center;">
            TRACK YOUR ORDER LIVE →
          </a>
          <a href="https://wa.me/213772515448"
             style="display: inline-block; padding: 9px 20px; background: #25D366; color: #FFFFFF; text-decoration: none; font-size: 11px; font-weight: 700; border-radius: 6px; text-align: center;">
            💬 WhatsApp: +213 772 51 54 48
          </a>
        </div>

        <!-- Reassurance -->
        <div style="background-color: #FDFBF7; border-top: 1px solid #EBE4D8; border-bottom: 1px solid #EBE4D8; padding: 18px 20px; display: flex; justify-content: space-around; text-align: center;">
          <div style="font-size: 10px; font-weight: 700; color: #3D2F24;">✦ Bespoke Tailoring</div>
          <div style="font-size: 10px; font-weight: 700; color: #3D2F24;">🚚 58 Wilayas & World</div>
          <div style="font-size: 10px; font-weight: 700; color: #3D2F24;">🤍 Dedicated Support</div>
        </div>

        <!-- Footer -->
        <div style="background-color: #FAF9F6; padding: 25px 30px; text-align: center;">
          <p style="font-family: Georgia, serif; font-style: italic; color: #7A5C38; font-size: 13px; margin: 0 0 8px 0;">
            « Grace and elegance in modesty. »
          </p>
          <p style="color: #A39281; font-size: 10.5px; margin: 0;">
            © ${new Date().getFullYear()} EL HUYAAM. All rights reserved.
          </p>
        </div>

      </div>
    </div>
  `;

  const shippedHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F7F5F0; padding: 30px 10px;">
      <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #EBE4D8; overflow: hidden; box-shadow: 0 4px 25px rgba(0,0,0,0.04);">
        
        <!-- Top Ribbon -->
        <div style="background: linear-gradient(90deg, #141414 0%, #C5A880 50%, #141414 100%); height: 5px;"></div>

        <!-- Header -->
        <div style="padding: 35px 30px 15px 30px; text-align: center;">
          <h1 style="font-family: Georgia, 'Playfair Display', serif; font-size: 30px; letter-spacing: 6px; color: #141414; text-transform: uppercase; margin: 0; font-weight: 700;">EL HUYAAM</h1>
          <p style="font-size: 10px; letter-spacing: 3.5px; color: #9A7A52; text-transform: uppercase; margin: 6px 0 0 0; font-weight: 600;">MODEST HAUTE COUTURE</p>
          <div style="margin: 16px auto 0 auto; color: #C5A880; font-size: 13px;">✦ ✦ ✦</div>
        </div>

        <!-- Status -->
        <div style="padding: 15px 35px 20px 35px; text-align: center;">
          <div style="display: inline-block; background: #EEF8F1; border: 1px solid #C4E8CD; color: #236E39; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; padding: 6px 16px; border-radius: 20px; margin-bottom: 18px;">
            🚚 PARCEL DISPATCHED & IN TRANSIT
          </div>
          <h2 style="font-family: Georgia, serif; color: #2B2118; font-size: 22px; margin: 0 0 12px 0; font-weight: normal;">Dear ${customerName},</h2>
          <p style="color: #6B5744; font-size: 14px; line-height: 1.8; margin: 0;">
            Wonderful news! Your order has been carefully packaged and handed over to our trusted courier partner (<strong>ZR Express</strong>). It is now actively in transit to your delivery address.
          </p>
        </div>

        <!-- Tracking Highlight Box -->
        <div style="padding: 0 35px 25px 35px;">
          <div style="background: #FAF7F2; border: 1.5px dashed #C5A880; border-radius: 12px; padding: 18px 20px; text-align: center;">
            <p style="font-size: 10.5px; color: #8A6538; text-transform: uppercase; font-weight: 800; letter-spacing: 2px; margin: 0 0 5px 0;">
              OFFICIAL TRACKING NUMBER
            </p>
            <p style="font-family: monospace; font-size: 19px; font-weight: 800; color: #141414; letter-spacing: 2px; margin: 0 0 6px 0;">
              ${trackingToUse}
            </p>
            <p style="font-size: 11px; color: #7A5C38; margin: 0;">
              Courier: <strong>ZR Express</strong> • Doorstep & Stopdesk Express Delivery
            </p>
          </div>
        </div>

        <!-- Items Table -->
        <div style="padding: 0 35px 20px 35px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
            <thead>
              <tr>
                <th align="left" style="padding: 10px 0; border-bottom: 2px solid #141414; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: #141414; text-transform: uppercase;">CREATION</th>
                <th align="center" style="padding: 10px 0; border-bottom: 2px solid #141414; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: #141414; text-transform: uppercase;">QTY</th>
                <th align="right" style="padding: 10px 0; border-bottom: 2px solid #141414; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: #141414; text-transform: uppercase;">PRICE</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>

        <!-- Total Box -->
        <div style="padding: 0 35px 25px 35px;">
          <div style="background: #FAF7F2; border: 1px solid #E8D5B7; border-radius: 12px; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-family: Georgia, serif; font-size: 13px; font-weight: bold; color: #4A3520; text-transform: uppercase; letter-spacing: 1px;">
              TOTAL AMOUNT DUE
            </div>
            <div style="font-size: 17px; font-weight: 800; color: #141414;">
              ${formattedTotal}
            </div>
          </div>
        </div>

        <!-- CTAs -->
        <div style="padding: 0 35px 30px 35px; text-align: center;">
          <a href="https://www.elhuyam.com/orders/track?orderNumber=${order.orderNumber}&phone=${trackingToUse}"
             style="display: block; width: 85%; max-width: 360px; margin: 0 auto 10px auto; padding: 14px 0; background: #141414; color: #FAF9F6; text-decoration: none; letter-spacing: 2px; font-size: 11.5px; font-weight: bold; text-transform: uppercase; border-radius: 6px; text-align: center;">
            TRACK YOUR SHIPMENT LIVE →
          </a>
          <a href="https://wa.me/213772515448"
             style="display: inline-block; padding: 9px 20px; background: #25D366; color: #FFFFFF; text-decoration: none; font-size: 11px; font-weight: 700; border-radius: 6px; text-align: center;">
            💬 WhatsApp: +213 772 51 54 48
          </a>
        </div>

        <!-- Footer -->
        <div style="background-color: #FAF9F6; padding: 25px 30px; text-align: center;">
          <p style="font-family: Georgia, serif; font-style: italic; color: #7A5C38; font-size: 13px; margin: 0 0 8px 0;">
            « Grace and elegance in modesty. »
          </p>
          <p style="color: #A39281; font-size: 10.5px; margin: 0;">
            © ${new Date().getFullYear()} EL HUYAAM. All rights reserved.
          </p>
        </div>

      </div>
    </div>
  `;

  const activeSubject =
    activeTab === "confirmation"
      ? `Order Confirmed & Dispatched #${order.orderNumber} ✦ EL HUYAAM`
      : `Your Parcel is on Its Way! 🚚 #${order.orderNumber} ✦ EL HUYAAM`;

  const currentHtml = activeTab === "confirmation" ? confirmationHtml : shippedHtml;

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(currentHtml);
    setCopied(true);
    toast.success("Email HTML code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 cursor-default text-left font-sans animate-in fade-in duration-150"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-800 shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
                Customer Email Preview (Haute Couture)
              </h3>
              <p className="text-xs text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                <span>Recipient:</span>
                <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                  {customerEmail}
                </span>
                <span className="text-slate-400">({customerName})</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors font-bold text-sm cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher & subject line bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex border border-slate-200 p-1 rounded-xl bg-white gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("confirmation")}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "confirmation"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>📋 Order Confirmed & Dispatched</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("shipped")}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "shipped"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>🚚 Parcel in Transit</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyHtml}
              className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? "Copied!" : "Copy HTML"}</span>
            </button>
          </div>
        </div>

        {/* Subject header preview */}
        <div className="px-6 py-2.5 bg-amber-50/40 border-b border-amber-100 flex items-center gap-2 text-xs shrink-0">
          <span className="font-bold text-amber-900 uppercase tracking-wider text-[10px]">Subject:</span>
          <span className="font-semibold text-slate-800 font-sans">{activeSubject}</span>
        </div>

        {/* Email Visual Preview Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-100/60">
          <div
            className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
            dangerouslySetInnerHTML={{ __html: currentHtml }}
          />
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>
            Sender: <strong className="text-slate-800 font-mono">EL HUYAAM &lt;elhuyamcollection09@gmail.com&gt;</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
