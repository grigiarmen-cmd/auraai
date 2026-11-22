// Email verification & authentication service using Gmail SMTP
const nodemailer = require('nodemailer');

require('dotenv').config();

const GMAIL_USER = process.env.GMAIL_USER || 'grizzlygoegym@gmail.com';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || 'fltv fkob ogai ynlt';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD.replace(/\s+/g, '')
  }
});

// In-memory verification storage (email -> { code, expiresAt, profile })
const verificationStore = new Map();

// Generate 6-digit pin code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmail(recipientEmail, code) {
  const mailOptions = {
    from: `"Aura AI Medical & Nutrition" <${GMAIL_USER}>`,
    to: recipientEmail,
    subject: `Dein Aura AI Verifizierungscode: ${code}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0c0c0e; color: #ffffff; padding: 40px 20px; border-radius: 16px; max-width: 500px; margin: auto;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #6366f1; font-size: 26px; margin: 0; text-transform: uppercase; letter-spacing: 2px;">AURA AI</h1>
          <p style="color: #9ca3af; font-size: 13px; margin-top: 6px;">Medical Intelligence & Ancestral Nutrition</p>
        </div>
        
        <div style="background-color: #17181e; border: 1px solid #27272a; padding: 24px; border-radius: 12px; text-align: center;">
          <p style="font-size: 14px; color: #d1d5db; margin-bottom: 16px;">Verwende folgenden 6-stelligen Sicherheitscode, um dein Profil zu aktivieren:</p>
          <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #fbbf24; background-color: #0c0c0e; padding: 16px; border-radius: 8px; display: inline-block; font-family: monospace;">
            ${code}
          </div>
          <p style="font-size: 11px; color: #6b7280; margin-top: 16px;">Dieser Code ist für 15 Minuten gültig. Gib ihn niemals an Dritte weiter.</p>
        </div>
        
        <div style="text-align: center; margin-top: 24px; font-size: 11px; color: #4b5563;">
          Aura AI — Next-Gen Biohacking & Diagnostics
        </div>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}

module.exports = {
  verificationStore,
  generateVerificationCode,
  sendVerificationEmail
};
