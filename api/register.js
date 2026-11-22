const { saveAccount } = require('../src/services/accountStorage');

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
    const { email, password, profile } = req.body || {};
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Gültige E-Mail erforderlich' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Passwort muss mindestens 6 Zeichen lang sein' });
    }

    const saved = await saveAccount(email, password, profile || {});

    return res.status(200).json({
      success: true,
      message: 'Account und Profil sicher in der Cloud gespeichert!',
      user: saved
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Speichern fehlgeschlagen' });
  }
};
