const { fetchOpenFoodFacts, generateDeepScienceAnalysis } = require('../src/services/nutritionEngine');
const { SEED_OILS, EMULSIFIERS_ADDITIVES } = require('../src/services/nutritionKnowledge');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const barcode = req.query.code || req.query.barcode || req.url.split('/').pop().split('?')[0];
  if (!barcode || barcode === 'barcode') {
    return res.status(400).json({ error: 'Barcode fehlt' });
  }

  try {
    const product = await fetchOpenFoodFacts(barcode);
    if (!product) {
      return res.status(404).json({ error: 'Produkt nicht in der Datenbank gefunden' });
    }

    const detectedToxins = [];
    const ingrText = (product.ingredients_text || '').toLowerCase();

    SEED_OILS.forEach(oil => {
      if (ingrText.includes(oil.name.toLowerCase())) {
        detectedToxins.push({
          type: 'SEED_OIL',
          name: oil.name,
          risk: oil.risk,
          impact: oil.impact,
          severity: oil.severity
        });
      }
    });

    EMULSIFIERS_ADDITIVES.forEach(toxin => {
      const matchName = ingrText.includes(toxin.name.toLowerCase());
      const matchCode = toxin.code && ingrText.includes(toxin.code.toLowerCase());
      if (matchName || matchCode) {
        detectedToxins.push({
          type: 'ADDITIVE',
          name: toxin.name,
          code: toxin.code,
          risk: toxin.risk,
          impact: toxin.impact,
          severity: toxin.severity
        });
      }
    });

    const analysis = await generateDeepScienceAnalysis(product, detectedToxins);

    const nutriments = product.nutriments || {};
    const calories = nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || null;
    const protein = nutriments['proteins_100g'] || nutriments['proteins'] || null;
    const fat = nutriments['fat_100g'] || nutriments['fat'] || null;
    const carbs = nutriments['carbohydrates_100g'] || nutriments['carbohydrates'] || null;

    res.status(200).json({
      productName: product.product_name || 'Unbekanntes Produkt',
      brand: product.brands || '',
      ingredients: product.ingredients_text || 'Keine Zutatenliste verfügbar',
      calories,
      protein,
      fat,
      carbs,
      toxinsCount: detectedToxins.length,
      detectedToxins: detectedToxins,
      ...analysis
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
