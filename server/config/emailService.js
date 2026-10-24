import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// Compte Gmail expéditeur. En mode API Gmail, ce DOIT être le compte qui a
// autorisé l'application (celui du refresh token).
const smtpUser = process.env.EMAIL_USER || process.env.EMAIL;

// 🔀 Deux modes d'envoi :
//  1. API Gmail (HTTPS, port 443) : activée dès que les 3 variables GMAIL_*
//     existent. C'est le mode à utiliser sur Render gratuit, qui bloque SMTP.
//  2. SMTP (nodemailer) : mode historique, utilisé sinon (par exemple en local).
const gmailApiEnabled = Boolean(
  process.env.GMAIL_CLIENT_ID &&
    process.env.GMAIL_CLIENT_SECRET &&
    process.env.GMAIL_REFRESH_TOKEN,
);

// =====================================================================
// MODE 1 : API Gmail
// =====================================================================

// Nodemailer sert uniquement à FABRIQUER le message (en-têtes, UTF-8, HTML,
// texte alternatif). Il ne se connecte à rien : c'est l'API Gmail qui envoie.
const mimeBuilder = nodemailer.createTransport({
  streamTransport: true,
  buffer: true,
  newline: "unix",
});

// Le jeton d'accès Google dure environ 1 h : on le garde en mémoire.
let cachedToken = null; // { value, expiresAt }

const getAccessToken = async () => {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.value;
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GMAIL_CLIENT_ID,
      client_secret: process.env.GMAIL_CLIENT_SECRET,
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
    signal: AbortSignal.timeout(15000),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) {
    const hint =
      data.error === "invalid_grant"
        ? " (refresh token expiré ou révoqué : il faut en générer un nouveau)"
        : "";
    throw new Error(
      `Jeton Gmail refusé (${response.status}) : ${
        data.error_description || data.error || "réponse invalide"
      }${hint}`,
    );
  }

  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (Number(data.expires_in) || 3600) * 1000,
  };
  return cachedToken.value;
};

const sendViaGmailApi = async (mailOptions) => {
  const { message } = await mimeBuilder.sendMail(mailOptions);
  const raw = message.toString("base64url");

  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${await getAccessToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
      signal: AbortSignal.timeout(20000),
    },
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) cachedToken = null; // forcera un nouveau jeton
    throw new Error(
      `API Gmail ${response.status} : ${data?.error?.message || "échec de l'envoi"}`,
    );
  }
  return data.id;
};

// =====================================================================
// MODE 2 : SMTP (créé seulement si l'API Gmail n'est pas configurée)
// =====================================================================

let transporter = null;

if (!gmailApiEnabled) {
  const smtpPort = Number(process.env.EMAIL_PORT) || 465;

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: process.env.EMAIL_PASS,
    },
    // Échouer vite au lieu d'attendre indéfiniment
    connectionTimeout: 10000, // 10 s pour établir la connexion
    greetingTimeout: 10000, // 10 s pour la réponse du serveur SMTP
    socketTimeout: 20000, // 20 s d'inactivité maximum
  });

  // Vérifie la config SMTP au démarrage du serveur (visible dans les logs)
  transporter.verify((error) => {
    if (error) {
      console.error("❌ SMTP non utilisable:", error.message);
    } else {
      console.log("✅ SMTP prêt à envoyer des emails");
    }
  });
} else {
  console.log("📨 Envoi des e-mails via l'API Gmail (HTTPS)");
}

// =====================================================================
// Fonction publique (signature et valeur de retour inchangées)
// =====================================================================

async function sendEmail(to, subject, text, html, fromName, replyTo) {
  const mailOptions = {
    from: fromName ? { name: fromName, address: smtpUser } : smtpUser,
    ...(replyTo ? { replyTo } : {}),
    to,
    subject,
    text,
    html,
  };

  try {
    if (gmailApiEnabled) {
      const messageId = await sendViaGmailApi(mailOptions);
      console.log(`📧 Email envoyé à ${to} via API Gmail (ID: ${messageId})`);
      return { success: true, messageId };
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email envoyé à ${to} (ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Erreur dans l’envoi de l’email:", error);
    return { success: false, error: error.message };
  }
}

export { sendEmail };