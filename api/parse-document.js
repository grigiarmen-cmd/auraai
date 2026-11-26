const pdfParse = require('pdf-parse');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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
};
