const groqManager = require('../src/services/groqService');

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'Aura AI Vercel API online' });
  }

  try {
    const { message, history } = req.body || {};
    const formattedHistory = (history && Array.isArray(history) && history.length > 0)
      ? history.map(h => `${h.role === 'user' ? 'Nutzer' : 'Aura'}: "${h.text}"`).join('\n')
      : "Kein vorheriger Verlauf";

    const systemPrompt = `Du bist Aura AI – ein zellbiologischer, metabolischer und persönlicher Begleiter.
Antworte prägnant, intelligent, direkt und im coolen Jarvis-Stil. Duz den Nutzer immer.
Gesprächsverlauf:
${formattedHistory}`;

    // Cloudflare / Vercel Serverless direct response via Groq Llama 3 / GPT-OSS
    const reply = await groqManager.chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message || 'Hallo' }
    ]);

    return res.status(200).json({
      reply: reply || 'Hallo! Ich bin Aura AI.',
      actionStatus: null,
      openUrl: null,
      imageUrl: null,
      playlistSong: null
    });
  } catch (err) {
    console.error("Vercel Chat Error:", err);
    return res.status(200).json({
      reply: 'Ich bin Aura AI. Mein Cloud-Knoten ist aktiv! Wie kann ich dir bei deiner Ernährung oder deinen Fragen helfen?',
      actionStatus: null
    });
  }
};
