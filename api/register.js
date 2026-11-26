const { saveAccount } = require('../src/services/accountStorage');
const { verifyEmailCode, verifySessionToken, createSessionToken } = require('../src/services/authService');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, profile, code, sessionToken } = req.body || {};
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Gültige E-Mail erforderlich' });
    }

    const authHeaderToken = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const verifiedSessionEmail = verifySessionToken(sessionToken || authHeaderToken);
    const isSelfUpdate = verifiedSessionEmail && verifiedSessionEmail === email.trim().toLowerCase();

    if (!isSelfUpdate) {
      if (!password || password.length < 6) {
        return res.status(400).json({ error: 'Passwort muss mindestens 6 Zeichen lang sein' });
      }
      if (!code || !verifyEmailCode(email, code)) {
        return res.status(403).json({ error: 'E-Mail-Verifizierungscode ungültig oder fehlt.' });
      }
    }

    const saved = await saveAccount(email, password || null, profile || {}, { allowOverwrite: isSelfUpdate });
    const token = createSessionToken(email);

    return res.status(200).json({
      success: true,
      message: 'Account und Profil sicher in der Cloud gespeichert!',
      token,
      user: saved
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Speichern fehlgeschlagen' });
  }
};
