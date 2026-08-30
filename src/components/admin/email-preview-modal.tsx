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
    "Chère cliente";

  const customerEmail = order.user?.email || "Non renseigné";
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
          <td style="padding: 12px 0; border-bottom: 1px solid #E8D5B7; color: #4A3520;">
            <div style="font-weight: 600; font-size: 14px;">${item.productTitle}</div>
            ${variantDetails ? `<div style="font-size: 12px; color: #8C7355; margin-top: 2px;">${variantDetails}</div>` : ""}
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #E8D5B7; color: #4A3520; text-align: center; font-weight: 600;">${item.quantity}</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #E8D5B7; color: #4A3520; text-align: right; font-weight: 600;">${formattedPrice}</td>
        </tr>
      `;
    })
    .join("");

  const confirmationHtml = `
    <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 600px; margin: 0 auto; background: #FAF9F6; padding: 40px; border: 1px solid #E8D5B7; font-size: 14px; color: #333333; line-height: 1.6;">
      <h1 style="font-size: 28px; letter-spacing: 4px; color: #1A1A1A; text-align: center; text-transform: uppercase; margin: 0 0 10px 0;">EL HUYAAM</h1>
      <hr style="border: none; border-top: 1px solid #E8D5B7; margin: 20px 0;" />
      <h2 style="color: #4A3520; text-align: center; font-size: 20px; margin: 0 0 15px 0;">Order Confirmed ✦</h2>
      <p style="color: #7A5C38; line-height: 1.8; text-align: center;">Dear ${customerName}, thank you for your order. We will begin preparing it with care.</p>
      
      <div style="background: rgba(232, 213, 183, 0.15); border: 1px dashed #E8D5B7; padding: 12px; margin: 20px 0; text-align: center; border-radius: 6px;">
        <p style="color: #9A7A52; font-size: 12px; letter-spacing: 2px; font-weight: bold; margin: 0; text-transform: uppercase;">
          ORDER: <span style="color: #1A1A1A; font-family: monospace; font-size: 14px;">${order.orderNumber}</span>
        </p>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="padding: 8px 0; border-bottom: 2px solid #1A1A1A; color: #1A1A1A; text-align: left; font-size: 12px; letter-spacing: 1px;">PRODUCT</th>
            <th style="padding: 8px 0; border-bottom: 2px solid #1A1A1A; color: #1A1A1A; text-align: center; font-size: 12px; letter-spacing: 1px;">QTY</th>
            <th style="padding: 8px 0; border-bottom: 2px solid #1A1A1A; color: #1A1A1A; text-align: right; font-size: 12px; letter-spacing: 1px;">PRICE</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding-top: 16px; font-weight: bold; color: #1A1A1A; font-size: 15px;">TOTAL AMOUNT</td>
            <td style="padding-top: 16px; font-weight: bold; color: #1A1A1A; text-align: right; font-size: 16px;">${formattedTotal}</td>
          </tr>
        </tfoot>
      </table>

      <div style="text-align: center; margin-top: 35px;">
        <a href="https://www.elhuyam.com/account/orders/${order.orderNumber}"
           style="display: inline-block; padding: 14px 32px; background: #1A1A1A; color: #FAF9F6;
                  text-decoration: none; letter-spacing: 2px; font-size: 13px; font-weight: bold; border-radius: 4px;">
          TRACK ORDER
        </a>
      </div>

      <p style="margin-top: 40px; color: #B8A99A; font-size: 12px; text-align: center;">
        Thank you for choosing EL HUYAAM.<br />
        © ${new Date().getFullYear()} EL HUYAM. All rights reserved.
      </p>
    </div>
  `;

  const shippedHtml = `
    <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 600px; margin: 0 auto; background: #FAF9F6; padding: 40px; border: 1px solid #E8D5B7; font-size: 14px; color: #333333; line-height: 1.6;">
      <h1 style="font-size: 28px; letter-spacing: 4px; color: #1A1A1A; text-align: center; text-transform: uppercase; margin: 0 0 10px 0;">EL HUYAAM</h1>
      <hr style="border: none; border-top: 1px solid #E8D5B7; margin: 20px 0;" />
      <h2 style="color: #4A3520; text-align: center; font-size: 22px; margin: 0 0 15px 0;">Your Order is with the Courier! 🚚</h2>
      <p style="color: #7A5C38; line-height: 1.8; text-align: center; font-size: 14px;">
        Dear ${customerName}, we are pleased to inform you that your package has been successfully handed over to the delivery company.
      </p>
      
      <div style="background: rgba(232, 213, 183, 0.18); border: 1px dashed #E8D5B7; padding: 16px; margin: 25px 0; text-align: center; border-radius: 6px;">
        <p style="color: #4A3520; font-size: 12px; font-weight: bold; text-transform: uppercase; margin: 0 0 6px 0; letter-spacing: 1px;">Tracking Number</p>
        <p style="color: #1A1A1A; font-family: monospace; font-size: 18px; font-weight: bold; margin: 0; letter-spacing: 1px;">${trackingToUse}</p>
      </div>

      <p style="color: #9A7A52; font-size: 13px; letter-spacing: 2px; font-weight: bold; margin-top: 30px; text-transform: uppercase;">ORDER SUMMARY: ${order.orderNumber}</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 15px; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="padding: 8px 0; border-bottom: 2px solid #1A1A1A; color: #1A1A1A; text-align: left; font-size: 12px; letter-spacing: 1px;">PRODUCT</th>
            <th style="padding: 8px 0; border-bottom: 2px solid #1A1A1A; color: #1A1A1A; text-align: center; font-size: 12px; letter-spacing: 1px;">QTY</th>
            <th style="padding: 8px 0; border-bottom: 2px solid #1A1A1A; color: #1A1A1A; text-align: right; font-size: 12px; letter-spacing: 1px;">PRICE</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding-top: 16px; font-weight: bold; color: #1A1A1A; font-size: 15px;">TOTAL AMOUNT</td>
            <td style="padding-top: 16px; font-weight: bold; color: #1A1A1A; text-align: right; font-size: 16px;">${formattedTotal}</td>
          </tr>
        </tfoot>
      </table>

      <div style="text-align: center; margin-top: 35px;">
        <a href="https://www.elhuyam.com/orders/track?orderNumber=${order.orderNumber}&phone=${trackingToUse}"
           style="display: inline-block; padding: 14px 32px; background: #1A1A1A; color: #FAF9F6;
                  text-decoration: none; letter-spacing: 2px; font-size: 13px; font-weight: bold; margin-bottom: 14px; border-radius: 4px;">
          TRACK YOUR SHIPMENT
        </a>
        <br />
        <a href="https://wa.me/213772515448"
           style="display: inline-block; padding: 12px 28px; background: #25D366; color: #FFFFFF;
                  text-decoration: none; letter-spacing: 1px; font-size: 13px; font-weight: bold; border-radius: 6px;">
          💬 CHAT ON WHATSAPP (+213 772 51 54 48)
        </a>
      </div>
      
      <p style="margin-top: 40px; color: #B8A99A; font-size: 12px; text-align: center;">
        Thank you for choosing elegance and modesty.<br />
        If you have any questions, reply directly to this email or contact us at <a href="mailto:elhuyamcollection09@gmail.com" style="color: #9A7A52; text-decoration: underline;">elhuyamcollection09@gmail.com</a>.
      </p>
    </div>
  `;

  const activeSubject =
    activeTab === "confirmation"
      ? `Order Confirmed — ${order.orderNumber}`
      : `Your order has been handed over to the shipping company — ${order.orderNumber}`;

  const currentHtml = activeTab === "confirmation" ? confirmationHtml : shippedHtml;

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(currentHtml);
    setCopied(true);
    toast.success("Code HTML de l'email copié !");
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
                Aperçu de l&apos;E-mail Client
              </h3>
              <p className="text-xs text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                <span>Destinataire :</span>
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
              <span>📋 Confirmation de Commande</span>
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
              <span>🚚 Expédition / Remise Colis</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyHtml}
              className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? "Copié !" : "Copier HTML"}</span>
            </button>
          </div>
        </div>

        {/* Subject header preview */}
        <div className="px-6 py-2.5 bg-amber-50/40 border-b border-amber-100 flex items-center gap-2 text-xs shrink-0">
          <span className="font-bold text-amber-900 uppercase tracking-wider text-[10px]">Objet :</span>
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
            Expéditeur automatique : <strong className="text-slate-800 font-mono">EL HUYAAM &lt;elhuyamcollection09@gmail.com&gt;</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            Fermer l&apos;aperçu
          </button>
        </div>
      </div>
    </div>
  );
}
