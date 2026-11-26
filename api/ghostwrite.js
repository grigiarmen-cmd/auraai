const geminiPool = require('../src/services/geminiPool');
const groqManager = require('../src/services/groqService');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { text, mode } = req.body || {};
  if (!text) return res.status(400).json({ error: 'Kein Text übergeben' });

  let instruction = 'Formuliere diesen Text professionell, prägnant und ansprechend neu:';
  if (mode === 'fix') instruction = 'Korrigiere Rechtschreibung, Zeichensetzung und Grammatik dieses Textes, ohne den Ton zu verändern:';
  if (mode === 'shorten') instruction = 'Fasse diesen Text prägnant in 1-2 Sätzen zusammen:';
  if (mode === 'translate_en') instruction = 'Übersetze diesen Text in natürliches, flüssiges Englisch:';
  if (mode === 'translate_de') instruction = 'Übersetze diesen Text in natürliches, modernes Deutsch:';

  const prompt = `${instruction}\n\n"${text}"\n\nGib NUR den verbesserten Text zurück, ohne Anführungszeichen oder Meta-Kommentare!`;

  try {
    const { GoogleGenAI } = require('@google/genai');
    const apiKey = geminiPool.getCurrentKey();
    if (!apiKey) throw new Error('No Gemini API key');
    const ai = new GoogleGenAI({ apiKey });
    const genRes = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: [{ text: prompt }]
    });
    return res.status(200).json({ result: (genRes.text || '').trim() });
  } catch (err) {
    try {
      const result = await groqManager.chatCompletion([{ role: 'user', content: prompt }]);
      return res.status(200).json({ result: (result || '').trim() });
    } catch (groqErr) {
      return res.status(500).json({ error: groqErr.message || 'Ghostwriter fehlgeschlagen' });
    }
  }
};
