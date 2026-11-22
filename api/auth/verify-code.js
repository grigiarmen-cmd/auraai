const { verifyEmailCode } = require('../../src/services/authService');

module.exports = (req, res) => {
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
    const { email, code, profileData } = req.body || {};
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Gültige E-Mail erforderlich' });
    }

    const isValid = verifyEmailCode(email, code);

    if (!isValid) {
      return res.status(400).json({ error: 'Ungültiger oder abgelaufener 6-stelliger Code. Bitte Code erneut anfordern.' });
    }

    return res.status(200).json({
      success: true,
      user: { email, verified: true, profile: profileData || {} }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
