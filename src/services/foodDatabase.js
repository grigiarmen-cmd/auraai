// Calorie & Micronutrient Food Database (Yazio / MyFitnessPal Style + Deep Nutrition)
// Contains common meals, raw whole foods, ancestral foods and junk/fast foods.

const FOOD_DATABASE = [
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

  // Ancestral & Clean Whole Foods
  {
    id: 'eier-weidebutter',
    name: '3 Rühreier / Spiegeleier in Bio-Butter',
    aliases: ['eier', 'rührei', 'spiegelei', '3 eier'],
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

// Search foods by text query or barcode name
function searchFoodDatabase(query) {
  if (!query || query.trim().length === 0) return [];
  const q = query.toLowerCase().trim();
  return FOOD_DATABASE.filter(f => 
    f.name.toLowerCase().includes(q) || 
    f.aliases.some(alias => alias.includes(q))
  );
}

module.exports = {
  FOOD_DATABASE,
  searchFoodDatabase
};
