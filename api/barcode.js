const { fetchOpenFoodFacts, generateDeepScienceAnalysis } = require('../../src/services/nutritionEngine');
const { SEED_OILS, EMULSIFIERS_ADDITIVES } = require('../../src/services/nutritionKnowledge');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const barcode = req.query.barcode || req.url.split('/').pop().split('?')[0];

  try {
    const product = await fetchOpenFoodFacts(barcode);
    if (!product) {
      return res.status(404).json({ error: 'Produkt nicht gefunden' });
    }

    const productName = product.product_name_de || product.product_name || 'Unbekanntes Produkt';
    const ingredientsText = (product.ingredients_text_de || product.ingredients_text || '').toLowerCase();
    const brand = product.brands || '';
    const imageUrl = product.image_url || product.image_front_url || '';

    const detectedSeedOils = SEED_OILS.filter(so => ingredientsText.includes(so.name));
    const detectedAdditives = EMULSIFIERS_ADDITIVES.filter(ea => ingredientsText.includes(ea.name));
    const detectedToxins = [...detectedSeedOils.map(s => s.label), ...detectedAdditives.map(a => a.label)];

    const science = await generateDeepScienceAnalysis(productName, ingredientsText, detectedToxins);

    const nutriments = product.nutriments || {};
    const calories = nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || null;
    const protein = nutriments.proteins_100g || nutriments.proteins || null;
    const fat = nutriments.fat_100g || nutriments.fat || null;
    const carbs = nutriments.carbohydrates_100g || nutriments.carbohydrates || null;

    res.status(200).json({
      barcode,
      name: productName,
      brand,
      imageUrl,
      ingredients: ingredientsText,
      novaGroup: product.nova_group || null,
      nutrients: {
        calories: calories ? `${calories} kcal / 100g` : null,
        protein: protein ? `${protein}g Protein` : null,
        fat: fat ? `${fat}g Fett` : null,
        carbs: carbs ? `${carbs}g Kohlenhydrate` : null
      },
      detectedToxins,
      hasSeedOils: detectedSeedOils.length > 0,
      hasAdditives: detectedAdditives.length > 0,
      science
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
