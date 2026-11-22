const groqManager = require('../src/services/groqService');
const geminiPool = require('../src/services/geminiPool');
const { resolveActions } = require('../src/services/actionResolver');

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
    const { message, history, explanationDepth, userNotionToken, userNotionDbId } = req.body || {};
    const formattedHistory = (history && Array.isArray(history) && history.length > 0)
      ? history.map(h => `${h.role === 'user' ? 'Nutzer' : 'Aura'}: "${h.text}"`).join('\n')
      : "Kein vorheriger Verlauf";

    // Dynamic Depth Style Rule
    let depthInstruction = "Antworte ausführlich, präzise und zellbiologisch klar.";
    if (explanationDepth === 'wenig') {
      depthInstruction = "EXTREM WICHTIG: Antworte ULTRA-KURZ in maximal 1-2 knappen Sätzen! Keine langen Listen, keine Ausschweifungen.";
    } else if (explanationDepth === 'mid') {
      depthInstruction = "Antworte kompakt und direkt auf den Punkt (ca. 3-4 Sätze oder kurze Stichpunkte).";
    } else if (explanationDepth === 'viel') {
      depthInstruction = "Antworte ausführlich, fundiert und mit klaren wissenschaftlichen Zusammenhängen.";
    } else if (explanationDepth === 'extrem') {
      depthInstruction = "Antworte extrem tiefgehend auf zellulärer und biochemischer Ebene (Mitochondrien, Membranfluidität, Neurotransmitter, Signalwege) und sehr detailliert.";
    } else if (explanationDepth === 'ultra') {
      depthInstruction = "ULTRA-SCIENCE MODE: Antworte maximal detailliert und tiefen-analytisch! Erkläre molekulare Mechanismen, Rezeptoren, Membran-Kinetik, Kofaktoren und untermauere jede Aussage schonungslos mit wissenschaftlichen Fakten und Studien.";
    }

    const systemPrompt = `Du bist Aura AI – ein intelligenter, zellbiologischer, metabolischer, multimedialer persönlicher Jarvis-Begleiter.
Antworte immer im coolen, smarten Jarvis-Stil. Duz den Nutzer immer.

ERKLÄRUNGSTIEFE DES NUTZERS:
${depthInstruction}

WICHTIGE AKTIONSTRIGGER (Schreibe den Tag genau so in deine Antwort):
1. MUSIK & YOUTUBE:
   - Wenn der Nutzer Songs/Musik abspielen will (z.B. "play paro by nej", "spiele song...", "/play ..."):
     [ACTION:OPEN_APP:youtube:Songname oder Künstler]
   - Wenn der Nutzer Songs zur Playlist hinzufügen will:
     [ACTION:ADD_SONG_TO_PLAYLIST:Songname:Künstler]
   - Wenn der Nutzer einen Song aus der Playlist löschen will:
     [ACTION:DELETE_SONG_FROM_PLAYLIST:Songname]
2. TERMINE & KALENDER:
   - Wenn der Nutzer einen Termin eintragen will:
     [ACTION:CALENDAR:Event YYYY-MM-DD HH:MM]
3. NOTION & RECOVERY PLÄNE:
   - Wenn der Nutzer etwas in Notion speichern will:
     [ACTION:CREATE_NOTION_PAGE:Titel:Inhalt]
   - Falls kein Notion konfiguriert ist, erkläre ihm in 2 Sätzen, dass er im Profil ('Anmelden/Profil') seinen Token hinterlegen kann (Link: https://www.notion.so/profile/integrations).
4. STUDIEN & WISSENSCHAFT:
   - Gib bei allen medizinischen oder biochemischen Empfehlungen (z.B. Magnesium, Tinnitus, HWS, Mitochondrien, Saatöle) IMMER konkrete PubMed / DOI Studien-Referenzen mit klickbarem Link an! Format: [Studie: Autoren/Titel (Jahr)](https://pubmed.ncbi.nlm.nih.gov/PMID/ oder https://doi.org/...).

Gesprächsverlauf:
${formattedHistory}`;

    let rawReply = '';

    // First try: Gemini Key Pool (Gemini 2.5 Flash Lite)
    try {
      const { GoogleGenAI } = require('@google/genai');
      const apiKey = geminiPool.getCurrentKey();
      const ai = new GoogleGenAI({ apiKey });
      const genRes = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: [
          { text: systemPrompt },
          { text: message || 'Hallo' }
        ]
      });
      rawReply = genRes.text || '';
    } catch (geminiErr) {
      console.warn("Gemini Pool failed, rotating to Groq:", geminiErr.message);
      geminiPool.rotateKey();
      // Second try: Groq multi-key rotation
      rawReply = await groqManager.chatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message || 'Hallo' }
      ]);
    }

    // Resolve multimedia, playlist and calendar actions
    const resolved = resolveActions(rawReply, userNotionToken, userNotionDbId);

    return res.status(200).json({
      reply: resolved.reply || 'Hallo! Ich bin Aura AI. Wie kann ich dir helfen?',
      actionStatus: resolved.actionStatus,
      openUrl: resolved.openUrl,
      imageUrl: null,
      playlistSong: resolved.playlistSong
    });
  } catch (err) {
    console.error("Vercel Chat Error:", err);
    return res.status(200).json({
      reply: 'Ich bin Aura AI. Wie kann ich dir helfen?',
      actionStatus: null,
      openUrl: null,
      playlistSong: null
    });
  }
};
