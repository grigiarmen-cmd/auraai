// Comprehensive Action Resolver & Universal Link Generator for Mobile + Desktop
function resolveActions(replyText, userNotionToken, userNotionDbId) {
  let cleanReply = replyText || '';
  let actionStatus = null;
  let openUrl = null;
  let playlistSong = null;

  // 1. YouTube & Music Play: [ACTION:OPEN_APP:youtube:Query]
  const youtubeMatch = cleanReply.match(/\[ACTION:OPEN_APP:youtube:(.*?)\]/i) || cleanReply.match(/\[ACTION:OPEN_APP:(?:song|music|musik):(.*?)\]/i);
  if (youtubeMatch) {
    const query = youtubeMatch[1].trim();
    openUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    actionStatus = `Spiele "${query}" auf YouTube ab ▶️`;
    cleanReply = cleanReply.replace(youtubeMatch[0], '').trim();
  }

  // 2. Music Playlist Add: [ACTION:ADD_SONG_TO_PLAYLIST:Songname:Künstler]
  const addSongMatch = cleanReply.match(/\[ACTION:ADD_SONG_TO_PLAYLIST:(.*?)(?::(.*?))?\]/i);
  if (addSongMatch) {
    const title = addSongMatch[1].trim();
    const artist = (addSongMatch[2] || 'Unbekannt').trim();
    playlistSong = { title, artist };
    actionStatus = `"${title}" zur Playlist hinzugefügt 🎵`;
    cleanReply = cleanReply.replace(addSongMatch[0], '').trim();
  }

  // 3. Google Calendar: [ACTION:CALENDAR:Event YYYY-MM-DD HH:MM]
  const calMatch = cleanReply.match(/\[ACTION:CALENDAR:(.*?)\]/i);
  if (calMatch) {
    const raw = calMatch[1].trim();
    const parts = raw.split(' ');
    let title = 'Aura Termin';
    let dateStr = '';
    let timeStr = '12:00';

    if (parts.length >= 3) {
      timeStr = parts.pop();
      dateStr = parts.pop();
      title = parts.join(' ');
    } else if (parts.length === 2) {
      dateStr = parts[1];
      title = parts[0];
    } else {
      title = raw;
    }

    const cleanDate = dateStr.replace(/[^0-9]/g, '') || new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const cleanTime = timeStr.replace(/[^0-9]/g, '').padEnd(4, '0').slice(0, 4) + '00';
    const startIso = `${cleanDate}T${cleanTime}`;

    openUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startIso}/${startIso}&details=${encodeURIComponent('Erstellt mit Aura AI')}`;
    actionStatus = `Termin "${title}" für Google Kalender vorbereitet 📅`;
    cleanReply = cleanReply.replace(calMatch[0], '').trim();
  }

  // 4. Notion Page / Plan creation
  const notionMatch = cleanReply.match(/\[ACTION:CREATE_NOTION_PAGE:(.*?)(?::([\s\S]*?))?\]/i);
  if (notionMatch) {
    const pageTitle = notionMatch[1].trim();
    actionStatus = `Notion-Seite "${pageTitle}" im Second-Brain gesichert 📝`;
    cleanReply = cleanReply.replace(notionMatch[0], '').trim();
  }

  // Clean remaining action brackets
  cleanReply = cleanReply.replace(/\[ACTION:.*?\]/g, '').trim();

  return {
    reply: cleanReply,
    actionStatus,
    openUrl,
    playlistSong
  };
}

module.exports = { resolveActions };
