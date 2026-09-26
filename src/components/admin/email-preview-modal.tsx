"use client";

import React, { useState } from "react";
import { Mail, Check, Copy, X, Truck, FileCheck, Send, Loader2, Edit2 } from "lucide-react";
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
  subtotal?: number;
  shippingFee?: number;
  discount?: number;
  isInternational?: boolean;
  trackingNumber?: string | null;
  shippingFirstName?: string | null;
  shippingLastName?: string | null;
  shippingPhone?: string | null;
  shippingStreet?: string | null;
  shippingCity?: string | null;
  shippingState?: string | null;
  wilayaCode?: string | null;
  deliveryType?: string | null;
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

function formatMoney(amount: number, isInternational: boolean): string {
  const currency = isInternational ? "EUR" : "DZD";
  const locale = isInternational ? "fr-FR" : "fr-DZ";
  return new Intl.NumberFormat(locale === "fr-FR" ? "en-US" : "fr-DZ", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount).replace(/[\u00a0\u202f]/g, " ");
}

function formatOrderDate(date?: Date | string | null): { longDate: string; shortDate: string } {
  const d = date ? new Date(date) : new Date();
  const validDate = isNaN(d.getTime()) ? new Date() : d;

  const day = validDate.getDate();
  const monthsFr = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre"
  ];
  const monthName = monthsFr[validDate.getMonth()];
  const year = validDate.getFullYear();
  const longDate = `${day} ${monthName} ${year}`;

  const dd = String(day).padStart(2, "0");
  const mm = String(validDate.getMonth() + 1).padStart(2, "0");
  const shortDate = `${dd}/${mm}/${year}`;

  return { longDate, shortDate };
}

