import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: EmailOptions) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "EL HUYAAM <noreply@elhuyaam.com>",
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
  items: { productTitle: string; quantity: number; price: number }[]
) {
  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #E8D5B7; color: #4A3520;">${item.productTitle}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #E8D5B7; color: #4A3520; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #E8D5B7; color: #4A3520; text-align: right;">${new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD" }).format(item.price)}</td>
      </tr>
    `
    )
    .join("");

  await sendEmail({
    to: email,
    subject: `Order Confirmed — ${orderNumber}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #FAF9F6; padding: 40px;">
        <h1 style="font-size: 28px; letter-spacing: 4px; color: #1A1A1A; text-align: center;">EL HUYAAM</h1>
        <hr style="border: 1px solid #E8D5B7; margin: 20px 0;" />
        <h2 style="color: #4A3520;">Order Confirmed ✦</h2>
        <p style="color: #7A5C38; line-height: 1.8;">Dear ${name}, thank you for your order. We will begin preparing it with care.</p>
        <p style="color: #9A7A52; font-size: 13px; letter-spacing: 2px;">ORDER: ${orderNumber}</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
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
              <td style="padding-top: 16px; font-weight: bold; color: #1A1A1A; text-align: right;">${new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD" }).format(totalAmount)}</td>
            </tr>
          </tfoot>
        </table>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/account/orders/${orderNumber}"
           style="display: inline-block; margin-top: 32px; padding: 14px 32px; background: #1A1A1A; color: #FAF9F6;
                  text-decoration: none; letter-spacing: 2px; font-size: 13px;">
          TRACK ORDER
        </a>
      </div>
    `,
  });
}
