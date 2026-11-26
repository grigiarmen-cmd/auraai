const https = require('https');

const DEFAULT_NOTION_DB_ID = process.env.NOTION_DB_ID || '41c6c80d-4897-80be-9350-f279e5b77f98';
const DEFAULT_NOTION_PAGE_ID = process.env.NOTION_PAGE_ID || '41c6c80d-4897-8020-90e9-e341b6f5a0a6';

function findYouTubeVideoId(query) {
  return new Promise((resolve) => {
    const encoded = encodeURIComponent((query || '').trim());
    if (!encoded) return resolve(null);
    const req = https.get(`https://www.youtube.com/results?search_query=${encoded}`, {
      timeout: 4000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        const match = data.match(/"videoId":"([a-zA-Z0-9_-]{11})"/) || data.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
        resolve(match && match[1] ? match[1] : null);
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

function generateFluxImage(promptText) {
  const cfAccount = process.env.CLOUDFLARE_ACCOUNT_ID || '';
  const cfToken = process.env.CLOUDFLARE_API_TOKEN || '';
  const cleanP = encodeURIComponent((promptText || 'futuristic scene').slice(0, 350));
  const fallbackUrl = `https://image.pollinations.ai/prompt/${cleanP}?model=flux&width=1024&height=1024&nologo=true&nofeed=true`;

  if (!cfAccount || !cfToken) {
    return Promise.resolve(fallbackUrl);
  }

  return new Promise((resolve) => {
    const payload = JSON.stringify({ prompt: promptText, steps: 4 });
    const req = https.request({
      hostname: 'api.cloudflare.com',
      path: `/client/v4/accounts/${cfAccount}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
      method: 'POST',
      timeout: 8000,
      headers: {
        'Authorization': `Bearer ${cfToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try {
          const json = JSON.parse(Buffer.concat(chunks).toString());
          if (json.result && json.result.image) {
            return resolve(`data:image/jpeg;base64,${json.result.image}`);
          }
        } catch (e) {}
        resolve(fallbackUrl);
      });
    });
    req.on('error', () => resolve(fallbackUrl));
    req.on('timeout', () => { req.destroy(); resolve(fallbackUrl); });
    req.write(payload);
    req.end();
  });
}

function saveNotionEntry({ title, content, isProduct, token, dbId }) {
  const activeToken = token || process.env.NOTION_TOKEN || '';
  if (!activeToken) {
    return Promise.resolve({ ok: false, reason: 'Kein Notion-Token konfiguriert (im Profil hinterlegbar).' });
  }

  return new Promise((resolve) => {
    let payloadObj;
    if (isProduct) {
      payloadObj = {
        parent: { database_id: dbId || DEFAULT_NOTION_DB_ID },
        properties: {
          Productname: { title: [{ text: { content: title.slice(0, 200) } }] },
          'primal rating': { rich_text: [{ text: { content: '9.5 / 10' } }] },
          vorteile: { rich_text: [{ text: { content: (content || 'Primal Empfehlung').slice(0, 500) } }] }
        }
      };
    } else {
      payloadObj = {
        parent: { page_id: dbId || DEFAULT_NOTION_PAGE_ID },
        properties: {
          title: [{ text: { content: title.slice(0, 200) } }]
        },
        children: [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [{ text: { content: (content || 'Erstellt mit Aura AI').slice(0, 1800) } }]
            }
          }
        ]
      };
    }

    const payload = JSON.stringify(payloadObj);
    const req = https.request({
      hostname: 'api.notion.com',
      path: '/v1/pages',
      method: 'POST',
      timeout: 5000,
      headers: {
        'Authorization': `Bearer ${activeToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let body = '';
      res.on('data', d => { body += d; });
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.id) return resolve({ ok: true });
          resolve({ ok: false, reason: json.message || `Notion HTTP ${res.statusCode}` });
        } catch (e) {
          resolve({ ok: false, reason: e.message });
        }
      });
    });
    req.on('error', (err) => resolve({ ok: false, reason: err.message }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, reason: 'Timeout' }); });
    req.write(payload);
    req.end();
  });
}

// Comprehensive Action Resolver & Universal Link Generator for Mobile + Desktop
async function resolveActions(replyText, userNotionToken, userNotionDbId) {
  let cleanReply = replyText || '';
  let actionStatus = null;
  let openUrl = null;
  let actionUrl = null;
  let imageUrl = null;
  let youtubeVideoId = null;
  let playlistSong = null;

  // 1. Image Generation: [ACTION:GENERATE_IMAGE:Prompt]
  const imgMatch = cleanReply.match(/\[ACTION:GENERATE_IMAGE:(.*?)\]/i);
  if (imgMatch) {
    const prompt = imgMatch[1].trim();
    imageUrl = await generateFluxImage(prompt);
    actionStatus = '8K FLUX-Bild erfolgreich generiert 📸';
    cleanReply = cleanReply.replace(imgMatch[0], '').trim();
  }

  // 2. YouTube & In-Browser Music Play: [ACTION:OPEN_APP:youtube:Query]
  const youtubeMatch = cleanReply.match(/\[ACTION:OPEN_APP:youtube:(.*?)\]/i) || cleanReply.match(/\[ACTION:OPEN_APP:(?:song|music|musik):(.*?)\]/i);
  if (youtubeMatch) {
    const query = youtubeMatch[1].trim();
    const vidId = await findYouTubeVideoId(query);
    if (vidId) {
      youtubeVideoId = vidId;
      actionUrl = `https://www.youtube.com/watch?v=${vidId}`;
      actionStatus = `Spiele "${query}" direkt im Player ab ▶️`;
    } else {
      actionUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
      openUrl = actionUrl;
      actionStatus = `YouTube-Suche für "${query}" bereit ▶️`;
    }
    cleanReply = cleanReply.replace(youtubeMatch[0], '').trim();
  }

  // 3. Music Playlist Add: [ACTION:ADD_SONG_TO_PLAYLIST:Songname:Künstler]
  const addSongMatch = cleanReply.match(/\[ACTION:ADD_SONG_TO_PLAYLIST:(.*?)(?::(.*?))?\]/i);
  if (addSongMatch) {
    const title = addSongMatch[1].trim();
    const artist = (addSongMatch[2] || 'YouTube').trim();
    const vidId = await findYouTubeVideoId(`${title} ${artist}`);
    const url = vidId
      ? `https://www.youtube.com/watch?v=${vidId}`
      : `https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} ${artist}`)}`;
    playlistSong = { title, artist, url, videoId: vidId };
    actionStatus = `"${title}" zur Aura Musikliste hinzugefügt 🎵`;
    cleanReply = cleanReply.replace(addSongMatch[0], '').trim();
  }

  // 4. Google Calendar: [ACTION:CALENDAR:Event YYYY-MM-DD HH:MM]
  const calMatch = cleanReply.match(/\[ACTION:CALENDAR:(.*?)\]/i);
  if (calMatch) {
    const raw = calMatch[1].trim();
    const parts = raw.split(' ');
    let title = 'Aura Termin';
    let dateStr = '';
    let timeStr = '12:00';

    if (parts.length >= 3 && /\d{4}-\d{2}-\d{2}/.test(parts[parts.length - 2])) {
      timeStr = parts.pop();
      dateStr = parts.pop();
      title = parts.join(' ');
    } else if (parts.length >= 2 && /\d{4}-\d{2}-\d{2}/.test(parts[parts.length - 1])) {
      dateStr = parts.pop();
      title = parts.join(' ');
    } else {
      title = raw;
    }

    const cleanDate = dateStr.replace(/[^0-9]/g, '') || new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const cleanTime = timeStr.replace(/[^0-9]/g, '').padEnd(4, '0').slice(0, 4) + '00';
    const startIso = `${cleanDate}T${cleanTime}`;

    actionUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startIso}/${startIso}&details=${encodeURIComponent('Erstellt mit Aura AI')}`;
    openUrl = actionUrl;
    actionStatus = `Termin "${title}" für Google Kalender vorbereitet 📅`;
    cleanReply = cleanReply.replace(calMatch[0], '').trim();
  }

  // 5. Online Shopping / Buy Agent: [ACTION:BUY_ONLINE:Query]
  const buyMatch = cleanReply.match(/\[ACTION:BUY_ONLINE:(.*?)\]/i);
  if (buyMatch) {
    const item = buyMatch[1].trim();
    actionUrl = `https://www.amazon.de/s?k=${encodeURIComponent(item)}`;
    openUrl = actionUrl;
    actionStatus = `Shop-Suche für "${item}" geöffnet 🛒`;
    cleanReply = cleanReply.replace(buyMatch[0], '').trim();
  }

  // 6. Notion Page / Product creation (Real Notion API call!)
  const notionPageMatch = cleanReply.match(/\[ACTION:CREATE_NOTION_PAGE:(.*?)(?::([\s\S]*?))?\]/i);
  if (notionPageMatch) {
    const pageTitle = (notionPageMatch[1] || 'Aura Notiz').trim();
    const pageContent = (notionPageMatch[2] || '').trim();
    const res = await saveNotionEntry({
      title: pageTitle,
      content: pageContent,
      isProduct: false,
      token: userNotionToken,
      dbId: userNotionDbId
    });
    actionStatus = res.ok
      ? `Notion-Seite "${pageTitle}" im Second-Brain gespeichert 📝`
      : `Notion-Hinweis: ${res.reason}`;
    cleanReply = cleanReply.replace(notionPageMatch[0], '').trim();
  }

  const notionProdMatch = cleanReply.match(/\[ACTION:SEARCH_AND_NOTION:(.*?)\]/i);
  if (notionProdMatch) {
    const prodTitle = (notionProdMatch[1] || 'Produkt').trim();
    const res = await saveNotionEntry({
      title: prodTitle,
      content: 'Primal Einkaufsliste via Aura AI',
      isProduct: true,
      token: userNotionToken,
      dbId: userNotionDbId
    });
    actionStatus = res.ok
      ? `"${prodTitle}" in Notion-Einkaufsliste eingetragen 📝`
      : `Notion-Hinweis: ${res.reason}`;
    cleanReply = cleanReply.replace(notionProdMatch[0], '').trim();
  }

  // Preserve DELETE_MEAL and DELETE_SONG_FROM_PLAYLIST so frontend can handle them
  cleanReply = cleanReply.replace(/\[ACTION:(?!DELETE_MEAL:|DELETE_SONG_FROM_PLAYLIST:).*?\]/g, '').trim();

  return {
    reply: cleanReply,
    actionStatus,
    openUrl,
    actionUrl,
    imageUrl,
    youtubeVideoId,
    playlistSong
  };
}

module.exports = { resolveActions };
