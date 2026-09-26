import nodemailer from "nodemailer";

function getTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER || "elhuyamcollection09@gmail.com";
  const pass = process.env.SMTP_PASS?.replace(/\s+/g, "").trim();

  if (!pass) {
    console.warn(
      "[email] Warning: SMTP_PASS is not defined in environment variables. Email sending cannot proceed."
    );
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: EmailOptions) {
  const transporter = getTransporter();
  if (!transporter) {
    return;
  }

  const fromEmail = process.env.SMTP_USER || "elhuyamcollection09@gmail.com";

  await transporter.sendMail({
    from: `"EL HUYAAM" <${fromEmail}>`,
    replyTo: fromEmail,
    to,
    subject,
    html,
  });
}

// ─── 1. Welcome Email (English Luxury) ────────────────────────────────────────
export async function sendWelcomeEmail(name: string, email: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.elhuyam.com";
  await sendEmail({
    to: email,
    subject: "Welcome to the World of EL HUYAAM ✦",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="utf-8"><title>Welcome to EL HUYAAM</title></head>
      <body style="margin: 0; padding: 0; background-color: #F7F5F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F7F5F0; padding: 40px 10px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background: #FFFFFF; border-radius: 16px; border: 1px solid #EBE4D8; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                <!-- Top Gold Accent Ribbon -->
                <tr>
                  <td style="background: linear-gradient(90deg, #1A1A1A 0%, #C5A880 50%, #1A1A1A 100%); height: 5px;"></td>
                </tr>
                <!-- Brand Header -->
                <tr>
                  <td align="center" style="padding: 40px 30px 20px 30px; text-align: center;">
                    <h1 style="font-family: Georgia, 'Playfair Display', serif; font-size: 30px; letter-spacing: 6px; color: #141414; text-transform: uppercase; margin: 0; font-weight: 700;">EL HUYAAM</h1>
                    <p style="font-size: 10px; letter-spacing: 3.5px; color: #9A7A52; text-transform: uppercase; margin: 6px 0 0 0; font-weight: 600;">MODEST HAUTE COUTURE</p>
                    <div style="margin: 18px auto 0 auto; color: #C5A880; font-size: 13px;">✦ ✦ ✦</div>
                  </td>
                </tr>
                <!-- Welcome Content -->
                <tr>
                  <td style="padding: 10px 40px 30px 40px; text-align: center;">
                    <div style="display: inline-block; background: #FAF5EE; border: 1px solid #E3D5C1; color: #8A6538; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; padding: 6px 16px; border-radius: 20px; margin-bottom: 20px;">
                      ✦ WELCOME TO OUR MAISON ✦
                    </div>
                    <h2 style="font-family: Georgia, serif; color: #2B2118; font-size: 22px; margin: 0 0 16px 0; font-weight: normal;">Dear ${name},</h2>
                    <p style="color: #6B5744; font-size: 14.5px; line-height: 1.8; margin: 0 0 24px 0;">
                      It is an honor to welcome you to the <strong>EL HUYAAM</strong> family. 
                      Our house celebrates timeless elegance, modesty, and grace through bespoke craftsmanship and noble fabrics.
                    </p>
                    <a href="${appUrl}/shop"
                       style="display: inline-block; padding: 15px 36px; background: #141414; color: #FAF9F6; text-decoration: none; letter-spacing: 2px; font-size: 12px; font-weight: bold; text-transform: uppercase; border-radius: 6px;">
                      DISCOVER NEW COLLECTION →
                    </a>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color: #FAF9F6; border-top: 1px solid #EBE4D8; padding: 25px 30px; text-align: center;">
                    <p style="font-family: Georgia, serif; font-style: italic; color: #8C7355; font-size: 13px; margin: 0 0 8px 0;">« Grace and elegance in modesty. »</p>
                    <p style="color: #A39281; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} EL HUYAAM. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });
}

// ─── 2. Password Reset Email (English Luxury) ─────────────────────────────────
export async function sendPasswordResetEmail(name: string, email: string, token: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.elhuyam.com";
  const resetUrl = `${appUrl}/auth/reset-password?token=${token}`;
  await sendEmail({
    to: email,
    subject: "Reset Your EL HUYAAM Password ✦",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="utf-8"><title>Reset Your Password — EL HUYAAM</title></head>
      <body style="margin: 0; padding: 0; background-color: #F7F5F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F7F5F0; padding: 40px 10px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background: #FFFFFF; border-radius: 16px; border: 1px solid #EBE4D8; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                <tr>
                  <td style="background: linear-gradient(90deg, #1A1A1A 0%, #C5A880 50%, #1A1A1A 100%); height: 5px;"></td>
                </tr>
                <tr>
                  <td align="center" style="padding: 40px 30px 20px 30px; text-align: center;">
                    <h1 style="font-family: Georgia, 'Playfair Display', serif; font-size: 30px; letter-spacing: 6px; color: #141414; text-transform: uppercase; margin: 0; font-weight: 700;">EL HUYAAM</h1>
                    <p style="font-size: 10px; letter-spacing: 3.5px; color: #9A7A52; text-transform: uppercase; margin: 6px 0 0 0; font-weight: 600;">MODEST HAUTE COUTURE</p>
                    <div style="margin: 18px auto 0 auto; color: #C5A880; font-size: 13px;">✦ ✦ ✦</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 40px 35px 40px; text-align: center;">
                    <h2 style="font-family: Georgia, serif; color: #2B2118; font-size: 20px; margin: 0 0 16px 0; font-weight: normal;">Password Reset Request</h2>
                    <p style="color: #6B5744; font-size: 14.5px; line-height: 1.8; margin: 0 0 24px 0;">
                      Hello ${name}, we received a request to reset your password. 
                      This secure link will expire in 1 hour.
                    </p>
                    <a href="${resetUrl}"
                       style="display: inline-block; padding: 14px 34px; background: #141414; color: #FAF9F6; text-decoration: none; letter-spacing: 2px; font-size: 12px; font-weight: bold; text-transform: uppercase; border-radius: 6px;">
                      RESET PASSWORD →
                    </a>
                    <p style="color: #A39281; font-size: 12px; margin-top: 30px; line-height: 1.6;">
                      If you did not request this, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #FAF9F6; border-top: 1px solid #EBE4D8; padding: 20px 30px; text-align: center;">
                    <p style="color: #A39281; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} EL HUYAAM. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });
}

// ─── Types ───────────────────────────────────────────────────────────────────
export interface OrderEmailShippingDetails {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  wilayaCode?: string | null;
  postalCode?: string | null;
  deliveryType?: "DOMICILE" | "STOPDESK" | string | null;
  carrier?: string | null;
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

function renderDeliveryDetailsTable(
  shippingDetails: OrderEmailShippingDetails | undefined,
  fallbackName: string,
  isInternational: boolean = false
): string {
  if (!shippingDetails) return "";

  const recipientName =
    `${shippingDetails.firstName ?? ""} ${shippingDetails.lastName ?? ""}`.trim() ||
    fallbackName;
  const phone = shippingDetails.phone?.trim();
  const wilaya = shippingDetails.state?.trim() || "";
  const wilayaCode = shippingDetails.wilayaCode?.trim() || "";
  const commune = shippingDetails.city?.trim() || "";
  const street = shippingDetails.street?.trim() || "";

  if (isInternational) {
    const destination = [commune, wilaya].filter(Boolean).join(", ") || "International";
    return `
    <!-- International Delivery Information Card -->
    <tr>
      <td style="padding: 0 40px 25px 40px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #FAF7F2; border: 1px solid #E8D5B7; border-radius: 12px; padding: 18px 22px;">
          <tr>
            <td colspan="2" style="padding-bottom: 12px; border-bottom: 1px solid #EADBCE;">
              <span style="font-family: Georgia, serif; font-size: 12.5px; font-weight: bold; color: #4A3520; text-transform: uppercase; letter-spacing: 1.5px;">
                📍 INTERNATIONAL DELIVERY ADDRESS / ADRESSE DE LIVRAISON
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0 6px 0; font-size: 12px; color: #8A6538; font-weight: 600; vertical-align: top;">
              Recipient / Destinataire:
            </td>
            <td align="right" style="padding: 10px 0 6px 0; font-size: 12.5px; color: #141414; font-weight: 600;">
              ${recipientName}${phone ? ` • <span style="font-family: monospace; font-weight: bold;">${phone}</span>` : ""}
            </td>
          </tr>
          ${destination ? `
            <tr>
              <td style="padding: 5px 0; font-size: 12px; color: #8A6538; font-weight: 600; vertical-align: top;">
                Destination:
              </td>
              <td align="right" style="padding: 5px 0; font-size: 12.5px; color: #141414; font-weight: 600;">
                ${destination}
              </td>
            </tr>
          ` : ""}
          ${street ? `
            <tr>
              <td style="padding: 5px 0 6px 0; font-size: 12px; color: #8A6538; font-weight: 600; vertical-align: top;">
                Address / Adresse:
              </td>
              <td align="right" style="padding: 5px 0 6px 0; font-size: 12.5px; color: #141414; font-weight: 600; line-height: 1.4; max-width: 320px;">
                ${street}
              </td>
            </tr>
          ` : ""}
        </table>
      </td>
    </tr>
    `;
  }

  const isStopdesk =
    shippingDetails.deliveryType === "STOPDESK" ||
    /stop\s*desk|hub|bureau|مكتب/i.test(street);

  const destinationParts = [
    wilaya ? (wilayaCode ? `${wilaya} (${wilayaCode})` : wilaya) : "",
    commune && commune.toLowerCase() !== wilaya.toLowerCase() ? commune : "",
  ].filter(Boolean).join(" • ");

  return `
    <!-- Delivery Information Card -->
    <tr>
      <td style="padding: 0 40px 25px 40px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #FAF7F2; border: 1px solid #E8D5B7; border-radius: 12px; padding: 18px 22px;">
          <tr>
            <td colspan="2" style="padding-bottom: 12px; border-bottom: 1px solid #EADBCE;">
              <span style="font-family: Georgia, serif; font-size: 12.5px; font-weight: bold; color: #4A3520; text-transform: uppercase; letter-spacing: 1.5px;">
                📍 DELIVERY INFORMATION / DÉTAILS DE LIVRAISON
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0 6px 0; font-size: 12px; color: #8A6538; font-weight: 600; vertical-align: top;">
              Delivery Method:
            </td>
            <td align="right" style="padding: 10px 0 6px 0; font-size: 12.5px; color: #141414; font-weight: 700;">
              ${isStopdesk ? "🏢 Stop Desk (Pickup Bureau ZR Express)" : "🏠 Home Delivery (Livraison à domicile)"}
            </td>
          </tr>
          <tr>
            <td style="padding: 5px 0; font-size: 12px; color: #8A6538; font-weight: 600; vertical-align: top;">
              Recipient:
            </td>
            <td align="right" style="padding: 5px 0; font-size: 12.5px; color: #141414; font-weight: 600;">
              ${recipientName}${phone ? ` • <span style="font-family: monospace; font-weight: bold;">${phone}</span>` : ""}
            </td>
          </tr>
          ${destinationParts ? `
            <tr>
              <td style="padding: 5px 0; font-size: 12px; color: #8A6538; font-weight: 600; vertical-align: top;">
                Destination:
              </td>
              <td align="right" style="padding: 5px 0; font-size: 12.5px; color: #141414; font-weight: 600;">
                ${destinationParts}
              </td>
            </tr>
          ` : ""}
          ${street ? `
            <tr>
              <td style="padding: 5px 0 6px 0; font-size: 12px; color: #8A6538; font-weight: 600; vertical-align: top;">
                ${isStopdesk ? "Pickup Bureau / Hub:" : "Address / Adresse:"}
              </td>
              <td align="right" style="padding: 5px 0 6px 0; font-size: 12.5px; color: #141414; font-weight: 600; line-height: 1.4; max-width: 320px;">
                ${street}
              </td>
            </tr>
          ` : ""}
          <tr>
            <td style="padding: 8px 0 0 0; font-size: 12px; color: #8A6538; font-weight: 600; border-top: 1px dashed #EADBCE; vertical-align: middle;">
              Courier Service:
            </td>
            <td align="right" style="padding: 8px 0 0 0; font-size: 12px; color: #236E39; font-weight: 700; border-top: 1px dashed #EADBCE;">
              🚚 ZR Express (Tracked Express Courier)
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

// ─── 3. Order Confirmation Email (English & French Luxury) ────────────────────
export async function sendOrderConfirmationEmail(
  email: string,
  name: string,
  orderNumber: string,
  totalAmount: number,
  isInternational: boolean,
  items: { productTitle: string; quantity: number; price: number; size?: string | null; color?: string | null }[],
  shippingFee: number = 0,
  subtotal?: number,
  discount?: number,
  shippingDetails?: OrderEmailShippingDetails,
  orderDate?: Date | string | null
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.elhuyam.com";

  const itemsSum = items.reduce((acc, item) => acc + (Number(item.price || 0) * (Number(item.quantity) || 1)), 0);
  const resolvedSubtotal = (subtotal !== undefined && subtotal !== null && subtotal > 0) ? subtotal : itemsSum;

  let resolvedShippingFee = shippingFee;
  if (!isInternational && (resolvedShippingFee === undefined || resolvedShippingFee === null || (resolvedShippingFee === 0 && totalAmount > resolvedSubtotal))) {
    resolvedShippingFee = Math.max(0, Math.round((totalAmount - resolvedSubtotal + (discount || 0)) * 100) / 100);
  }

  const formattedSubtotal = formatMoney(resolvedSubtotal, isInternational);
  const formattedShippingFee = resolvedShippingFee > 0
    ? formatMoney(resolvedShippingFee, isInternational)
    : "Free Delivery (0,00 DA)";

  const formattedDiscount = (discount && discount > 0) ? formatMoney(discount, isInternational) : null;
  const formattedTotal = formatMoney(isInternational ? (resolvedSubtotal - (discount || 0)) : totalAmount, isInternational);

  const { longDate, shortDate } = formatOrderDate(orderDate);

  const itemsHtml = items
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

  const deliveryDetailsHtml = renderDeliveryDetailsTable(shippingDetails, name, isInternational);

  const subject = isInternational
    ? `Order Confirmed #${orderNumber} ✦ EL HUYAAM`
    : `Order Confirmed #${orderNumber} ✦ EL HUYAAM`;

  await sendEmail({
    to: email,
    subject,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="utf-8"><title>Order Confirmed — EL HUYAAM</title></head>
      <body style="margin: 0; padding: 0; background-color: #F7F5F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F7F5F0; padding: 40px 10px;">
          <tr>
            <td align="center">
              <table width="620" cellpadding="0" cellspacing="0" style="max-width: 620px; width: 100%; background: #FFFFFF; border-radius: 16px; border: 1px solid #EBE4D8; overflow: hidden; box-shadow: 0 4px 25px rgba(0,0,0,0.04);">
                
                <!-- Top Gold Accent Ribbon -->
                <tr>
                  <td style="background: linear-gradient(90deg, #141414 0%, #C5A880 50%, #141414 100%); height: 5px;"></td>
                </tr>

                <!-- Haute Couture Brand Header -->
                <tr>
                  <td align="center" style="padding: 40px 30px 15px 30px; text-align: center;">
                    <h1 style="font-family: Georgia, 'Playfair Display', serif; font-size: 32px; letter-spacing: 7px; color: #141414; text-transform: uppercase; margin: 0; font-weight: 700;">EL HUYAAM</h1>
                    <p style="font-size: 10.5px; letter-spacing: 4px; color: #9A7A52; text-transform: uppercase; margin: 6px 0 0 0; font-weight: 600;">MODEST HAUTE COUTURE</p>
                    <div style="margin: 18px auto 0 auto; color: #C5A880; font-size: 13px;">✦ ✦ ✦</div>
                  </td>
                </tr>

                <!-- Status Badge & Personalized Greeting -->
                <tr>
                  <td style="padding: 15px 40px 25px 40px; text-align: center;">
                    <div style="display: inline-block; background: #FAF5EE; border: 1px solid #E3D5C1; color: #8A6538; font-size: 11px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; padding: 7px 18px; border-radius: 24px; margin-bottom: 20px;">
                      ${isInternational ? "✦ ORDER CONFIRMED ✦" : "✦ ORDER CONFIRMED ✦"}
                    </div>
                    <h2 style="font-family: Georgia, serif; color: #2B2118; font-size: 23px; margin: 0 0 14px 0; font-weight: normal;">Dear ${name},</h2>
                    <p style="color: #6B5744; font-size: 14.5px; line-height: 1.85; margin: 0;">
                      ${
                        isInternational
                          ? `We are delighted to confirm that your international order <strong>#${orderNumber}</strong> was successfully confirmed on <strong>${longDate}</strong>. Our atelier is preparing your bespoke creation with noble craftsmanship and timeless refinement.`
                          : `Thank you for your order. We are delighted to confirm that order <strong>#${orderNumber}</strong> has been successfully received and confirmed on <strong>${longDate}</strong>. Our atelier is now preparing your bespoke creation with the utmost care, dedication, and elegance.`
                      }
                    </p>
                  </td>
                </tr>

                <!-- Order Reference Card -->
                <tr>
                  <td style="padding: 0 40px 25px 40px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: #FDFBF7; border: 1px dashed #E2D3BE; border-radius: 12px; padding: 16px 20px;">
                      <tr>
                        <td align="left" style="font-size: 11px; color: #8C7355; text-transform: uppercase; font-weight: 700; letter-spacing: 1.5px;">
                          ORDER NUMBER: <span style="font-family: monospace; font-size: 14px; color: #141414; font-weight: bold; letter-spacing: 1px;">#${orderNumber}</span>
                        </td>
                        <td align="right" style="font-size: 11px; color: #236E39; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                          ✓ CONFIRMED ON ${shortDate}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Product Items Table -->
                <tr>
                  <td style="padding: 0 40px 20px 40px;">
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
                  </td>
                </tr>

                <!-- Total Summary Breakdown Box -->
                <tr>
                  <td style="padding: 0 40px 25px 40px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: #FAF7F2; border: 1px solid #E8D5B7; border-radius: 12px; padding: 18px 24px;">
                      <tr>
                        <td align="left" style="padding-bottom: 8px; font-size: 12.5px; color: #7A5C38; font-weight: 500;">
                          Items Subtotal (Sous-total articles)
                        </td>
                        <td align="right" style="padding-bottom: 8px; font-size: 13.5px; font-weight: 600; color: #141414;">
                          ${formattedSubtotal}
                        </td>
                      </tr>
                      ${
                        !isInternational
                          ? `
                            <tr>
                              <td align="left" style="padding-bottom: ${formattedDiscount ? "8px" : "12px"}; font-size: 12.5px; color: #7A5C38; font-weight: 500;">
                                Delivery Fee (Frais de livraison ZR Express)
                              </td>
                              <td align="right" style="padding-bottom: ${formattedDiscount ? "8px" : "12px"}; font-size: 13.5px; font-weight: 600; color: #141414;">
                                ${formattedShippingFee}
                              </td>
                            </tr>
                          `
                          : ""
                      }
                      ${formattedDiscount ? `
                        <tr>
                          <td align="left" style="padding-bottom: 12px; font-size: 12.5px; color: #236E39; font-weight: 600;">
                            Discount / Coupon (Remise)
                          </td>
                          <td align="right" style="padding-bottom: 12px; font-size: 13.5px; font-weight: 700; color: #236E39;">
                            -${formattedDiscount}
                          </td>
                        </tr>
                      ` : ""}
                      <tr>
                        <td colspan="2" style="border-top: 1px solid #EADBCE; padding-top: 12px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td align="left" style="font-family: Georgia, serif; font-size: 14px; font-weight: bold; color: #4A3520; text-transform: uppercase; letter-spacing: 1.5px;">
                                ${isInternational ? "TOTAL AMOUNT (TOTAL ARTICLES)" : "TOTAL AMOUNT DUE (TOTAL À PAYER)"}
                              </td>
                              <td align="right" style="font-family: -apple-system, sans-serif; font-size: 19px; font-weight: 800; color: #141414; letter-spacing: 0.5px;">
                                ${formattedTotal}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Delivery Details Section -->
                ${deliveryDetailsHtml}

                <!-- Dedicated Support & Contact CTAs -->
                <tr>
                  <td style="padding: 0 40px 25px 40px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: #FDFBF7; border: 1px solid #EADBCE; border-radius: 12px; padding: 20px 24px; text-align: center;">
                      <tr>
                        <td>
                          <p style="font-family: Georgia, serif; font-size: 13px; font-weight: bold; color: #4A3520; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 6px 0;">
                            💬 CLIENT CONCIERGE & SUPPORT
                          </p>
                          <p style="font-size: 12px; color: #7A5C38; line-height: 1.6; margin: 0 0 16px 0;">
                            ${
                              isInternational
                                ? "For shipping inquiries, parcel tracking, or any assistance with your international order, our private client advisor is directly at your service via WhatsApp and Email:"
                                : "For any assistance or questions regarding your order, our dedicated team is at your disposal:"
                            }
                          </p>
                          <table align="center" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                            <tr>
                              <td style="padding: 4px 6px;">
                                <a href="https://wa.me/213772515448?text=${encodeURIComponent(`Hello, I have a question regarding my confirmed order #${orderNumber}`)}"
                                   style="display: inline-block; padding: 11px 22px; background: #25D366; color: #FFFFFF; text-decoration: none; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; border-radius: 6px; text-align: center;">
                                  💬 WhatsApp: +213 772 51 54 48
                                </a>
                              </td>
                              <td style="padding: 4px 6px;">
                                <a href="mailto:elhuyamcollection09@gmail.com?subject=${encodeURIComponent(`Order #${orderNumber} - EL HUYAAM`)}"
                                   style="display: inline-block; padding: 11px 22px; background: #141414; color: #FAF9F6; text-decoration: none; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; border-radius: 6px; text-align: center;">
                                  ✉️ Email: elhuyamcollection09@gmail.com
                                </a>
                              </td>
                            </tr>
                          </table>
                          <div style="margin-top: 14px;">
                            <a href="${appUrl}/orders/track?orderNumber=${orderNumber}"
                               style="display: inline-block; color: #141414; text-decoration: underline; font-size: 11.5px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">
                              TRACK YOUR ORDER LIVE →
                            </a>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- 3 Luxury Reassurance Badges -->
                <tr>
                  <td style="background-color: #FDFBF7; border-top: 1px solid #EBE4D8; border-bottom: 1px solid #EBE4D8; padding: 22px 25px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="text-align: center;">
                      <tr>
                        <td width="33%" style="padding: 0 6px;">
                          <div style="font-size: 14px; margin-bottom: 4px;">✦</div>
                          <div style="font-size: 10.5px; font-weight: 700; color: #3D2F24; text-transform: uppercase; letter-spacing: 0.5px;">Bespoke Tailoring</div>
                          <div style="font-size: 9.5px; color: #8C7355; margin-top: 2px;">Noble fabrics & fine finishes</div>
                        </td>
                        <td width="33%" style="padding: 0 6px; border-left: 1px solid #EADBCE; border-right: 1px solid #EADBCE;">
                          <div style="font-size: 14px; margin-bottom: 4px;">${isInternational ? "🌍" : "🚚"}</div>
                          <div style="font-size: 10.5px; font-weight: 700; color: #3D2F24; text-transform: uppercase; letter-spacing: 0.5px;">${isInternational ? "Worldwide Shipping" : "58 Wilayas & Worldwide"}</div>
                          <div style="font-size: 9.5px; color: #8C7355; margin-top: 2px;">${isInternational ? "Dedicated International Care" : "ZR Express tracked courier"}</div>
                        </td>
                        <td width="33%" style="padding: 0 6px;">
                          <div style="font-size: 14px; margin-bottom: 4px;">🤍</div>
                          <div style="font-size: 10.5px; font-weight: 700; color: #3D2F24; text-transform: uppercase; letter-spacing: 0.5px;">Dedicated Concierge</div>
                          <div style="font-size: 9.5px; color: #8C7355; margin-top: 2px;">At your service 7 days a week</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Signature & Footer -->
                <tr>
                  <td style="background-color: #FAF9F6; padding: 30px 30px; text-align: center;">
                    <p style="font-family: Georgia, serif; font-style: italic; color: #7A5C38; font-size: 13.5px; margin: 0 0 10px 0;">
                      « Grace and elegance in modesty. »
                    </p>
                    <p style="color: #9E8C7A; font-size: 11.5px; line-height: 1.6; margin: 0 0 12px 0;">
                      If you have any questions, reach us directly on WhatsApp at <a href="https://wa.me/213772515448" style="color: #236E39; text-decoration: underline; font-weight: 600;">+213 772 51 54 48</a> or email <a href="mailto:elhuyamcollection09@gmail.com" style="color: #8A6538; text-decoration: underline; font-weight: 600;">elhuyamcollection09@gmail.com</a>.
                    </p>
                    <p style="color: #B8A99A; font-size: 10.5px; margin: 0;">
                      © ${new Date().getFullYear()} EL HUYAAM. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });
}

// ─── 4. Order Shipped Email (English & French Luxury - Parcel In Transit) ──────
export async function sendOrderShippedEmail(
  email: string,
  name: string,
  orderNumber: string,
  trackingNumber: string,
  totalAmount: number,
  isInternational: boolean,
  items: { productTitle: string; quantity: number; price: number; size?: string | null; color?: string | null }[],
  shippingFee: number = 0,
  subtotal?: number,
  discount?: number,
  shippingDetails?: OrderEmailShippingDetails,
  orderDate?: Date | string | null
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.elhuyam.com";

  const itemsSum = items.reduce((acc, item) => acc + (Number(item.price || 0) * (Number(item.quantity) || 1)), 0);
  const resolvedSubtotal = (subtotal !== undefined && subtotal !== null && subtotal > 0) ? subtotal : itemsSum;

  let resolvedShippingFee = shippingFee;
  if (!isInternational && (resolvedShippingFee === undefined || resolvedShippingFee === null || (resolvedShippingFee === 0 && totalAmount > resolvedSubtotal))) {
    resolvedShippingFee = Math.max(0, Math.round((totalAmount - resolvedSubtotal + (discount || 0)) * 100) / 100);
  }

  const formattedSubtotal = formatMoney(resolvedSubtotal, isInternational);
  const formattedShippingFee = resolvedShippingFee > 0
    ? formatMoney(resolvedShippingFee, isInternational)
    : "Free Delivery (0,00 DA)";

  const formattedDiscount = (discount && discount > 0) ? formatMoney(discount, isInternational) : null;
  const formattedTotal = formatMoney(isInternational ? (resolvedSubtotal - (discount || 0)) : totalAmount, isInternational);

  const { longDate, shortDate } = formatOrderDate(orderDate);

  const itemsHtml = items
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

  const deliveryDetailsHtml = renderDeliveryDetailsTable(shippingDetails, name, isInternational);

  await sendEmail({
    to: email,
    subject: `Your Parcel is on Its Way! 🚚 #${orderNumber} ✦ EL HUYAAM`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="utf-8"><title>Your Parcel is on Its Way — EL HUYAAM</title></head>
      <body style="margin: 0; padding: 0; background-color: #F7F5F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F7F5F0; padding: 40px 10px;">
          <tr>
            <td align="center">
              <table width="620" cellpadding="0" cellspacing="0" style="max-width: 620px; width: 100%; background: #FFFFFF; border-radius: 16px; border: 1px solid #EBE4D8; overflow: hidden; box-shadow: 0 4px 25px rgba(0,0,0,0.04);">
                
                <!-- Top Gold Accent Ribbon -->
                <tr>
                  <td style="background: linear-gradient(90deg, #141414 0%, #C5A880 50%, #141414 100%); height: 5px;"></td>
                </tr>

                <!-- Brand Header -->
                <tr>
                  <td align="center" style="padding: 40px 30px 15px 30px; text-align: center;">
                    <h1 style="font-family: Georgia, 'Playfair Display', serif; font-size: 32px; letter-spacing: 7px; color: #141414; text-transform: uppercase; margin: 0; font-weight: 700;">EL HUYAAM</h1>
                    <p style="font-size: 10.5px; letter-spacing: 4px; color: #9A7A52; text-transform: uppercase; margin: 6px 0 0 0; font-weight: 600;">MODEST HAUTE COUTURE</p>
                    <div style="margin: 18px auto 0 auto; color: #C5A880; font-size: 13px;">✦ ✦ ✦</div>
                  </td>
                </tr>

                <!-- Status Badge & Greeting -->
                <tr>
                  <td style="padding: 15px 40px 20px 40px; text-align: center;">
                    <div style="display: inline-block; background: #EEF8F1; border: 1px solid #C4E8CD; color: #236E39; font-size: 11px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; padding: 7px 18px; border-radius: 24px; margin-bottom: 20px;">
                      🚚 PARCEL DISPATCHED & IN TRANSIT
                    </div>
                    <h2 style="font-family: Georgia, serif; color: #2B2118; font-size: 23px; margin: 0 0 14px 0; font-weight: normal;">Dear ${name},</h2>
                    <p style="color: #6B5744; font-size: 14.5px; line-height: 1.85; margin: 0;">
                      Wonderful news! Your order <strong>#${orderNumber}</strong> has been carefully packaged and dispatched. Your bespoke creation is now actively in transit to your destination.
                    </p>
                  </td>
                </tr>

                <!-- Tracking Golden Highlight Box -->
                <tr>
                  <td style="padding: 0 40px 25px 40px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: #FAF7F2; border: 1.5px dashed #C5A880; border-radius: 12px; padding: 20px 24px; text-align: center;">
                      <tr>
                        <td align="center">
                          <p style="font-size: 11px; color: #8A6538; text-transform: uppercase; font-weight: 800; letter-spacing: 2px; margin: 0 0 6px 0;">
                            OFFICIAL TRACKING NUMBER
                          </p>
                          <p style="font-family: monospace; font-size: 20px; font-weight: 800; color: #141414; letter-spacing: 2px; margin: 0 0 8px 0;">
                            ${trackingNumber}
                          </p>
                          <p style="font-size: 11.5px; color: #7A5C38; margin: 0;">
                            ${isInternational ? "Tracked International Courier Dispatch" : "Courier: <strong>ZR Express</strong> • Doorstep & Stopdesk Tracked Express Delivery"}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Product Items Table -->
                <tr>
                  <td style="padding: 0 40px 20px 40px;">
                    <p style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: #9A7A52; text-transform: uppercase; margin: 0 0 10px 0;">ORDER SUMMARY #${orderNumber}</p>
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
                  </td>
                </tr>

                <!-- Total Summary Breakdown Box -->
                <tr>
                  <td style="padding: 0 40px 25px 40px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: #FAF7F2; border: 1px solid #E8D5B7; border-radius: 12px; padding: 18px 24px;">
                      <tr>
                        <td align="left" style="padding-bottom: 8px; font-size: 12.5px; color: #7A5C38; font-weight: 500;">
                          Items Subtotal (Sous-total articles)
                        </td>
                        <td align="right" style="padding-bottom: 8px; font-size: 13.5px; font-weight: 600; color: #141414;">
                          ${formattedSubtotal}
                        </td>
                      </tr>
                      ${
                        !isInternational
                          ? `
                            <tr>
                              <td align="left" style="padding-bottom: ${formattedDiscount ? "8px" : "12px"}; font-size: 12.5px; color: #7A5C38; font-weight: 500;">
                                Delivery Fee (Frais de livraison ZR Express)
                              </td>
                              <td align="right" style="padding-bottom: ${formattedDiscount ? "8px" : "12px"}; font-size: 13.5px; font-weight: 600; color: #141414;">
                                ${formattedShippingFee}
                              </td>
                            </tr>
                          `
                          : ""
                      }
                      ${formattedDiscount ? `
                        <tr>
                          <td align="left" style="padding-bottom: 12px; font-size: 12.5px; color: #236E39; font-weight: 600;">
                            Discount / Coupon (Remise)
                          </td>
                          <td align="right" style="padding-bottom: 12px; font-size: 13.5px; font-weight: 700; color: #236E39;">
                            -${formattedDiscount}
                          </td>
                        </tr>
                      ` : ""}
                      <tr>
                        <td colspan="2" style="border-top: 1px solid #EADBCE; padding-top: 12px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td align="left" style="font-family: Georgia, serif; font-size: 13.5px; font-weight: bold; color: #4A3520; text-transform: uppercase; letter-spacing: 1.5px;">
                                ${isInternational ? "TOTAL AMOUNT (TOTAL ARTICLES)" : "TOTAL AMOUNT DUE (TOTAL À PAYER)"}
                              </td>
                              <td align="right" style="font-family: -apple-system, sans-serif; font-size: 18px; font-weight: 800; color: #141414;">
                                ${formattedTotal}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Delivery Details Section -->
                ${deliveryDetailsHtml}

                <!-- Dedicated Support & Contact CTAs -->
                <tr>
                  <td style="padding: 0 40px 25px 40px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: #FDFBF7; border: 1px solid #EADBCE; border-radius: 12px; padding: 20px 24px; text-align: center;">
                      <tr>
                        <td>
                          <p style="font-family: Georgia, serif; font-size: 13px; font-weight: bold; color: #4A3520; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 6px 0;">
                            💬 CLIENT CONCIERGE & SUPPORT
                          </p>
                          <p style="font-size: 12px; color: #7A5C38; line-height: 1.6; margin: 0 0 16px 0;">
                            If you have questions about your delivery status, contact us directly:
                          </p>
                          <table align="center" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                            <tr>
                              <td style="padding: 4px 6px;">
                                <a href="https://wa.me/213772515448?text=${encodeURIComponent(`Hello, I would like an update on my shipment #${orderNumber} (${trackingNumber})`)}"
                                   style="display: inline-block; padding: 11px 22px; background: #25D366; color: #FFFFFF; text-decoration: none; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; border-radius: 6px; text-align: center;">
                                  💬 WhatsApp: +213 772 51 54 48
                                </a>
                              </td>
                              <td style="padding: 4px 6px;">
                                <a href="mailto:elhuyamcollection09@gmail.com?subject=${encodeURIComponent(`Shipment #${orderNumber} (${trackingNumber})`)}"
                                   style="display: inline-block; padding: 11px 22px; background: #141414; color: #FAF9F6; text-decoration: none; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; border-radius: 6px; text-align: center;">
                                  ✉️ Email: elhuyamcollection09@gmail.com
                                </a>
                              </td>
                            </tr>
                          </table>
                          <div style="margin-top: 14px;">
                            <a href="${appUrl}/orders/track?orderNumber=${orderNumber}"
                               style="display: inline-block; color: #141414; text-decoration: underline; font-size: 11.5px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">
                              TRACK YOUR SHIPMENT LIVE →
                            </a>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #FAF9F6; border-top: 1px solid #EBE4D8; padding: 30px 30px; text-align: center;">
                    <p style="font-family: Georgia, serif; font-style: italic; color: #7A5C38; font-size: 13.5px; margin: 0 0 10px 0;">
                      « Grace and elegance in modesty. »
                    </p>
                    <p style="color: #9E8C7A; font-size: 11.5px; line-height: 1.6; margin: 0 0 12px 0;">
                      If you have any questions, reach us directly on WhatsApp at <a href="https://wa.me/213772515448" style="color: #236E39; text-decoration: underline; font-weight: 600;">+213 772 51 54 48</a> or email <a href="mailto:elhuyamcollection09@gmail.com" style="color: #8A6538; text-decoration: underline; font-weight: 600;">elhuyamcollection09@gmail.com</a>.
                    </p>
                    <p style="color: #B8A99A; font-size: 10.5px; margin: 0;">
                      © ${new Date().getFullYear()} EL HUYAAM. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });
}
