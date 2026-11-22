const { fetchOpenFoodFacts, generateDeepScienceAnalysis } = require('../src/services/nutritionEngine');
const { SEED_OILS, EMULSIFIERS_ADDITIVES } = require('../src/services/nutritionKnowledge');
const https = require('https');

// Helper to query FDDB mobile by barcode as a powerful fallback
function fetchFddbByBarcode(barcode) {
  return new Promise((resolve) => {
    if (!barcode) return resolve(null);
    const url = `https://fddb.mobi/search/?lang=de&cat=mobile-de&search=${encodeURIComponent(barcode.trim())}`;
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36'
      },
      timeout: 3500
    };

    const req = https.get(url, options, (res) => {
      if (res.statusCode !== 200) return resolve(null);
      let html = '';
      res.on('data', chunk => { html += chunk; });
      res.on('end', () => {
        try {
          const nameMatch = html.match(/<span class='fddb-m-result__name'>([^<]+)<\/span>/);
          const prodMatch = html.match(/<span class='fddb-m-result__producer'>([^<]+)<\/span>/);
          const thumbMatch = html.match(/<img[^>]*src='([^']+)'/);
          
          if (!nameMatch) return resolve(null);

          const rawName = nameMatch[1].replace(/&#039;/g, "'").replace(/&amp;/g, '&');
          const rawBrand = prodMatch ? prodMatch[1].replace(/&#039;/g, "'").replace(/&amp;/g, '&') : '';

          // Extract stats
          const statsMatch = html.match(/<span class='fddb-m-result__stats'>([^<]+<strong>(\d+)\s*kcal<\/strong>[^<]+)<\/span>/);
          let calories = 150;
          let fat = 5;
          let carbs = 15;

          if (statsMatch) {
            const clean = statsMatch[1].replace(/&middot;/g, '•').replace(/<strong>|<\/strong>/g, '');
            const calM = clean.match(/(\d+)\s*kcal/);
            if (calM) calories = parseInt(calM[1], 10);
            const fatM = clean.match(/Fett:\s*([\d,]+)\s*g/);
            if (fatM) fat = parseFloat(fatM[1].replace(',', '.'));
            const carbM = clean.match(/KH:\s*([\d,]+)\s*g/);
            if (carbM) carbs = parseFloat(carbM[1].replace(',', '.'));
          }

          const protein = Math.round(((calories - (fat * 9) - (carbs * 4)) / 4) * 10) / 10 || 5;

          resolve({
            product_name: rawName,
            brands: rawBrand,
            ingredients_text: 'Zutaten über FDDB Datenbank abgeglichen.',
            image_url: thumbMatch ? thumbMatch[1] : null,
            nutriments: {
              'energy-kcal_100g': calories,
              'proteins_100g': protein,
              'fat_100g': fat,
              'carbohydrates_100g': carbs
            }
          });
        } catch(e) {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

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
    // 1. Try OpenFoodFacts
    let product = await fetchOpenFoodFacts(barcode);

    // 2. Fallback: Query FDDB Live Database directly by barcode!
    if (!product) {
      console.log(`OpenFoodFacts miss for barcode ${barcode}, fallback to FDDB...`);
      product = await fetchFddbByBarcode(barcode);
    }

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
    const calories = nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 150;
    const protein = nutriments['proteins_100g'] || nutriments['proteins'] || 5;
    const fat = nutriments['fat_100g'] || nutriments['fat'] || 5;
    const carbs = nutriments['carbohydrates_100g'] || nutriments['carbohydrates'] || 15;

    res.status(200).json({
      name: product.product_name || product.product_name_de || 'Unbekanntes Produkt',
      productName: product.product_name || product.product_name_de || 'Unbekanntes Produkt',
      brand: product.brands || '',
      imageUrl: product.image_url || product.image_front_url || null,
      ingredients: product.ingredients_text || 'Keine Zutatenliste verfügbar',
      nutrients: {
        calories: `${calories} kcal`,
        protein: `${protein} g`,
        fat: `${fat} g`,
        carbs: `${carbs} g`
      },
      calories,
      protein,
      fat,
      carbs,
      toxinsCount: detectedToxins.length,
      detectedToxins: detectedToxins,
      ...analysis
    });
  } catch (err) {
    console.error("Barcode endpoint error:", err);
    res.status(500).json({ error: err.message });
  }
};
