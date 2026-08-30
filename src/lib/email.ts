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

export async function sendWelcomeEmail(name: string, email: string) {
  await sendEmail({
    to: email,
    subject: "Welcome to EL HUYAAM ✦",
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #FAF9F6; padding: 40px;">
        <h1 style="font-size: 28px; letter-spacing: 4px; color: #1A1A1A; text-align: center;">EL HUYAM</h1>
        <hr style="border: 1px solid #E8D5B7; margin: 20px 0;" />
        <h2 style="color: #4A3520; font-size: 20px;">Welcome, ${name}</h2>
        <p style="color: #7A5C38; line-height: 1.8;">
          Thank you for joining the EL HUYAAM family. Your account has been created and you are now part of a community
          that celebrates elegance, modesty, and grace.
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/shop"
           style="display: inline-block; margin-top: 24px; padding: 14px 32px; background: #1A1A1A; color: #FAF9F6;
                  text-decoration: none; letter-spacing: 2px; font-size: 13px;">
          EXPLORE COLLECTION
        </a>
        <p style="margin-top: 40px; color: #B8A99A; font-size: 12px; text-align: center;">
          © ${new Date().getFullYear()} EL HUYAM. All rights reserved.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(name: string, email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`;
  await sendEmail({
    to: email,
    subject: "Reset your EL HUYAAM password",
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #FAF9F6; padding: 40px;">
        <h1 style="font-size: 28px; letter-spacing: 4px; color: #1A1A1A; text-align: center;">EL HUYAAM</h1>
        <hr style="border: 1px solid #E8D5B7; margin: 20px 0;" />
        <h2 style="color: #4A3520; font-size: 20px;">Password Reset Request</h2>
        <p style="color: #7A5C38; line-height: 1.8;">
          Hello ${name}, we received a request to reset your password.
          This link will expire in 1 hour.
        </p>
        <a href="${resetUrl}"
           style="display: inline-block; margin-top: 24px; padding: 14px 32px; background: #1A1A1A; color: #FAF9F6;
                  text-decoration: none; letter-spacing: 2px; font-size: 13px;">
          RESET PASSWORD
        </a>
        <p style="margin-top: 24px; color: #B8A99A; font-size: 12px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendOrderConfirmationEmail(
  email: string,
  name: string,
  orderNumber: string,
  totalAmount: number,
  isInternational: boolean,
  items: { productTitle: string; quantity: number; price: number }[]
) {
  const currency = isInternational ? "EUR" : "DZD";
  const locale = isInternational ? "fr-FR" : "fr-DZ";

  const formattedTotal = new Intl.NumberFormat(locale === "fr-FR" ? "en-US" : "fr-DZ", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(totalAmount).replace(/[\u00a0\u202f]/g, " ");

  const itemsHtml = items
    .map(
      (item) => {
        const formattedPrice = new Intl.NumberFormat(locale === "fr-FR" ? "en-US" : "fr-DZ", {
          style: "currency",
          currency: currency,
          minimumFractionDigits: 2,
        }).format(item.price).replace(/[\u00a0\u202f]/g, " ");

        return `
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #E8D5B7; color: #4A3520;">${item.productTitle}</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #E8D5B7; color: #4A3520; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #E8D5B7; color: #4A3520; text-align: right;">${formattedPrice}</td>
          </tr>
        `;
      }
    )
    .join("");

  await sendEmail({
    to: email,
    subject: `Order Confirmed — ${orderNumber}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #FAF9F6; padding: 40px; border: 1px solid #E8D5B7; font-size: 14px;">
        <h1 style="font-size: 28px; letter-spacing: 4px; color: #1A1A1A; text-align: center; text-transform: uppercase; margin: 0 0 10px 0;">EL HUYAAM</h1>
        <hr style="border: 1px solid #E8D5B7; margin: 20px 0;" />
        <h2 style="color: #4A3520; text-align: center; font-size: 20px; margin: 0 0 15px 0;">Order Confirmed ✦</h2>
        <p style="color: #7A5C38; line-height: 1.8;">Dear ${name}, thank you for your order. We will begin preparing it with care.</p>
        <p style="color: #9A7A52; font-size: 13px; letter-spacing: 2px; font-weight: bold; margin: 15px 0 5px 0;">ORDER: ${orderNumber}</p>
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
              <td colspan="2" style="padding-top: 16px; font-weight: bold; color: #1A1A1A;">TOTAL</td>
              <td style="padding-top: 16px; font-weight: bold; color: #1A1A1A; text-align: right;">${formattedTotal}</td>
            </tr>
          </tfoot>
        </table>
        <div style="text-align: center; margin-top: 32px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/account/orders/${orderNumber}"
             style="display: inline-block; padding: 14px 32px; background: #1A1A1A; color: #FAF9F6;
                    text-decoration: none; letter-spacing: 2px; font-size: 13px; font-weight: bold;">
            TRACK ORDER
          </a>
        </div>
      </div>
    `,
  });
}

export async function sendOrderShippedEmail(
  email: string,
  name: string,
  orderNumber: string,
  trackingNumber: string,
  totalAmount: number,
  isInternational: boolean,
  items: { productTitle: string; quantity: number; price: number }[]
) {
  const currency = isInternational ? "EUR" : "DZD";
  const locale = isInternational ? "fr-FR" : "fr-DZ";
  
  const formattedTotal = new Intl.NumberFormat(locale === "fr-FR" ? "en-US" : "fr-DZ", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(totalAmount).replace(/[\u00a0\u202f]/g, " ");

  const itemsHtml = items
    .map(
      (item) => {
        const formattedPrice = new Intl.NumberFormat(locale === "fr-FR" ? "en-US" : "fr-DZ", {
          style: "currency",
          currency: currency,
          minimumFractionDigits: 2,
        }).format(item.price).replace(/[\u00a0\u202f]/g, " ");

        return `
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #E8D5B7; color: #4A3520;">${item.productTitle}</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #E8D5B7; color: #4A3520; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #E8D5B7; color: #4A3520; text-align: right;">${formattedPrice}</td>
          </tr>
        `;
      }
    )
    .join("");

  await sendEmail({
    to: email,
    subject: `Your order has been handed over to the shipping company — ${orderNumber}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #FAF9F6; padding: 40px; border: 1px solid #E8D5B7;">
        <h1 style="font-size: 28px; letter-spacing: 4px; color: #1A1A1A; text-align: center; text-transform: uppercase;">EL HUYAAM</h1>
        <hr style="border: 1px solid #E8D5B7; margin: 20px 0;" />
        <h2 style="color: #4A3520; text-align: center; font-size: 22px;">Your Order is with the Courier! 🚚</h2>
        <p style="color: #7A5C38; line-height: 1.8; text-align: center; font-size: 14px;">
          Dear ${name}, we are pleased to inform you that your package has been successfully handed over to the delivery company.
        </p>
        
        <div style="background: rgba(232, 213, 183, 0.1); border: 1px dashed #E8D5B7; padding: 15px; margin: 25px 0; text-align: center; border-radius: 4px;">
          <p style="color: #4A3520; font-size: 12px; font-weight: bold; text-transform: uppercase; margin: 0 0 5px 0;">Tracking Number</p>
          <p style="color: #1A1A1A; font-family: monospace; font-size: 18px; font-weight: bold; margin: 0;">${trackingNumber}</p>
        </div>

        <p style="color: #9A7A52; font-size: 13px; letter-spacing: 2px; font-weight: bold; margin-top: 30px;">ORDER SUMMARY: ${orderNumber}</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 15px;">
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
              <td colspan="2" style="padding-top: 16px; font-weight: bold; color: #1A1A1A;">TOTAL AMOUNT</td>
              <td style="padding-top: 16px; font-weight: bold; color: #1A1A1A; text-align: right;">${formattedTotal}</td>
            </tr>
          </tfoot>
        </table>

        <div style="text-align: center; margin-top: 35px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/track?orderNumber=${orderNumber}&phone=${trackingNumber}"
             style="display: inline-block; padding: 14px 32px; background: #1A1A1A; color: #FAF9F6;
                    text-decoration: none; letter-spacing: 2px; font-size: 13px; font-weight: bold; margin-bottom: 15px;">
            TRACK YOUR SHIPMENT
          </a>
          <br />
          <a href="https://wa.me/213772515448"
             style="display: inline-block; padding: 12px 28px; background: #25D366; color: #FFFFFF;
                    text-decoration: none; letter-spacing: 1px; font-size: 13px; font-weight: bold; border-radius: 4px;">
            💬 CHAT ON WHATSAPP (+213 772 51 54 48)
          </a>
        </div>
        
        <p style="margin-top: 40px; color: #B8A99A; font-size: 12px; text-align: center;">
          Thank you for choosing elegance and modesty.<br />
          If you have any questions, reply directly to this email or contact us at <a href="mailto:elhuyamcollection09@gmail.com" style="color: #9A7A52; text-decoration: underline;">elhuyamcollection09@gmail.com</a>.
        </p>
      </div>
    `,
  });
}
