const { GoogleGenAI } = require('@google/genai');

// Pool of Gemini Keys with automatic round-robin & rate-limit fallback
class GeminiKeyManager {
  constructor() {
    this.keys = [];
    this.currentIndex = 0;
    this.loadKeys();
  }

  loadKeys() {
    const rawKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
    this.keys = rawKeys
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 10);
    
    console.log(`⚡ Gemini Key Manager initialized with ${this.keys.length} API keys.`);
  }

  getCurrentKey() {
    if (this.keys.length === 0) return null;
    return this.keys[this.currentIndex % this.keys.length];
  }

  rotateKey() {
    if (this.keys.length === 0) return null;
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    console.log(`🔄 Gemini Key rotated to index #${this.currentIndex + 1}`);
    return this.getCurrentKey();
  }

  // Vision Meal Analysis with auto-rotation across all keys and fallback to gemini-2.5-flash-lite
  async analyzeMeal(cleanBase64, note) {
    let attempts = 0;
    const maxAttempts = Math.max(1, this.keys.length) * 2;

    const prompt = `Du bist die führende Autorität für ancestrale Biochemie, evolutionäre Ernährung (Aajonus Vonderplanitz, Weston A. Price) und zelluläre Nährstoffdichte in "Aura AI".
Analysiere dieses Mahlzeiten-Foto gründlich. Zusatznotiz vom Nutzer: "${note || 'Keine'}".

Erstelle eine professionelle, schonungslose und präzise ernährungsbiochemische Analyse im JSON-Format mit folgenden Feldern:
{
  "dishName": "Name / Beschreibung des Gerichts",
  "auraScore": 0 bis 100 (0=Toxisch/Ultra-processed, 100=Göttlich/Ancestral Clean),
  "tier": "SUB_3_TOXIC" oder "NORMIE" oder "CLEAN" oder "RAW_PRIMAL" oder "AURA_GOD",
  "estimatedMacros": {
    "calories": "z.B. 650 kcal",
    "protein": "z.B. 45g",
    "fat": "z.B. 50g",
    "carbs": "z.B. 10g"
  },
  "bioavailabilityRating": "z.B. 92% (Hohe Bioverfügbarkeit tierischer Häm-Eisen & Retinol-Quellen)",
  "toxicRisks": ["Mögliche Gefahren wie Saatöl-Bratfett, Acrylamid, Lektine"],
  "cellularImpact": "Wie wirkt dieses Gericht auf Zellmembranen, Mitochondrien und Insulinsensitivität?",
  "ancestralWisdom": "Aajonus / Weston Price Perspektive zu diesem Essen",
  "optimizationTips": ["Konkreter Tipp 1, um die Mahlzeit biochemisch zu upgraden"]
}

Gib AUSSCHLIESSLICH das valide JSON ohne Markdown-Tags zurück.`;

    const modelsToTry = ['gemini-2.5-flash-lite', 'gemini-2.5-flash'];

    while (attempts < maxAttempts) {
      const apiKey = this.getCurrentKey();
      if (!apiKey) break;
      const ai = new GoogleGenAI({ apiKey });

      for (const modelName of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: [
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: cleanBase64
                }
              },
              { text: prompt }
            ]
          });

          let raw = response.text || '';
          raw = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
          const match = raw.match(/\{[\s\S]*\}/);
          if (match) {
            return JSON.parse(match[0]);
          }
        } catch (err) {
          console.warn(`Gemini Vision attempt failed with key ${this.currentIndex + 1} and model ${modelName}:`, err.message);
        }
      }

      attempts++;
      this.rotateKey();
    }

    // Fallback: If Gemini keys failed or missing, use Groq Vision Llama 3.2 11B Vision
    try {
      const groqManager = require('./groqService');
      const groqResult = await groqManager.visionAnalysis(cleanBase64, prompt);
      const cleanGroq = groqResult.replace(/```json/gi, '').replace(/```/g, '').trim();
      const match = cleanGroq.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
    } catch(groqErr) {
      console.warn("Groq Vision fallback also failed:", groqErr.message);
    }

    throw new Error('Alle Vision KI-Modelle erschöpft.');
  }
}

module.exports = new GeminiKeyManager();
