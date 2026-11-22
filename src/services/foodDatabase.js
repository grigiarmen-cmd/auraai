// Calorie & Micronutrient Food Database (Yazio / MyFitnessPal Style + Deep Nutrition + FDDB Live Proxy)
const https = require('https');

const FOOD_DATABASE = [
  // Eier & Eierspeisen (Erweitert)
  {
    id: 'ei-mittelgross',
    name: 'Ei, vom Huhn (Naturprodukt)',
    aliases: ['ei', 'eier', 'hühnerei', 'egg', 'frische eier'],
    serving: '1 mittelgroßes Ei (ca. 55g)',
    calories: 86,
    protein: 7.2,
    fat: 6.2,
    carbs: 0.6,
    micros: { cholin: '140 mg', retinol: '160 mcg', zink: '1.0 mg', lutein: '400 mcg', vitaminB12: '1.1 mcg' },
    isClean: true,
    warning: null
  },
  {
    id: 'eier-weidebutter',
    name: '3 Rühreier / Spiegeleier in Bio-Butter',
    aliases: ['eier', 'rührei', 'spiegelei', '3 eier', 'ruehrei'],
    serving: '3 große Eier (180g) + 15g Butter',
    calories: 340,
    protein: 21,
    fat: 28,
    carbs: 1.5,
    micros: { cholin: '420 mg', retinol: '480 mcg', zink: '3.1 mg', lutein: '1200 mcg' },
    isClean: true,
    warning: null
  },
  {
    id: 'eiklar-eiweiss',
    name: 'Eiklar / Eiweiß (flüssig)',
    aliases: ['eiklar', 'eiweiss', 'eiweiß', 'egg whites'],
    serving: '100g (ca. 3 Eiklar)',
    calories: 48,
    protein: 11.0,
    fat: 0.2,
    carbs: 0.7,
    micros: { kalium: '160 mg', natrium: '170 mg' },
    isClean: true,
    warning: null
  },
  {
    id: 'eigelb-dotter',
    name: 'Eigelb / Dotter',
    aliases: ['eigelb', 'dotter', 'egg yolk'],
    serving: '1 Eigelb (ca. 18g)',
    calories: 55,
    protein: 2.7,
    fat: 4.5,
    carbs: 0.6,
    micros: { cholin: '120 mg', retinol: '130 mcg', vitaminD: '1.1 mcg' },
    isClean: true,
    warning: null
  },
  {
    id: 'bio-eier-packung',
    name: 'Bio-Eier (Freilandhaltung Kl. A)',
    aliases: ['bio eier', 'freilandeier', 'eier aldi', 'eier lidl', 'eier rewe'],
    serving: '100g',
    calories: 153,
    protein: 13.0,
    fat: 11.0,
    carbs: 0.6,
    micros: { cholin: '290 mg', retinol: '320 mcg', zink: '1.8 mg', vitaminB12: '2.0 mcg' },
    isClean: true,
    warning: null
  },

  // Steaks & Rindfleisch-Variationen
  {
    id: 'steak-butter',
    name: 'Rumpsteak / Entrecôte in Weidebutter',
    aliases: ['steak', 'entrecote', 'rindersteak', 'rumpsteak', 'beef'],
    serving: '1 Steak (250g)',
    calories: 620,
    protein: 62,
    fat: 41,
    carbs: 0,
    micros: { zink: '12.5 mg', vitaminB12: '6.2 mcg', iron: '4.8 mg (Häm-Eisen)', cholin: '180 mg' },
    isClean: true,
    warning: null
  },
  {
    id: 'ribeye-steak',
    name: 'Ribeye Steak (Gegrillt)',
    aliases: ['ribeye', 'rib eye', 'steak ribeye', 'hochrippe'],
    serving: '1 Steak (300g)',
    calories: 780,
    protein: 68,
    fat: 56,
    carbs: 0,
    micros: { zink: '14.1 mg', vitaminB12: '7.5 mcg', iron: '5.2 mg' },
    isClean: true,
    warning: null
  },
  {
    id: 'filet-steak',
    name: 'Rinderfilet / Tenderloin Steak',
    aliases: ['filet', 'rinderfilet', 'filetsteak', 'tenderloin', 'steak filet'],
    serving: '1 Filet (200g)',
    calories: 420,
    protein: 52,
    fat: 22,
    carbs: 0,
    micros: { zink: '11.0 mg', vitaminB12: '5.8 mcg', iron: '4.5 mg' },
    isClean: true,
    warning: null
  },
  {
    id: 'steak-frites',
    name: 'Steak mit Pommes Frites',
    aliases: ['steak pommes', 'steak frites', 'steak mit beilage'],
    serving: '1 Portion (200g Steak, 150g Pommes)',
    calories: 740,
    protein: 52,
    fat: 42,
    carbs: 48,
    micros: { zink: '9.5 mg', kalium: '850 mg', vitaminC: '15 mg' },
    isClean: false,
    warning: 'Pommes werden meist in oxidiertem Frittieröl (Raps/Sonnenblume) zubereitet.'
  },
  {
    id: 'rinderhack-bio',
    name: 'Bio-Rinderhackfleisch (Weiderind)',
    aliases: ['hackfleisch', 'hack', 'rinderhack', 'ground beef'],
    serving: '1 Portion (200g)',
    calories: 510,
    protein: 42,
    fat: 38,
    carbs: 0,
    micros: { zink: '10.2 mg', vitaminB12: '5.1 mcg', iron: '4.1 mg' },
    isClean: true,
    warning: null
  },

  // Fast Food & Gängige Mahlzeiten
  {
    id: 'pizza-margherita',
    name: 'Pizza Margherita (ganz)',
    aliases: ['pizza margherita', 'pizza', 'margherita'],
    serving: '1 Pizza (ca. 350g)',
    calories: 820,
    protein: 32,
    fat: 28,
    carbs: 110,
    micros: { zink: '2.1 mg', magnesium: '45 mg', vitaminC: '4 mg', iron: '3.2 mg', sodium: '1850 mg' },
    isClean: false,
    warning: 'Raffinierter Weizen & Industrie-Käse. Schnelle Insulinausschüttung.'
  },
  {
    id: 'pizza-salami',
    name: 'Pizza Salami',
    aliases: ['pizza salami', 'salamipizza'],
    serving: '1 Pizza (ca. 380g)',
    calories: 960,
    protein: 38,
    fat: 42,
    carbs: 108,
    micros: { zink: '3.0 mg', magnesium: '48 mg', vitaminC: '3 mg', iron: '3.8 mg', sodium: '2400 mg' },
    isClean: false,
    warning: 'Nitritpökelsalz & oxidierte tierische Fette bei Ofenhitze.'
  },
  {
    id: 'doener-kebab',
    name: 'Döner Kebab (Fladenbrot)',
    aliases: ['döner', 'kebab', 'doener'],
    serving: '1 Döner (ca. 400g)',
    calories: 750,
    protein: 42,
    fat: 35,
    carbs: 68,
    micros: { zink: '4.5 mg', magnesium: '62 mg', vitaminC: '18 mg', iron: '4.2 mg', sodium: '1900 mg' },
    isClean: false,
    warning: 'Soßen enthalten oft Rapsöl/Zucker. Hackfleisch-Spieß mit Phosphaten.'
  },
  {
    id: 'cheeseburger',
    name: 'Cheeseburger / Smashburger',
    aliases: ['burger', 'cheeseburger', 'hamburger', 'smashburger'],
    serving: '1 Burger (ca. 220g)',
    calories: 580,
    protein: 34,
    fat: 32,
    carbs: 42,
    micros: { zink: '5.2 mg', calcium: '210 mg', iron: '3.5 mg' },
    isClean: false,
    warning: 'Brioche-Bun oft mit Pflanzenöl & Zucker. Schmelzkäsezubereitung.'
  },
  {
    id: 'haehnchen-reis',
    name: 'Hähnchenbrust mit Jasminreis & Brokkoli',
    aliases: ['hähnchen reis', 'hühnchen reis', 'fitness teller', 'chicken rice', 'reis huhn'],
    serving: '1 Portion (200g Huhn, 150g Reis)',
    calories: 540,
    protein: 52,
    fat: 6,
    carbs: 68,
    micros: { zink: '2.8 mg', magnesium: '55 mg', vitaminC: '45 mg', iron: '2.1 mg', potassium: '680 mg' },
    isClean: true,
    warning: null
  },

  // Ancestral, Obst & Whole Foods
  {
    id: 'mango-chunks',
    name: 'Mango Chunks (Gefroren / Frisch)',
    aliases: ['mango', 'mangos', 'mango chunks', 'mango lidl'],
    serving: '160g Portion',
    calories: 105,
    protein: 0.8,
    fat: 0.8,
    carbs: 22.7,
    micros: { vitaminC: '58 mg', vitaminA: '180 mcg', kalium: '260 mg' },
    isClean: true,
    warning: null
  },
  {
    id: 'rohmilch-glas',
    name: 'Frische Demeter Weiderohmilch',
    aliases: ['rohmilch', 'milch', 'weidemilch', 'glas milch', 'raw milk'],
    serving: '1 Glas (300 ml)',
    calories: 195,
    protein: 10.2,
    fat: 12.0,
    carbs: 14.4,
    micros: { calcium: '360 mg', vitaminK2: '8.4 mcg', lactoferrin: 'High' },
    isClean: true,
    warning: null
  },
  {
    id: 'lachs-avocado',
    name: 'Wildlachs mit halber Avocado',
    aliases: ['lachs', 'wildlachs', 'salmon', 'avocado lachs'],
    serving: '200g Lachs + 80g Avocado',
    calories: 480,
    protein: 44,
    fat: 32,
    carbs: 3,
    micros: { omega3: '3.8g (DHA/EPA)', astaxanthin: '4 mg', kalium: '820 mg', vitaminD: '18 mcg' },
    isClean: true,
    warning: null
  },
  {
    id: 'haferflocken-beeren',
    name: 'Haferflocken mit Beeren & Honig',
    aliases: ['haferflocken', 'oats', 'porridge', 'müsli'],
    serving: '1 Schüssel (80g Hafer, 100g Beeren)',
    calories: 390,
    protein: 12,
    fat: 6,
    carbs: 72,
    micros: { magnesium: '110 mg', zink: '2.9 mg', vitaminC: '25 mg', iron: '3.6 mg' },
    isClean: true,
    warning: 'Phytinsäure hemmt Mineralstoffresorption. Einweichen empfohlen.'
  },
  {
    id: 'nutella-toast',
    name: 'Toast mit Nutella (2 Scheiben)',
    aliases: ['nutella', 'nutellabrot', 'schokotoast'],
    serving: '2 Scheiben Toast (60g) + 35g Nutella',
    calories: 380,
    protein: 6,
    fat: 14,
    carbs: 58,
    micros: { zink: '0.8 mg', magnesium: '22 mg', iron: '1.1 mg', sugar: '34g Reiner Zucker' },
    isClean: false,
    warning: 'Palmöl & starker Fruktose/Glukose-Spike. Belastet Leber & Triglyceride.'
  }
];

