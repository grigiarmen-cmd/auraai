const crypto = require('crypto');
const nodemailer = require('nodemailer');

require('dotenv').config();

const GMAIL_USER = process.env.GMAIL_USER || '';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || '';
const AUTH_SECRET = process.env.AUTH_SECRET || process.env.NOTION_TOKEN || 'change_me_in_env';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD.replace(/\s+/g, '')
  }
});

// Create a signed 30-day session token
function createSessionToken(email) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const exp = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
  const payload = Buffer.from(JSON.stringify({ email: cleanEmail, exp })).toString('base64url');
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifySessionToken(token) {
  try {
    if (!token || !token.includes('.')) return null;
    const [payload, sig] = token.split('.');
    const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('base64url');
    if (sig !== expectedSig) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    if (!data.email || !data.exp || Date.now() > data.exp) return null;
    return data.email;
  } catch (e) {
    return null;
  }
}

// Deterministic 6-digit code generation based on email and 15-minute time window
function getCodeForWindow(email, windowOffset = 0) {
  const cleanEmail = (email || '').trim().toLowerCase();
  // 15-minute window timestamp
  const windowIndex = Math.floor(Date.now() / (15 * 60 * 1000)) + windowOffset;
  const hash = crypto.createHmac('sha256', AUTH_SECRET)
    .update(`${cleanEmail}:${windowIndex}`)
    .digest('hex');
  
  // Convert first 8 hex characters to a 6-digit integer
  const num = parseInt(hash.slice(0, 8), 16) % 900000 + 100000;
  return num.toString();
}

function verifyEmailCode(email, inputCode) {
  const code = (inputCode || '').trim();
  if (!code) return false;

  // Check current window and previous window (to allow codes sent up to 15-30 min ago)
  const currentWindowCode = getCodeForWindow(email, 0);
  const prevWindowCode = getCodeForWindow(email, -1);

  return code === currentWindowCode || code === prevWindowCode;
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
          <p style="font-size: 11px; color: #6b7280; margin-top: 16px;">Dieser Code ist für 15-30 Minuten gültig. Gib ihn niemals an Dritte weiter.</p>
        </div>
        
        <div style="text-align: center; margin-top: 24px; font-size: 11px; color: #4b5563;">
          Aura AI — Next-Gen Biohacking & Diagnostics
        </div>
      </div>
    `
  };

  return await transporter.sendMail(mailOptions);
}

module.exports = {
  getCodeForWindow,
  verifyEmailCode,
  sendVerificationEmail,
  createSessionToken,
  verifySessionToken
};
