const { verificationStore, generateVerificationCode, sendVerificationEmail } = require('../../src/services/authService');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body || {};
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Gültige E-Mail erforderlich' });
    }

    const code = generateVerificationCode();
    const expiresAt = Date.now() + 15 * 60 * 1000;

    verificationStore.set(email.toLowerCase(), { code, expiresAt });
    await sendVerificationEmail(email, code);

    console.log(`✉️ Verifizierungscode an ${email} gesendet: ${code}`);
    return res.status(200).json({ success: true, message: 'Code erfolgreich gesendet' });
  } catch (err) {
    console.error("Vercel send-code error:", err);
    return res.status(500).json({ error: 'E-Mail Versandfehler: ' + err.message });
  }
};