// Live FDDB Scraper Query (Fetches live catalog items from fddb.mobi)
function fetchFddbFoods(query) {
  return new Promise((resolve) => {
    if (!query || query.trim().length < 2) return resolve([]);
    
    const url = `https://fddb.mobi/search/?lang=de&cat=mobile-de&search=${encodeURIComponent(query.trim())}`;
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36'
      },
      timeout: 3500
    };

    const req = https.get(url, options, (res) => {
      if (res.statusCode !== 200) {
        return resolve([]);
      }
      let html = '';
      res.on('data', chunk => { html += chunk; });
      res.on('end', () => {
        try {
          const items = [];
          const parts = html.split("<li class='fddb-m-result'>");
          for (let i = 1; i < parts.length && items.length < 15; i++) {
            const chunk = parts[i];
            const nameMatch = chunk.match(/<span class='fddb-m-result__name'>([^<]+)<\/span>/);
            const prodMatch = chunk.match(/<span class='fddb-m-result__producer'>([^<]+)<\/span>/);
            const thumbMatch = chunk.match(/<img[^>]*src='([^']+)'/);
            
            // Extract servings & macro lines
            const servingMatches = [...chunk.matchAll(/<span class='fddb-m-result__stats'>([^<]+<strong>(\d+)\s*kcal<\/strong>[^<]+)<\/span>/g)];
            
            let defaultCalories = 100;
            let defaultFat = 0;
            let defaultCarbs = 0;
            let defaultServing = '100g';

            if (servingMatches.length > 0) {
              const firstRaw = servingMatches[0][1];
              const cleanLine = firstRaw.replace(/&middot;/g, '•').replace(/&szlig;/g, 'ß').replace(/<strong>|<\/strong>/g, '').trim();
              defaultServing = cleanLine.split(':')[0] || '100g';
              
              const calM = cleanLine.match(/(\d+)\s*kcal/);
              if (calM) defaultCalories = parseInt(calM[1], 10);
              
              const fatM = cleanLine.match(/Fett:\s*([\d,]+)\s*g/);
              if (fatM) defaultFat = parseFloat(fatM[1].replace(',', '.'));
              
              const carbM = cleanLine.match(/KH:\s*([\d,]+)\s*g/);
              if (carbM) defaultCarbs = parseFloat(carbM[1].replace(',', '.'));
            }

            if (nameMatch) {
              const prodName = prodMatch ? `${prodMatch[1]} - ${nameMatch[1]}` : nameMatch[1];
              items.push({
                id: 'fddb_' + i + '_' + Date.now(),
                name: prodName,
                serving: defaultServing,
                calories: defaultCalories,
                protein: Math.round(((defaultCalories - (defaultFat * 9) - (defaultCarbs * 4)) / 4) * 10) / 10 || 5,
                fat: defaultFat,
                carbs: defaultCarbs,
                image: thumbMatch ? thumbMatch[1] : null,
                isClean: true,
                source: 'FDDB'
              });
            }
          }
          resolve(items);
        } catch (err) {
          resolve([]);
        }
      });
    });

    req.on('error', () => resolve([]));
    req.on('timeout', () => { req.destroy(); resolve([]); });
  });
}

// Search foods combining curated primal database + FDDB live results
async function searchFoodDatabase(query) {
  if (!query || query.trim().length === 0) return [];
  const q = query.toLowerCase().trim();
  
  // 1. Local Curated Primal Results
  const localMatches = FOOD_DATABASE.filter(f => 
    f.name.toLowerCase().includes(q) || 
    f.aliases.some(alias => alias.includes(q))
  );

  // 2. Fetch FDDB Live Results
  let fddbMatches = [];
  try {
    fddbMatches = await fetchFddbFoods(query);
  } catch(e) {}

  // Filter out any duplicates and return combined list
  const seen = new Set(localMatches.map(m => m.name.toLowerCase()));
  const combined = [...localMatches];

  for (const item of fddbMatches) {
    if (!seen.has(item.name.toLowerCase())) {
      combined.push(item);
      seen.add(item.name.toLowerCase());
    }
  }

  return combined;
}

module.exports = {
  FOOD_DATABASE,
  searchFoodDatabase
};
