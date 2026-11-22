const { searchFoodDatabase } = require('../../src/services/foodDatabase');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const q = req.query.q || '';
    const results = await searchFoodDatabase(q);
    return res.status(200).json({ success: true, count: results.length, foods: results });
  } catch(err) {
    console.error("Food search error:", err);
    return res.status(200).json({ success: false, foods: [] });
  }
};
