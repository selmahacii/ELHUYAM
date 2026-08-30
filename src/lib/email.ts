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

// ─── 1. Welcome Email (Haute Couture) ─────────────────────────────────────────
export async function sendWelcomeEmail(name: string, email: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.elhuyam.com";
  await sendEmail({
    to: email,
    subject: "Bienvenue dans l'univers EL HUYAAM ✦",
    html: `
      <!DOCTYPE html>
      <html lang="fr">
      <head><meta charset="utf-8"><title>Bienvenue chez EL HUYAAM</title></head>
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
                    <p style="font-size: 10px; letter-spacing: 3.5px; color: #9A7A52; text-transform: uppercase; margin: 6px 0 0 0; font-weight: 600;">HAUTE COUTURE MODESTE</p>
                    <div style="margin: 18px auto 0 auto; color: #C5A880; font-size: 13px;">✦ ✦ ✦</div>
                  </td>
                </tr>
                <!-- Welcome Content -->
                <tr>
                  <td style="padding: 10px 40px 30px 40px; text-align: center;">
                    <div style="display: inline-block; background: #FAF5EE; border: 1px solid #E3D5C1; color: #8A6538; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; padding: 6px 16px; border-radius: 20px; margin-bottom: 20px;">
                      ✦ BIENVENUE DANS LA MAISON ✦
                    </div>
                    <h2 style="font-family: Georgia, serif; color: #2B2118; font-size: 22px; margin: 0 0 16px 0; font-weight: normal;">Chère ${name},</h2>
                    <p style="color: #6B5744; font-size: 14.5px; line-height: 1.8; margin: 0 0 24px 0;">
                      C&apos;est avec un immense privilège que nous vous accueillons au sein de la communauté <strong>EL HUYAAM</strong>. 
                      Notre maison célèbre l&apos;élégance intemporelle, la grâce et le raffinement de la modest fashion à travers des créations aux étoffes d&apos;exception.
                    </p>
                    <a href="${appUrl}/shop"
                       style="display: inline-block; padding: 15px 36px; background: #141414; color: #FAF9F6; text-decoration: none; letter-spacing: 2px; font-size: 12px; font-weight: bold; text-transform: uppercase; border-radius: 6px;">
                      DÉCOUVRIR LA NOUVELLE COLLECTION →
                    </a>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color: #FAF9F6; border-top: 1px solid #EBE4D8; padding: 25px 30px; text-align: center;">
                    <p style="font-family: Georgia, serif; font-style: italic; color: #8C7355; font-size: 13px; margin: 0 0 8px 0;">« La grâce et l&apos;élégance dans la modestie. »</p>
                    <p style="color: #A39281; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} EL HUYAAM. Tous droits réservés.</p>
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

// ─── 2. Password Reset Email ──────────────────────────────────────────────────
export async function sendPasswordResetEmail(name: string, email: string, token: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.elhuyam.com";
  const resetUrl = `${appUrl}/auth/reset-password?token=${token}`;
  await sendEmail({
    to: email,
    subject: "Réinitialisation de votre mot de passe — EL HUYAAM",
    html: `
      <!DOCTYPE html>
      <html lang="fr">
      <head><meta charset="utf-8"><title>Réinitialisation du mot de passe</title></head>
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
                    <p style="font-size: 10px; letter-spacing: 3.5px; color: #9A7A52; text-transform: uppercase; margin: 6px 0 0 0; font-weight: 600;">HAUTE COUTURE MODESTE</p>
                    <div style="margin: 18px auto 0 auto; color: #C5A880; font-size: 13px;">✦ ✦ ✦</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 40px 35px 40px; text-align: center;">
                    <h2 style="font-family: Georgia, serif; color: #2B2118; font-size: 20px; margin: 0 0 16px 0; font-weight: normal;">Réinitialisation de votre mot de passe</h2>
                    <p style="color: #6B5744; font-size: 14.5px; line-height: 1.8; margin: 0 0 24px 0;">
                      Bonjour ${name}, nous avons reçu une demande de réinitialisation du mot de passe associé à votre compte. 
                      Ce lien sécurisé expirera dans 1 heure.
                    </p>
                    <a href="${resetUrl}"
                       style="display: inline-block; padding: 14px 34px; background: #141414; color: #FAF9F6; text-decoration: none; letter-spacing: 2px; font-size: 12px; font-weight: bold; text-transform: uppercase; border-radius: 6px;">
                      RÉINITIALISER MON MOT DE PASSE →
                    </a>
                    <p style="color: #A39281; font-size: 12px; margin-top: 30px; line-height: 1.6;">
                      Si vous n&apos;êtes pas à l&apos;origine de cette demande, vous pouvez ignorer cet e-mail en toute sérénité.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #FAF9F6; border-top: 1px solid #EBE4D8; padding: 20px 30px; text-align: center;">
                    <p style="color: #A39281; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} EL HUYAAM. Tous droits réservés.</p>
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

// ─── 3. Order Confirmation Email (Haute Couture Luxury) ──────────────────────
export async function sendOrderConfirmationEmail(
  email: string,
  name: string,
  orderNumber: string,
  totalAmount: number,
  isInternational: boolean,
  items: { productTitle: string; quantity: number; price: number; size?: string | null; color?: string | null }[]
) {
  const currency = isInternational ? "EUR" : "DZD";
  const locale = isInternational ? "fr-FR" : "fr-DZ";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.elhuyam.com";

  const formattedTotal = new Intl.NumberFormat(locale === "fr-FR" ? "en-US" : "fr-DZ", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(totalAmount).replace(/[\u00a0\u202f]/g, " ");

  const itemsHtml = items
    .map((item) => {
      const formattedPrice = new Intl.NumberFormat(locale === "fr-FR" ? "en-US" : "fr-DZ", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 2,
      }).format(item.price).replace(/[\u00a0\u202f]/g, " ");

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

  await sendEmail({
    to: email,
    subject: `Commande Confirmée #${orderNumber} ✦ EL HUYAAM`,
    html: `
      <!DOCTYPE html>
      <html lang="fr">
      <head><meta charset="utf-8"><title>Commande Confirmée — EL HUYAAM</title></head>
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
                    <p style="font-size: 10.5px; letter-spacing: 4px; color: #9A7A52; text-transform: uppercase; margin: 6px 0 0 0; font-weight: 600;">HAUTE COUTURE MODESTE</p>
                    <div style="margin: 18px auto 0 auto; color: #C5A880; font-size: 13px;">✦ ✦ ✦</div>
                  </td>
                </tr>

                <!-- Status Badge & Personalized Greeting -->
                <tr>
                  <td style="padding: 15px 40px 25px 40px; text-align: center;">
                    <div style="display: inline-block; background: #FAF5EE; border: 1px solid #E3D5C1; color: #8A6538; font-size: 11px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; padding: 7px 18px; border-radius: 24px; margin-bottom: 20px;">
                      ✦ COMMANDE CONFIRMÉE ✦
                    </div>
                    <h2 style="font-family: Georgia, serif; color: #2B2118; font-size: 23px; margin: 0 0 14px 0; font-weight: normal;">Chère ${name},</h2>
                    <p style="color: #6B5744; font-size: 14.5px; line-height: 1.85; margin: 0;">
                      Nous avons le grand plaisir de vous confirmer la bonne réception de votre commande. 
                      Nos artisans et couturières préparent dès à présent vos créations avec tout le soin, la délicatesse et le savoir-faire qui caractérisent la maison <strong>EL HUYAAM</strong>.
                    </p>
                  </td>
                </tr>

                <!-- Order Reference Card -->
                <tr>
                  <td style="padding: 0 40px 25px 40px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: #FDFBF7; border: 1px dashed #E2D3BE; border-radius: 12px; padding: 16px 20px;">
                      <tr>
                        <td align="left" style="font-size: 11px; color: #8C7355; text-transform: uppercase; font-weight: 700; letter-spacing: 1.5px;">
                          RÉFÉRENCE COMMANDE : <span style="font-family: monospace; font-size: 14px; color: #141414; font-weight: bold; letter-spacing: 1px;">#${orderNumber}</span>
                        </td>
                        <td align="right" style="font-size: 11px; color: #357A38; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                          ✓ EN PRÉPARATION
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
                          <th align="left" style="padding: 10px 0; border-bottom: 2px solid #141414; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: #141414; text-transform: uppercase;">CRÉATION</th>
                          <th align="center" style="padding: 10px 0; border-bottom: 2px solid #141414; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: #141414; text-transform: uppercase;">QTÉ</th>
                          <th align="right" style="padding: 10px 0; border-bottom: 2px solid #141414; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: #141414; text-transform: uppercase;">PRIX</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsHtml}
                      </tbody>
                    </table>
                  </td>
                </tr>

                <!-- Total Summary Highlight Box -->
                <tr>
                  <td style="padding: 0 40px 30px 40px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: #FAF7F2; border: 1px solid #E8D5B7; border-radius: 12px; padding: 18px 24px;">
                      <tr>
                        <td align="left" style="font-family: Georgia, serif; font-size: 14px; font-weight: bold; color: #4A3520; text-transform: uppercase; letter-spacing: 1.5px;">
                          MONTANT TOTAL
                        </td>
                        <td align="right" style="font-family: -apple-system, sans-serif; font-size: 19px; font-weight: 800; color: #141414; letter-spacing: 0.5px;">
                          ${formattedTotal}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Dual Action CTAs -->
                <tr>
                  <td align="center" style="padding: 0 40px 35px 40px;">
                    <a href="${appUrl}/account/orders/${orderNumber}"
                       style="display: block; width: 85%; max-width: 380px; padding: 15px 0; background: #141414; color: #FAF9F6; text-decoration: none; letter-spacing: 2px; font-size: 12px; font-weight: bold; text-transform: uppercase; border-radius: 6px; text-align: center; margin-bottom: 12px; box-shadow: 0 3px 10px rgba(0,0,0,0.12);">
                      SUIVRE MA COMMANDE EN DIRECT →
                    </a>
                    <a href="https://wa.me/213772515448?text=${encodeURIComponent(`Bonjour, j'ai une question concernant ma commande #${orderNumber}`)}"
                       style="display: inline-block; padding: 10px 24px; background: #25D366; color: #FFFFFF; text-decoration: none; font-size: 11.5px; font-weight: 700; letter-spacing: 0.5px; border-radius: 6px; text-align: center;">
                      💬 Conseillère Privée sur WhatsApp (+213 772 51 54 48)
                    </a>
                  </td>
                </tr>

                <!-- 3 Luxury Reassurance Badges -->
                <tr>
                  <td style="background-color: #FDFBF7; border-top: 1px solid #EBE4D8; border-bottom: 1px solid #EBE4D8; padding: 22px 25px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="text-align: center;">
                      <tr>
                        <td width="33%" style="padding: 0 6px;">
                          <div style="font-size: 14px; margin-bottom: 4px;">✦</div>
                          <div style="font-size: 10.5px; font-weight: 700; color: #3D2F24; text-transform: uppercase; letter-spacing: 0.5px;">Confection Noble</div>
                          <div style="font-size: 9.5px; color: #8C7355; margin-top: 2px;">Tissus et coupes d&apos;exception</div>
                        </td>
                        <td width="33%" style="padding: 0 6px; border-left: 1px solid #EADBCE; border-right: 1px solid #EADBCE;">
                          <div style="font-size: 14px; margin-bottom: 4px;">🚚</div>
                          <div style="font-size: 10.5px; font-weight: 700; color: #3D2F24; text-transform: uppercase; letter-spacing: 0.5px;">58 Wilayas & Monde</div>
                          <div style="font-size: 9.5px; color: #8C7355; margin-top: 2px;">Livraison rapide et suivie</div>
                        </td>
                        <td width="33%" style="padding: 0 6px;">
                          <div style="font-size: 14px; margin-bottom: 4px;">🤍</div>
                          <div style="font-size: 10.5px; font-weight: 700; color: #3D2F24; text-transform: uppercase; letter-spacing: 0.5px;">Service Privilège</div>
                          <div style="font-size: 9.5px; color: #8C7355; margin-top: 2px;">À votre écoute 7j/7</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Signature & Footer -->
                <tr>
                  <td style="background-color: #FAF9F6; padding: 30px 30px; text-align: center;">
                    <p style="font-family: Georgia, serif; font-style: italic; color: #7A5C38; font-size: 13.5px; margin: 0 0 10px 0;">
                      « La grâce et l&apos;élégance dans la modestie. »
                    </p>
                    <p style="color: #9E8C7A; font-size: 11.5px; line-height: 1.6; margin: 0 0 12px 0;">
                      Une question ? Écrivez-nous directement à <a href="mailto:elhuyamcollection09@gmail.com" style="color: #8A6538; text-decoration: underline; font-weight: 600;">elhuyamcollection09@gmail.com</a>.
                    </p>
                    <p style="color: #B8A99A; font-size: 10.5px; margin: 0;">
                      © ${new Date().getFullYear()} EL HUYAAM. Tous droits réservés.
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

// ─── 4. Order Shipped Email (Haute Couture Luxury) ────────────────────────────
export async function sendOrderShippedEmail(
  email: string,
  name: string,
  orderNumber: string,
  trackingNumber: string,
  totalAmount: number,
  isInternational: boolean,
  items: { productTitle: string; quantity: number; price: number; size?: string | null; color?: string | null }[]
) {
  const currency = isInternational ? "EUR" : "DZD";
  const locale = isInternational ? "fr-FR" : "fr-DZ";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.elhuyam.com";

  const formattedTotal = new Intl.NumberFormat(locale === "fr-FR" ? "en-US" : "fr-DZ", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(totalAmount).replace(/[\u00a0\u202f]/g, " ");

  const itemsHtml = items
    .map((item) => {
      const formattedPrice = new Intl.NumberFormat(locale === "fr-FR" ? "en-US" : "fr-DZ", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 2,
      }).format(item.price).replace(/[\u00a0\u202f]/g, " ");

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

  await sendEmail({
    to: email,
    subject: `Votre colis est en route ! 🚚 #${orderNumber} ✦ EL HUYAAM`,
    html: `
      <!DOCTYPE html>
      <html lang="fr">
      <head><meta charset="utf-8"><title>Votre commande est en route — EL HUYAAM</title></head>
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
                    <p style="font-size: 10.5px; letter-spacing: 4px; color: #9A7A52; text-transform: uppercase; margin: 6px 0 0 0; font-weight: 600;">HAUTE COUTURE MODESTE</p>
                    <div style="margin: 18px auto 0 auto; color: #C5A880; font-size: 13px;">✦ ✦ ✦</div>
                  </td>
                </tr>

                <!-- Status Badge & Greeting -->
                <tr>
                  <td style="padding: 15px 40px 20px 40px; text-align: center;">
                    <div style="display: inline-block; background: #EEF8F1; border: 1px solid #C4E8CD; color: #236E39; font-size: 11px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; padding: 7px 18px; border-radius: 24px; margin-bottom: 20px;">
                      🚚 COLIS EXPÉDIÉ & REMIS AU LIVREUR
                    </div>
                    <h2 style="font-family: Georgia, serif; color: #2B2118; font-size: 23px; margin: 0 0 14px 0; font-weight: normal;">Chère ${name},</h2>
                    <p style="color: #6B5744; font-size: 14.5px; line-height: 1.85; margin: 0;">
                      Excellente nouvelle ! Votre précieux colis a été soigneusement emballé et confié à notre transporteur partenaire (<strong>ZR Express</strong>). Il est en cours d&apos;acheminement vers votre adresse.
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
                            NUMÉRO DE SUIVI DU COLIS
                          </p>
                          <p style="font-family: monospace; font-size: 20px; font-weight: 800; color: #141414; letter-spacing: 2px; margin: 0 0 8px 0;">
                            ${trackingNumber}
                          </p>
                          <p style="font-size: 11.5px; color: #7A5C38; margin: 0;">
                            Transporteur : <strong>ZR Express</strong> • Livraison suivie à domicile / bureau
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Product Items Table -->
                <tr>
                  <td style="padding: 0 40px 20px 40px;">
                    <p style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: #9A7A52; text-transform: uppercase; margin: 0 0 10px 0;">RÉCAPITULATIF DE LA COMMANDE #${orderNumber}</p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                      <thead>
                        <tr>
                          <th align="left" style="padding: 10px 0; border-bottom: 2px solid #141414; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: #141414; text-transform: uppercase;">CRÉATION</th>
                          <th align="center" style="padding: 10px 0; border-bottom: 2px solid #141414; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: #141414; text-transform: uppercase;">QTÉ</th>
                          <th align="right" style="padding: 10px 0; border-bottom: 2px solid #141414; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: #141414; text-transform: uppercase;">PRIX</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsHtml}
                      </tbody>
                    </table>
                  </td>
                </tr>

                <!-- Total Amount Box -->
                <tr>
                  <td style="padding: 0 40px 30px 40px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: #FAF7F2; border: 1px solid #E8D5B7; border-radius: 12px; padding: 16px 24px;">
                      <tr>
                        <td align="left" style="font-family: Georgia, serif; font-size: 13.5px; font-weight: bold; color: #4A3520; text-transform: uppercase; letter-spacing: 1.5px;">
                          MONTANT TOTAL À RÉGLER
                        </td>
                        <td align="right" style="font-family: -apple-system, sans-serif; font-size: 18px; font-weight: 800; color: #141414;">
                          ${formattedTotal}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Dual Action CTAs -->
                <tr>
                  <td align="center" style="padding: 0 40px 35px 40px;">
                    <a href="${appUrl}/orders/track?orderNumber=${orderNumber}&phone=${trackingNumber}"
                       style="display: block; width: 85%; max-width: 380px; padding: 15px 0; background: #141414; color: #FAF9F6; text-decoration: none; letter-spacing: 2px; font-size: 12px; font-weight: bold; text-transform: uppercase; border-radius: 6px; text-align: center; margin-bottom: 12px; box-shadow: 0 3px 10px rgba(0,0,0,0.12);">
                      SUIVRE MON COLIS EN DIRECT →
                    </a>
                    <a href="https://wa.me/213772515448?text=${encodeURIComponent(`Bonjour, je souhaite des nouvelles de mon colis #${orderNumber} (${trackingNumber})`)}"
                       style="display: inline-block; padding: 10px 24px; background: #25D366; color: #FFFFFF; text-decoration: none; font-size: 11.5px; font-weight: 700; letter-spacing: 0.5px; border-radius: 6px; text-align: center;">
                      💬 Contacter le Service Client sur WhatsApp
                    </a>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #FAF9F6; border-top: 1px solid #EBE4D8; padding: 30px 30px; text-align: center;">
                    <p style="font-family: Georgia, serif; font-style: italic; color: #7A5C38; font-size: 13.5px; margin: 0 0 10px 0;">
                      « La grâce et l&apos;élégance dans la modestie. »
                    </p>
                    <p style="color: #9E8C7A; font-size: 11.5px; line-height: 1.6; margin: 0 0 12px 0;">
                      Si vous avez la moindre question, répondez directement à cet e-mail ou écrivez à <a href="mailto:elhuyamcollection09@gmail.com" style="color: #8A6538; text-decoration: underline; font-weight: 600;">elhuyamcollection09@gmail.com</a>.
                    </p>
                    <p style="color: #B8A99A; font-size: 10.5px; margin: 0;">
                      © ${new Date().getFullYear()} EL HUYAAM. Tous droits réservés.
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
