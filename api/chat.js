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

    const systemPrompt = `Du bist Aura AI – ein intelligenter, zellbiologischer, metabolischer und persönlicher Begleiter.
Antworte prägnant, intelligent, direkt und im coolen Jarvis-Stil. Duz den Nutzer immer.

WICHTIGE REGELN:
1. STUDIEN & QUELLEN: Gib bei allen medizinischen, biochemischen oder Nährstoff-Empfehlungen (z.B. Magnesium, Tinnitus, HWS, Mitochondrien, Saatöle) IMMER konkrete PubMed / DOI Studien-Referenzen mit klickbarem Link an! Format: [Studie: Autoren/Titel (Jahr)](https://pubmed.ncbi.nlm.nih.gov/PMID/ oder https://doi.org/...).
2. NOTION ONBOARDING: Wenn der Nutzer nach Notion fragt oder etwas speichern will und noch kein Token hinterlegt ist, erkläre ihm in 2 Sätzen, dass er im Profil ('Anmelden/Profil') seinen eigenen Notion-Token hinterlegen kann (Link: https://www.notion.so/profile/integrations), oder dass Aura es im internen Speicher behält!

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
