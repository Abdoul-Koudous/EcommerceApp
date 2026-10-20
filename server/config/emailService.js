import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
  // Échouer vite au lieu d'attendre indéfiniment
  connectionTimeout: 10000, // 10 s pour établir la connexion
  greetingTimeout: 10000,   // 10 s pour la réponse du serveur SMTP
  socketTimeout: 20000,     // 20 s d'inactivité maximum
});

// Vérifie la config SMTP au démarrage du serveur (visible dans les logs)
transporter.verify((error) => {
  if (error) {
    console.error('❌ SMTP non utilisable:', error.message);
  } else {
    console.log('✅ SMTP prêt à envoyer des emails');
  }
});

async function sendEmail(to, subject, text, html, fromName, replyTo) {
  try {
    const info = await transporter.sendMail({
      from: fromName
        ? { name: fromName, address: process.env.EMAIL }
        : process.env.EMAIL,
      ...(replyTo ? { replyTo } : {}),
      to,
      subject,
      text,
      html,
    });
    console.log(`📧 Email envoyé à ${to} (ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur dans l’envoi de l’email:', error);
    return { success: false, error: error.message };
  }
}

export { sendEmail };