export default function EmailPreviewModal({
  order,
  isOpen,
  onClose,
  defaultTab = "confirmation",
}: EmailPreviewModalProps) {
  const [activeTab, setActiveTab] = useState<"confirmation" | "shipped">(defaultTab);
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState(order.user?.email || "");
  const [isEditingEmail, setIsEditingEmail] = useState(!order.user?.email);

  if (!isOpen) return null;

  const customerName =
    `${order.shippingFirstName ?? ""} ${order.shippingLastName ?? ""}`.trim() ||
    order.user?.name ||
    "Customer";

  const isInternational = !!order.isInternational;

  const itemsSum = order.items.reduce((acc, item) => acc + (Number(item.price || 0) * (Number(item.quantity) || 1)), 0);
  const resolvedSubtotal = (order.subtotal !== undefined && order.subtotal !== null && order.subtotal > 0) ? order.subtotal : itemsSum;

  let resolvedShippingFee = order.shippingFee ?? 0;
  if (!isInternational && (resolvedShippingFee === 0 && order.totalAmount > resolvedSubtotal)) {
    resolvedShippingFee = Math.max(0, Math.round((order.totalAmount - resolvedSubtotal + (order.discount || 0)) * 100) / 100);
  }

  const formattedSubtotal = formatMoney(resolvedSubtotal, isInternational);
  const formattedShippingFee = resolvedShippingFee > 0
    ? formatMoney(resolvedShippingFee, isInternational)
    : "Free Delivery (0,00 DA)";

  const formattedDiscount = (order.discount && order.discount > 0) ? formatMoney(order.discount, isInternational) : null;
  const formattedTotal = formatMoney(isInternational ? (resolvedSubtotal - (order.discount || 0)) : order.totalAmount, isInternational);

  const { longDate, shortDate } = formatOrderDate((order as any).createdAt);

  const trackingToUse = order.trackingNumber || "ZR-XXXXXXXXXX";

  const recipientPhone = order.shippingPhone?.trim();
  const wilaya = order.shippingState?.trim() || "";
  const wilayaCode = order.wilayaCode?.trim() || "";
  const commune = order.shippingCity?.trim() || "";
  const street = order.shippingStreet?.trim() || "";

  const itemsHtml = order.items
    .map((item) => {
      const linePrice = Number(item.price || 0) * (Number(item.quantity) || 1);
      const formattedPrice = formatMoney(linePrice, isInternational);
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

  const deliveryDetailsHtml = isInternational
    ? `
    <!-- International Delivery Details Card -->
    <div style="padding: 0 35px 25px 35px;">
      <div style="background: #FAF7F2; border: 1px solid #E8D5B7; border-radius: 12px; padding: 18px 20px;">
        <div style="padding-bottom: 10px; border-bottom: 1px solid #EADBCE; font-family: Georgia, serif; font-size: 12.5px; font-weight: bold; color: #4A3520; text-transform: uppercase; letter-spacing: 1.5px;">
          📍 INTERNATIONAL DELIVERY ADDRESS / ADRESSE DE LIVRAISON
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0 6px 0;">
          <span style="font-size: 12px; color: #8A6538; font-weight: 600;">Recipient / Destinataire:</span>
          <span style="font-size: 12.5px; color: #141414; font-weight: 600;">
            ${customerName}${recipientPhone ? ` • <strong style="font-family: monospace;">${recipientPhone}</strong>` : ""}
          </span>
        </div>
        ${(commune || wilaya) ? `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0;">
            <span style="font-size: 12px; color: #8A6538; font-weight: 600;">Destination:</span>
            <span style="font-size: 12.5px; color: #141414; font-weight: 600;">${[commune, wilaya].filter(Boolean).join(", ")}</span>
          </div>
        ` : ""}
        ${street ? `
          <div style="display: flex; justify-content: space-between; align-items: flex-start; padding: 5px 0 6px 0;">
            <span style="font-size: 12px; color: #8A6538; font-weight: 600;">Address / Adresse:</span>
            <span style="font-size: 12.5px; color: #141414; font-weight: 600; text-align: right; max-width: 320px; line-height: 1.4;">${street}</span>
          </div>
        ` : ""}
      </div>
    </div>
  `
    : `
    <!-- National Delivery Details Card -->
    <div style="padding: 0 35px 25px 35px;">
      <div style="background: #FAF7F2; border: 1px solid #E8D5B7; border-radius: 12px; padding: 18px 20px;">
        <div style="padding-bottom: 10px; border-bottom: 1px solid #EADBCE; font-family: Georgia, serif; font-size: 12.5px; font-weight: bold; color: #4A3520; text-transform: uppercase; letter-spacing: 1.5px;">
          📍 DELIVERY INFORMATION / DÉTAILS DE LIVRAISON
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0 6px 0;">
          <span style="font-size: 12px; color: #8A6538; font-weight: 600;">Delivery Method:</span>
          <span style="font-size: 12.5px; color: #141414; font-weight: 700;">
            ${order.deliveryType === "STOPDESK" || /stop\s*desk|hub|bureau|مكتب/i.test(street) ? "🏢 Stop Desk (Pickup Bureau ZR Express)" : "🏠 Home Delivery (Livraison à domicile)"}
          </span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0;">
          <span style="font-size: 12px; color: #8A6538; font-weight: 600;">Recipient:</span>
          <span style="font-size: 12.5px; color: #141414; font-weight: 600;">
            ${customerName}${recipientPhone ? ` • <strong style="font-family: monospace;">${recipientPhone}</strong>` : ""}
          </span>
        </div>
        ${[wilaya ? (wilayaCode ? `${wilaya} (${wilayaCode})` : wilaya) : "", commune && commune.toLowerCase() !== wilaya.toLowerCase() ? commune : ""].filter(Boolean).join(" • ") ? `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0;">
            <span style="font-size: 12px; color: #8A6538; font-weight: 600;">Destination:</span>
            <span style="font-size: 12.5px; color: #141414; font-weight: 600;">${[wilaya ? (wilayaCode ? `${wilaya} (${wilayaCode})` : wilaya) : "", commune && commune.toLowerCase() !== wilaya.toLowerCase() ? commune : ""].filter(Boolean).join(" • ")}</span>
          </div>
        ` : ""}
        ${street ? `
          <div style="display: flex; justify-content: space-between; align-items: flex-start; padding: 5px 0 6px 0;">
            <span style="font-size: 12px; color: #8A6538; font-weight: 600;">${order.deliveryType === "STOPDESK" || /stop\s*desk|hub|bureau|مكتب/i.test(street) ? "Pickup Bureau / Hub:" : "Address / Adresse:"}</span>
            <span style="font-size: 12.5px; color: #141414; font-weight: 600; text-align: right; max-width: 320px; line-height: 1.4;">${street}</span>
          </div>
        ` : ""}
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0 0 0; border-top: 1px dashed #EADBCE;">
          <span style="font-size: 12px; color: #8A6538; font-weight: 600;">Courier Service:</span>
          <span style="font-size: 12px; color: #236E39; font-weight: 700;">🚚 ZR Express (Tracked Express Courier)</span>
        </div>
      </div>
    </div>
  `;

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
            ✦ ORDER CONFIRMED ✦
          </div>
          <h2 style="font-family: Georgia, serif; color: #2B2118; font-size: 22px; margin: 0 0 12px 0; font-weight: normal;">Dear ${customerName},</h2>
          <p style="color: #6B5744; font-size: 14px; line-height: 1.8; margin: 0;">
            ${
              isInternational
                ? `We are delighted to confirm that your international order <strong>#${order.orderNumber}</strong> was successfully confirmed on <strong>${longDate}</strong>. Our atelier is preparing your bespoke creation with noble craftsmanship and timeless refinement.`
                : `Thank you for your order. We are delighted to confirm that order <strong>#${order.orderNumber}</strong> has been successfully received and confirmed on <strong>${longDate}</strong>. Our atelier is now preparing your bespoke creation with the utmost care, dedication, and elegance.`
            }
          </p>
        </div>

        <!-- Order Ref Card -->
        <div style="padding: 0 35px 20px 35px;">
          <div style="background: #FDFBF7; border: 1px dashed #E2D3BE; border-radius: 12px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 11px; color: #8C7355; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">
              ORDER NUMBER: <span style="font-family: monospace; font-size: 13.5px; color: #141414; font-weight: bold;">#${order.orderNumber}</span>
            </div>
            <div style="font-size: 11px; color: #236E39; font-weight: 700; text-transform: uppercase;">
              ✓ CONFIRMED ON ${shortDate}
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

        <!-- Total Box with Delivery Breakdown -->
        <div style="padding: 0 35px 25px 35px;">
          <div style="background: #FAF7F2; border: 1px solid #E8D5B7; border-radius: 12px; padding: 18px 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px;">
              <span style="font-size: 12.5px; color: #7A5C38; font-weight: 500;">Items Subtotal (Sous-total articles)</span>
              <span style="font-size: 13.5px; font-weight: 600; color: #141414;">${formattedSubtotal}</span>
            </div>
            ${
              !isInternational
                ? `
                  <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: ${formattedDiscount ? "8px" : "12px"};">
                    <span style="font-size: 12.5px; color: #7A5C38; font-weight: 500;">Delivery Fee (Frais de livraison)</span>
                    <span style="font-size: 13.5px; font-weight: 600; color: #141414;">${formattedShippingFee}</span>
                  </div>
                `
                : ""
            }
            ${formattedDiscount ? `
              <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px;">
                <span style="font-size: 12.5px; color: #236E39; font-weight: 600;">Discount / Coupon (Remise)</span>
                <span style="font-size: 13.5px; font-weight: 700; color: #236E39;">-${formattedDiscount}</span>
              </div>
            ` : ""}
            <div style="border-top: 1px solid #EADBCE; padding-top: 12px; display: flex; justify-content: space-between; align-items: center;">
              <div style="font-family: Georgia, serif; font-size: 13.5px; font-weight: bold; color: #4A3520; text-transform: uppercase; letter-spacing: 1.5px;">
                ${isInternational ? "TOTAL AMOUNT (TOTAL ARTICLES)" : "TOTAL AMOUNT DUE (TOTAL À PAYER)"}
              </div>
              <div style="font-size: 18px; font-weight: 800; color: #141414;">
                ${formattedTotal}
              </div>
            </div>
          </div>
        </div>

        <!-- Delivery Details Section -->
        ${deliveryDetailsHtml}

        <!-- Dedicated Support & Contact CTAs -->
        <div style="padding: 0 35px 25px 35px;">
          <div style="background: #FDFBF7; border: 1px solid #EADBCE; border-radius: 12px; padding: 18px 20px; text-align: center;">
            <p style="font-family: Georgia, serif; font-size: 12.5px; font-weight: bold; color: #4A3520; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 6px 0;">
              💬 CLIENT CONCIERGE & SUPPORT
            </p>
            <p style="font-size: 12px; color: #7A5C38; line-height: 1.6; margin: 0 0 14px 0;">
              ${
                isInternational
                  ? "For shipping inquiries, parcel tracking, or any assistance with your international order, our private client advisor is directly at your service via WhatsApp and Email:"
                  : "For any assistance or questions regarding your order, our dedicated team is at your disposal:"
              }
            </p>
            <div style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;">
              <a href="https://wa.me/213772515448?text=${encodeURIComponent(`Hello, I have a question regarding my confirmed order #${order.orderNumber}`)}"
                 style="display: inline-block; padding: 10px 20px; background: #25D366; color: #FFFFFF; text-decoration: none; font-size: 11.5px; font-weight: 700; border-radius: 6px; text-align: center;">
                💬 WhatsApp: +213 772 51 54 48
              </a>
              <a href="mailto:elhuyamcollection09@gmail.com?subject=${encodeURIComponent(`Order #${order.orderNumber} - EL HUYAAM`)}"
                 style="display: inline-block; padding: 10px 20px; background: #141414; color: #FAF9F6; text-decoration: none; font-size: 11.5px; font-weight: 700; border-radius: 6px; text-align: center;">
                ✉️ Email: elhuyamcollection09@gmail.com
              </a>
            </div>
            <div style="margin-top: 12px;">
              <a href="https://www.elhuyam.com/orders/track?orderNumber=${order.orderNumber}"
                 style="display: inline-block; color: #141414; text-decoration: underline; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">
                TRACK YOUR ORDER LIVE →
              </a>
            </div>
          </div>
        </div>

        <!-- Reassurance -->
        <div style="background-color: #FDFBF7; border-top: 1px solid #EBE4D8; border-bottom: 1px solid #EBE4D8; padding: 18px 20px; display: flex; justify-content: space-around; text-align: center;">
          <div style="font-size: 10px; font-weight: 700; color: #3D2F24;">✦ Bespoke Tailoring</div>
          <div style="font-size: 10px; font-weight: 700; color: #3D2F24;">${isInternational ? "🌍 Worldwide Shipping" : "🚚 58 Wilayas & World"}</div>
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
            Wonderful news! Your order <strong>#${order.orderNumber}</strong> has been carefully packaged and dispatched. Your bespoke creation is now actively in transit to your destination.
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
              ${isInternational ? "Tracked International Courier Dispatch" : "Courier: <strong>ZR Express</strong> • Doorstep & Stopdesk Tracked Express Delivery"}
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

        <!-- Total Box with Delivery Breakdown -->
        <div style="padding: 0 35px 25px 35px;">
          <div style="background: #FAF7F2; border: 1px solid #E8D5B7; border-radius: 12px; padding: 18px 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px;">
              <span style="font-size: 12.5px; color: #7A5C38; font-weight: 500;">Items Subtotal (Sous-total articles)</span>
              <span style="font-size: 13.5px; font-weight: 600; color: #141414;">${formattedSubtotal}</span>
            </div>
            ${
              !isInternational
                ? `
                  <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: ${formattedDiscount ? "8px" : "12px"};">
                    <span style="font-size: 12.5px; color: #7A5C38; font-weight: 500;">Delivery Fee (Frais de livraison)</span>
                    <span style="font-size: 13.5px; font-weight: 600; color: #141414;">${formattedShippingFee}</span>
                  </div>
                `
                : ""
            }
            ${formattedDiscount ? `
              <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px;">
                <span style="font-size: 12.5px; color: #236E39; font-weight: 600;">Discount / Coupon (Remise)</span>
                <span style="font-size: 13.5px; font-weight: 700; color: #236E39;">-${formattedDiscount}</span>
              </div>
            ` : ""}
            <div style="border-top: 1px solid #EADBCE; padding-top: 12px; display: flex; justify-content: space-between; align-items: center;">
              <div style="font-family: Georgia, serif; font-size: 13px; font-weight: bold; color: #4A3520; text-transform: uppercase; letter-spacing: 1px;">
                ${isInternational ? "TOTAL AMOUNT (TOTAL ARTICLES)" : "TOTAL AMOUNT DUE (TOTAL À PAYER)"}
              </div>
              <div style="font-size: 17px; font-weight: 800; color: #141414;">
                ${formattedTotal}
              </div>
            </div>
          </div>
        </div>

        <!-- Delivery Details Section -->
        ${deliveryDetailsHtml}

        <!-- Dedicated Support & Contact CTAs -->
        <div style="padding: 0 35px 25px 35px;">
          <div style="background: #FDFBF7; border: 1px solid #EADBCE; border-radius: 12px; padding: 18px 20px; text-align: center;">
            <p style="font-family: Georgia, serif; font-size: 12.5px; font-weight: bold; color: #4A3520; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 6px 0;">
              💬 CLIENT CONCIERGE & SUPPORT
            </p>
            <p style="font-size: 12px; color: #7A5C38; line-height: 1.6; margin: 0 0 14px 0;">
              If you have questions about your delivery status, contact us directly:
            </p>
            <div style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;">
              <a href="https://wa.me/213772515448?text=${encodeURIComponent(`Hello, I would like an update on my shipment #${order.orderNumber} (${trackingToUse})`)}"
                 style="display: inline-block; padding: 10px 20px; background: #25D366; color: #FFFFFF; text-decoration: none; font-size: 11.5px; font-weight: 700; border-radius: 6px; text-align: center;">
                💬 WhatsApp: +213 772 51 54 48
              </a>
              <a href="mailto:elhuyamcollection09@gmail.com?subject=${encodeURIComponent(`Shipment #${order.orderNumber} (${trackingToUse})`)}"
                 style="display: inline-block; padding: 10px 20px; background: #141414; color: #FAF9F6; text-decoration: none; font-size: 11.5px; font-weight: 700; border-radius: 6px; text-align: center;">
                ✉️ Email: elhuyamcollection09@gmail.com
              </a>
            </div>
            <div style="margin-top: 12px;">
              <a href="https://www.elhuyam.com/orders/track?orderNumber=${order.orderNumber}&phone=${trackingToUse}"
                 style="display: inline-block; color: #141414; text-decoration: underline; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">
                TRACK YOUR SHIPMENT LIVE →
              </a>
            </div>
          </div>
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
      ? `Order Confirmed #${order.orderNumber} ✦ EL HUYAAM`
      : `Your Parcel is on Its Way! 🚚 #${order.orderNumber} ✦ EL HUYAAM`;

  const currentHtml = activeTab === "confirmation" ? confirmationHtml : shippedHtml;

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(currentHtml);
    setCopied(true);
    toast.success("Code HTML de l'e-mail copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = async () => {
    if (!recipientEmail || !recipientEmail.includes("@")) {
      toast.error("Veuillez renseigner une adresse e-mail valide pour la cliente.");
      setIsEditingEmail(true);
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activeTab,
          customEmail: recipientEmail.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || json.error || "Échec de l'envoi.");
      }

      toast.success(json.data?.message || `E-mail envoyé avec succès à ${recipientEmail} !`);
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'envoi de l'e-mail.");
    } finally {
      setIsSending(false);
    }
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
                Aperçu & Envoi de l&apos;E-mail Client (Haute Couture)
              </h3>
              
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-500 font-medium">Destinataire :</span>
                {isEditingEmail ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="email.cliente@example.com"
                      className="text-xs font-mono px-2.5 py-1 border border-slate-300 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 w-64 bg-slate-50 text-slate-900"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setIsEditingEmail(false)}
                      className="text-xs px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Valider
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {recipientEmail || "Aucun e-mail (cliquez pour ajouter)"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingEmail(true)}
                      className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-md transition-colors cursor-pointer"
                      title="Modifier l'adresse e-mail"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <span className="text-xs text-slate-400">({customerName})</span>
                  </div>
                )}
              </div>
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
              <span>📋 Confirmation & Remise Transporteur</span>
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
              <span>🚚 Expédition / N° de Suivi</span>
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

        {/* Modal Footer with Direct Send Button */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            Expéditeur : <strong className="text-slate-800 font-mono">EL HUYAAM &lt;elhuyamcollection09@gmail.com&gt;</strong>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all cursor-pointer"
            >
              Fermer
            </button>

            <button
              type="button"
              onClick={handleSendEmail}
              disabled={isSending}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Envoi en cours...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Envoyer cet e-mail à la cliente ✉️</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
