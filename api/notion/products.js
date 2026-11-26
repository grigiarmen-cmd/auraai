const https = require('https');

const DEFAULT_NOTION_DB_ID = process.env.NOTION_DB_ID || '41c6c80d-4897-80be-9350-f279e5b77f98';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-notion-token');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = req.headers['x-notion-token'] || req.query.token || process.env.NOTION_TOKEN || '';
  if (!token) {
    return res.status(200).json({ products: [], configured: false });
  }

  const dbId = req.query.dbId || DEFAULT_NOTION_DB_ID;
  const payload = JSON.stringify({ page_size: 50 });

  return new Promise((resolve) => {
    const notionReq = https.request({
      hostname: 'api.notion.com',
      path: `/v1/databases/${encodeURIComponent(dbId)}/query`,
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
          const items = (json.results || []).map(p => {
            let name = 'Unbenannt';
            for (const key of Object.keys(p.properties || {})) {
              if (p.properties[key].type === 'title') {
                name = p.properties[key].title?.[0]?.plain_text || name;
                break;
              }
            }
            return {
              id: p.id,
              name,
              price: p.properties?.price?.rich_text?.[0]?.plain_text || '',
              rating: p.properties?.['primal rating']?.rich_text?.[0]?.plain_text || '',
              url: p.properties?.URL?.url || null,
              vorteile: p.properties?.vorteile?.rich_text?.[0]?.plain_text || ''
            };
          });
          res.status(200).json({ products: items, configured: true });
          resolve();
        } catch (e) {
          res.status(200).json({ products: [], error: e.message });
          resolve();
        }
      });
    });

    notionReq.on('error', (err) => {
      res.status(200).json({ products: [], error: err.message });
      resolve();
    });
    notionReq.on('timeout', () => {
      notionReq.destroy();
      res.status(200).json({ products: [], error: 'Timeout' });
      resolve();
    });
    notionReq.write(payload);
    notionReq.end();
  });
};
