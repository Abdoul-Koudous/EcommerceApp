import nodemailer from "nodemailer";

// ✅ Configure via .env : EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS
// Pour Gmail : EMAIL_HOST=smtp.gmail.com, EMAIL_PORT=465,
// EMAIL_USER=ton-adresse@gmail.com, EMAIL_PASS=un "mot de passe d'application" Google
// (pas ton mot de passe normal — à générer dans les paramètres de sécurité Google)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});



// ✅ Construit un joli corps HTML avec le texte + aperçus images/liens vidéo
const isImage = (url) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
const isVideo = (url) => /\.(mp4|mov|webm|avi)$/i.test(url);

// ✅ Construit l'URL d'une miniature (frame extraite) à partir d'une URL vidéo Cloudinary
const getVideoThumbnail = (videoUrl) => {
  // Cloudinary : remplace l'extension par .jpg et insère so_1 (seconde 1) pour capturer une frame
  return videoUrl
    .replace("/upload/", "/upload/so_1,w_600,h_400,c_fill/")
    .replace(/\.(mp4|mov|webm|avi)$/i, ".jpg");
};

const buildHtmlBody = (text, attachments = []) => {
  const paragraph = text
    ? `<p style="font-size:15px;line-height:1.6;color:#222;white-space:pre-wrap;">${text}</p>`
    : "";

  const mediaBlocks = attachments
    .map((url) => {
      if (isImage(url)) {
        // ✅ image cliquable → ouvre l'image en taille réelle dans un nouvel onglet
        return `
          <a href="${url}" target="_blank" style="display:block;margin:10px 0;">
            <img src="${url}" alt="pièce jointe" style="max-width:100%;border-radius:8px;display:block;" />
          </a>
        `;
      }
      if (isVideo(url)) {
  const thumbnail = getVideoThumbnail(url);
  return `
    <a href="${url}" target="_blank" style="text-decoration:none;display:block;margin:10px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-image:url('${thumbnail}');background-size:cover;background-position:center;border-radius:8px;">
        <tr>
          <td align="center" valign="middle" style="height:300px;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:64px;height:64px;background-color:rgba(0,0,0,0.65);border-radius:50%;text-align:center;vertical-align:middle;font-size:0;">
                  <div style="display:inline-block;width:0;height:0;border-top:14px solid transparent;border-bottom:14px solid transparent;border-left:22px solid #ffffff;margin-left:6px;"></div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </a>
  `;
}
      return `<p style="margin:10px 0;"><a href="${url}" target="_blank" style="color:#820b0b;font-weight:600;">📎 Voir le fichier joint</a></p>`;
    })
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      ${paragraph}
      ${mediaBlocks}
      <hr style="margin-top:24px;border:none;border-top:1px solid #eee;" />
      <p style="font-size:12px;color:#999;">Cette réponse vous a été envoyée depuis YebouShop.</p>
    </div>
  `;
};

export const sendReplyEmail = async ({ to, subject, text, attachments = [] }) => {
  const html = buildHtmlBody(text, attachments);

  return transporter.sendMail({
    from: `"YebouShop" <${process.env.EMAIL_USER}>`,
    to,
    subject: subject ? `Re: ${subject}` : "Réponse à votre message",
    html,
  });
};

// 📁 utils/mail.js — buildOrderReceiptHtml remplacé par une version courte

const buildOrderReceiptHtml = (order) => {
  const receiptUrl = `${process.env.CLIENT_URL}/account/orders/${order.orderId}`;

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#222;margin-bottom:4px;">Merci pour votre commande !</h2>
      <p style="font-size:14px;color:#555;">
        Votre commande <strong>${order.orderId}</strong> d'un montant de
        <strong>${(order.totalAmt || 0).toLocaleString()} FCFA</strong> a bien été enregistrée.
      </p>
      <p style="text-align:center;margin:28px 0;">
        <a href="${receiptUrl}" target="_blank"
           style="background:#820b0b;color:#fff;padding:12px 24px;border-radius:6px;
                  text-decoration:none;font-weight:600;display:inline-block;">
          Voir mon reçu complet
        </a>
      </p>
      <hr style="margin-top:24px;border:none;border-top:1px solid #eee;" />
      <p style="font-size:12px;color:#999;">Cette confirmation vous a été envoyée depuis YebouShop.</p>
    </div>
  `;
};

export const sendOrderReceiptEmail = async (order, userEmail) => {
  const html = buildOrderReceiptHtml(order);

  return transporter.sendMail({
    from: `"YebouShop" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: `Confirmation de votre commande ${order.orderId}`,
    html,
  });
};