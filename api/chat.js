const groqManager = require('../src/services/groqService');
const geminiPool = require('../src/services/geminiPool');
const { resolveActions } = require('../src/services/actionResolver');

async function fetchWeatherBriefing(city = 'Juebek') {
  try {
    const res = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`, { signal: AbortSignal.timeout(3500) });
    if (!res.ok) return null;
    const json = await res.json();
    const curr = json.current_condition?.[0];
    if (!curr) return null;
    const desc = curr.lang_de?.[0]?.value || curr.weatherDesc?.[0]?.value || '';
    return `${curr.temp_C}°C (${desc}), gefühlt ${curr.FeelsLikeC}°C, Wind ${curr.windspeedKmph} km/h, Luftfeuchtigkeit ${curr.humidity}%`;
  } catch (e) {
    return null;
  }
}

async function extractUrlContent(targetUrl) {
  try {
    if (/youtube\.com|youtu\.be/i.test(targetUrl)) {
      const { YoutubeTranscript } = require('youtube-transcript');
      const transcript = await YoutubeTranscript.fetchTranscript(targetUrl);
      return {
        title: 'YouTube Video Transkript',
        content: transcript.map(t => t.text).join(' ').slice(0, 14000)
      };
    }
    const cheerio = require('cheerio');
    const pageRes = await fetch(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(5000)
    });
    const html = await pageRes.text();
    const $ = cheerio.load(html);
    $('script, style, nav, footer, noscript').remove();
    const title = $('title').text().trim() || targetUrl;
    const content = $('p, article, h1, h2, h3, li').text().replace(/\s+/g, ' ').trim().slice(0, 14000);
    return { title, content };
  } catch (e) {
    return { title: targetUrl, content: `Konnte Seiteninhalt nicht direkt laden (${e.message}).` };
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(200).json({ status: 'Aura AI Vercel API online' });

  try {
    const { message, history, image, model, explanationDepth, userNotionToken, userNotionDbId } = req.body || {};
    const rawUserMsg = (message || '').trim();
    const todayStr = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const isoToday = new Date().toISOString().slice(0, 10);

    // Strip any old [ACTION:...] tags from history so AI never re-triggers past actions!
    const formattedHistory = (history && Array.isArray(history) && history.length > 0)
      ? history.slice(-16).map(h => {
          const safeText = (h.text || '').replace(/\[ACTION:.*?\]/g, '').trim();
          return `${h.role === 'user' ? 'User' : 'Aura'}: ${safeText}`;
        }).join('\n')
      : 'Keine vorherigen Nachrichten.';

    // Pre-process explicit slash commands in user message
    let effectiveUserPrompt = rawUserMsg || 'Hallo';
    const cleanCmdInput = rawUserMsg.replace(/^(\[.*?\][\s\n]*)+/, '').trim();

    if (/^\/briefing\b/i.test(cleanCmdInput)) {
      const weather = await fetchWeatherBriefing('Juebek');
      effectiveUserPrompt = `${rawUserMsg}\n\n[LIVE-WETTER JÜBEK (${todayStr}): ${weather || 'Nicht verfügbar'}]\nErstelle jetzt ein strukturiertes, motivierendes Daily Briefing für heute (${todayStr}) mit Wetter, Fokus, Stoffwechsel-/Tagesstatus (nur auf Basis echter vorhandener Kontextdaten, nichts erfinden!) und konkreten Tages-Tipps.`;
    } else if (/^\/summary\s+(https?:\/\/\S+)/i.test(cleanCmdInput)) {
      const urlMatch = cleanCmdInput.match(/^\/summary\s+(https?:\/\/\S+)/i);
      const extracted = await extractUrlContent(urlMatch[1]);
      effectiveUserPrompt = `Fasse den folgenden Inhalt von "${extracted.title}" (${urlMatch[1]}) präzise und übersichtlich mit Überschriften und Bulletpoints zusammen:\n\n${extracted.content}`;
    } else if (/^\/image\s+(.+)/i.test(cleanCmdInput)) {
      const imgIdea = cleanCmdInput.replace(/^\/image\s+/i, '').trim();
      effectiveUserPrompt = `Der Nutzer möchte ein Bild generieren für: "${imgIdea}". Antworte mit einem kurzen Satz und füge zwingend [ACTION:GENERATE_IMAGE:${imgIdea}] ein.`;
    } else if (/^\/play\s+(.+)/i.test(cleanCmdInput)) {
      const song = cleanCmdInput.replace(/^\/play\s+/i, '').trim();
      effectiveUserPrompt = `Spiele jetzt "${song}" ab. Antworte kurz und füge zwingend [ACTION:OPEN_APP:youtube:${song}] ein.`;
    } else if (/^\/addsong\s+(.+)/i.test(cleanCmdInput)) {
      const song = cleanCmdInput.replace(/^\/addsong\s+/i, '').trim();
      effectiveUserPrompt = `Füge "${song}" zur Musikliste hinzu mit [ACTION:ADD_SONG_TO_PLAYLIST:${song}].`;
    } else if (/^\/buy\s+(.+)/i.test(cleanCmdInput)) {
      const item = cleanCmdInput.replace(/^\/buy\s+/i, '').trim();
      effectiveUserPrompt = `Öffne die Kauf-Suche für "${item}" mit [ACTION:BUY_ONLINE:${item}] und gib 2 kurze Qualitäts-Tipps worauf man beim Kauf achten sollte.`;
    } else if (/^\/cal(?:\s+(.*))?$/i.test(cleanCmdInput)) {
      const calArg = (cleanCmdInput.match(/^\/cal(?:\s+(.*))?$/i)?.[1] || '').trim();
      if (!calArg) {
        return res.status(200).json({
          reply: `📅 **Google Kalender Termin erstellen**\nSchreib mir einfach den Termin mit Datum & Uhrzeit, z. B.:\n\`/cal Zahnarzt ${isoToday} 15:00\` oder *„Trage morgen um 16 Uhr Training in den Kalender ein“*.`,
          actionStatus: null,
          openUrl: null,
          playlistSong: null
        });
      }
      effectiveUserPrompt = `Trage folgenden Termin in den Google Kalender ein (heute ist ${isoToday}): "${calArg}". Nutze zwingend [ACTION:CALENDAR:Titel YYYY-MM-DD HH:MM].`;
    }

    // Dynamic Depth Style Rule
    let depthInstruction = 'Antworte präzise, gut strukturiert (nutze Markdown wie **Fettdruck**, Listen oder Tabellen wo sinnvoll) und fachlich fundiert.';
    if (explanationDepth === 'wenig') {
      depthInstruction = 'Antworte ULTRA-KURZ in maximal 1-2 knappen Sätzen! Keine langen Listen.';
    } else if (explanationDepth === 'mid') {
      depthInstruction = 'Antworte kompakt und direkt auf den Punkt (ca. 3-4 Sätze oder kurze Stichpunkte).';
    } else if (explanationDepth === 'extrem') {
      depthInstruction = 'Antworte tiefgehend auf zellulärer und biochemischer Ebene (Mitochondrien, Membranfluidität, Signalwege).';
    } else if (explanationDepth === 'ultra') {
      depthInstruction = 'ULTRA-SCIENCE MODE: Antworte maximal detailliert auf molekularbiologischer Ebene (Rezeptoren, Kofaktoren, Signalwege) inkl. konkreter PubMed/DOI-Referenzen.';
    }

    const systemPrompt = `Du bist Aura AI – ein hochintelligenter persönlicher KI-Assistent für Wissenschaft, Gesundheit, Biohacking, Produktivität & Multimedia.
Heutiges Datum: ${todayStr} (${isoToday}).

WICHTIGSTE GRUNDREGELN:
1. SPRACHE: Antworte IMMER exakt in der Sprache der aktuellen Nutzernachricht! (Schreibt der Nutzer Englisch -> antworte 100% Englisch. Schreibt er Deutsch -> antworte Deutsch.)
2. KEINE FLOSKELN: Gib NIEMALS eine generische Selbstvorstellung ("Hallo, ich bin dein Jarvis-Assistent..."), außer der Nutzer fragt explizit wer du bist. Beantworte jede Aufgabe (z. B. Markdown-Tabellen, Code, Fragen, Analysen) DIREKT und präzise!
3. DETAILGRAD: ${depthInstruction}
4. INTERNE SENSOR-TAGS: Zitiere oder wiederhole NIEMALS interne Kontext-Blöcke wie [HEUTIGES ERNÄHRUNGSTAGEBUCH: ...], [KOFFEIN-STATUS: ...], [PATIENTEN-KONTEXT: ...] oder [AKTUELLER LABOR-STATUS: ...] wörtlich. Nutze sie nur im Hintergrund, falls für die Frage relevant.

AKTIONSTRIGGER (NUR verwenden, wenn die AKTUELLE Nachricht des Nutzers genau diese Aktion verlangt – NIEMALS aus dem alten Gesprächsverlauf wiederholen!):
- Musik abspielen: [ACTION:OPEN_APP:youtube:Songname Künstler]
- Song zur Playlist hinzufügen: [ACTION:ADD_SONG_TO_PLAYLIST:Songname:Künstler]
- Song aus Playlist löschen: [ACTION:DELETE_SONG_FROM_PLAYLIST:Songname]
- Bild generieren: [ACTION:GENERATE_IMAGE:Detailed English visual prompt]
- Kalender-Termin: [ACTION:CALENDAR:Titel YYYY-MM-DD HH:MM]
- Produkt online kaufen/suchen: [ACTION:BUY_ONLINE:Produktname]
- Notion-Seite speichern: [ACTION:CREATE_NOTION_PAGE:Titel:Inhalt]
- Produkt auf Notion-Einkaufsliste: [ACTION:SEARCH_AND_NOTION:Produktname]
- Mahlzeit aus Tagebuch löschen: [ACTION:DELETE_MEAL:Suchbegriff]

Bisheriger Gesprächsverlauf (nur als Kontext):
${formattedHistory}`;

    let rawReply = '';
    const requestedModel = model || 'gemini-2.5-flash-lite';
    const useGroqDirectly = requestedModel.includes('gpt-oss') || requestedModel.includes('llama') || requestedModel.includes('groq');

    if (useGroqDirectly && !image) {
      rawReply = await groqManager.chatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: effectiveUserPrompt }
      ], requestedModel);
    } else {
      const keyCount = Math.max(1, (geminiPool.keys || []).length);
      let geminiSuccess = false;
      const { GoogleGenAI } = require('@google/genai');
      const geminiModel = requestedModel.startsWith('gemini-') ? requestedModel : 'gemini-2.5-flash-lite';

      for (let attempt = 0; attempt < keyCount; attempt++) {
        try {
          const apiKey = geminiPool.getCurrentKey();
          if (!apiKey) break;
          const ai = new GoogleGenAI({ apiKey });

          const parts = [{ text: effectiveUserPrompt }];
          if (image && typeof image === 'string') {
            const mimeMatch = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
            const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
            const cleanBase64 = image.replace(/^data:[^;]+;base64,/, '');
            parts.push({ inlineData: { mimeType, data: cleanBase64 } });
          }

          const genRes = await ai.models.generateContent({
            model: geminiModel,
            contents: [{ role: 'user', parts }],
            config: { systemInstruction: systemPrompt }
          });
          rawReply = genRes.text || '';
          if (rawReply) {
            geminiSuccess = true;
            break;
          }
        } catch (geminiErr) {
          console.warn(`Gemini key #${attempt + 1} failed, rotating:`, geminiErr.message);
          geminiPool.rotateKey();
        }
      }

      if (!geminiSuccess) {
        if (image && typeof image === 'string') {
          rawReply = await groqManager.visionAnalysis(image, `${systemPrompt}\n\nNutzer-Anfrage:\n${effectiveUserPrompt}`);
        } else {
          rawReply = await groqManager.chatCompletion([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: effectiveUserPrompt }
          ]);
        }
      }
    }

    const resolved = await resolveActions(rawReply, userNotionToken, userNotionDbId);

    return res.status(200).json({
      reply: resolved.reply || resolved.actionStatus || 'Erledigt!',
      actionStatus: resolved.actionStatus,
      openUrl: resolved.openUrl,
      actionUrl: resolved.actionUrl,
      imageUrl: resolved.imageUrl,
      youtubeVideoId: resolved.youtubeVideoId,
      modelUsed: requestedModel,
      playlistSong: resolved.playlistSong
    });
  } catch (err) {
    console.error('Vercel Chat Error:', err);
    return res.status(500).json({
      error: err.message || 'KI-Serverfehler',
      reply: `⚠️ Fehler bei der KI-Antwort: ${err.message || 'Bitte versuche es erneut.'}`,
      actionStatus: null,
      openUrl: null,
      playlistSong: null
    });
  }
};
