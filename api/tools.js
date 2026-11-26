const pdfParse = require('pdf-parse');
const geminiPool = require('../src/services/geminiPool');
const groqManager = require('../src/services/groqService');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const action = req.query.action || (req.body && req.body.fileBase64 ? 'parse-document' : 'ghostwrite');

  if (action === 'parse-document') {
    const { fileName, fileBase64 } = req.body || {};
    if (!fileBase64) return res.status(400).json({ error: 'Keine Datei übergeben' });

    try {
      const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      let textContent = '';

      if (fileName && fileName.toLowerCase().endsWith('.pdf')) {
        const parsed = await pdfParse(buffer);
        textContent = parsed.text || '';
      } else {
        textContent = buffer.toString('utf-8');
      }

      const truncated = textContent.slice(0, 40000);
      return res.status(200).json({
        fileName: fileName || 'Dokument',
        characterCount: textContent.length,
        content: truncated
      });
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Dokument konnte nicht gelesen werden' });
    }
  }

  // Default: ghostwrite
  const { text, mode } = req.body || {};
  if (!text) return res.status(400).json({ error: 'Kein Text übergeben' });

  let instruction = 'Formuliere diesen Text professionell, prägnant und ansprechend neu:';
  if (mode === 'fix') instruction = 'Korrigiere Rechtschreibung, Zeichensetzung und Grammatik dieses Textes, ohne den Ton zu verändern:';
  if (mode === 'shorten') instruction = 'Fasse diesen Text prägnant in 1-2 Sätzen zusammen:';
  if (mode === 'translate_en') instruction = 'Übersetze diesen Text in natürliches, flüssiges Englisch:';
  if (mode === 'translate_de') instruction = 'Übersetze diesen Text in natürliches, modernes Deutsch:';

  const prompt = `${instruction}\n\n"${text}"\n\nGib NUR den verbesserten Text zurück, ohne Anführungszeichen oder Meta-Kommentare!`;

  const modelsToTry = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash'];
  const { GoogleGenAI } = require('@google/genai');
  const keyCount = Math.max(1, (geminiPool.keys || []).length);

  for (let k = 0; k < keyCount; k++) {
    const apiKey = geminiPool.getCurrentKey();
    if (!apiKey) break;
    const ai = new GoogleGenAI({ apiKey });
    for (const m of modelsToTry) {
      try {
        const genRes = await ai.models.generateContent({
          model: m,
          contents: [{ text: prompt }]
        });
        if (genRes.text) {
          return res.status(200).json({ result: genRes.text.trim() });
        }
      } catch (err) {}
    }
    geminiPool.rotateKey();
  }

  try {
    const result = await groqManager.chatCompletion([{ role: 'user', content: prompt }]);
    return res.status(200).json({ result: (result || '').trim() });
  } catch (groqErr) {
    return res.status(500).json({ error: groqErr.message || 'Ghostwriter fehlgeschlagen' });
  }
};
