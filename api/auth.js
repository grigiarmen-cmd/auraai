const { getCodeForWindow, sendVerificationEmail, verifyEmailCode } = require('../src/services/authService');

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
    const { action, email, code } = req.body || {};
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Gültige E-Mail erforderlich' });
    }

    if (action === 'verify') {
      const isValid = verifyEmailCode(email, code);
      if (!isValid) {
        return res.status(400).json({ error: 'Ungültiger oder abgelaufener 6-stelliger Code.' });
      }
      return res.status(200).json({ success: true, message: 'Code verifiziert' });
    }

    // Default action: send code
    const generatedCode = getCodeForWindow(email, 0);
    await sendVerificationEmail(email, generatedCode);
    console.log(`✉️ Verifizierungscode an ${email} gesendet: ${generatedCode}`);
    return res.status(200).json({ success: true, message: 'Code erfolgreich gesendet' });
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(500).json({ error: err.message });
  }
};
