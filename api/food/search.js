const { searchFoodDatabase } = require('../../src/services/foodDatabase');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const q = req.query.q || '';
  const results = searchFoodDatabase(q);
  res.status(200).json({ success: true, count: results.length, foods: results });
};
