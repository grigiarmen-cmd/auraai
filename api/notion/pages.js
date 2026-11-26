const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-notion-token');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = req.headers['x-notion-token'] || req.query.token || process.env.NOTION_TOKEN || '';
  if (!token) {
    return res.status(200).json({ pages: [], configured: false });
  }

  const payload = JSON.stringify({});
  return new Promise((resolve) => {
    const searchReq = https.request({
      hostname: 'api.notion.com',
      path: '/v1/search',
      method: 'POST',
      timeout: 6000,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (notionRes) => {
      let body = '';
      notionRes.on('data', d => { body += d; });
      notionRes.on('end', () => {
        try {
          const json = JSON.parse(body);
          const list = (json.results || []).map(r => {
            let title = 'Kein Titel';
            if (r.object === 'database') {
              title = r.title?.[0]?.plain_text || 'Tabelle';
            } else if (r.object === 'page') {
              for (const key of Object.keys(r.properties || {})) {
                if (r.properties[key].type === 'title') {
                  title = r.properties[key].title?.[0]?.plain_text || title;
                  break;
                }
              }
            }
            return { id: r.id, object: r.object, title };
          }).filter(r => r.title !== 'Kein Titel' && r.title.trim().length > 0);

          const unique = [];
          const seen = new Set();
          for (const item of list) {
            if (!seen.has(item.title.toLowerCase())) {
              seen.add(item.title.toLowerCase());
              unique.push(item);
            }
          }
          res.status(200).json({ pages: unique, configured: true });
          resolve();
        } catch (e) {
          res.status(200).json({ pages: [], error: e.message });
          resolve();
        }
      });
    });

    searchReq.on('error', (err) => {
      res.status(200).json({ pages: [], error: err.message });
      resolve();
    });
    searchReq.on('timeout', () => {
      searchReq.destroy();
      res.status(200).json({ pages: [], error: 'Timeout' });
      resolve();
    });
    searchReq.write(payload);
    searchReq.end();
  });
};
