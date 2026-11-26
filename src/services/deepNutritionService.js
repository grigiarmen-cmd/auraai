// Deep Nutrition & Biochemical Synthesizer Engine
// Provides full 3-column nutrition (Energy, Vitamins, Minerals) & Bio-Audit
// for ANY food item (Barcode scan, FDDB search, or primal catalog).

export function getBiochemicalProfile(item) {
  const name = (item.name || '').toLowerCase();
  const brand = (item.brand || item.producer || '').toLowerCase();
  const rawKcal = Number(item.calories) || Number(item.nutrients?.calories?.match(/\d+/)?.[0]) || 150;
  const rawProt = Number(item.protein) || Number(item.nutrients?.protein?.match(/[\d.]+/)?.[0]) || 5;
  const rawFat = Number(item.fat) || Number(item.nutrients?.fat?.match(/[\d.]+/)?.[0]) || 5;
  const rawCarbs = Number(item.carbs) || Number(item.nutrients?.carbs?.match(/[\d.]+/)?.[0]) || 15;

  // Normalize serving-based catalog entries (e.g. "1 Steak (250g)" = 620 kcal) to true per-100g values!
  let servingGrams = 100;
  if (item.serving && typeof item.serving === 'string') {
    const matches = [...item.serving.matchAll(/(\d+(?:[.,]\d+)?)\s*(?:g|ml)\b/gi)];
    if (matches.length > 0) {
      const sumGrams = matches.reduce((sum, m) => sum + (parseFloat(m[1].replace(',', '.')) || 0), 0);
      if (sumGrams > 5 && sumGrams !== 100) {
        servingGrams = sumGrams;
      }
    }
  }

  const normFactor = 100 / servingGrams;
  const baseKcal = Math.round(rawKcal * normFactor);
  const baseProt = Math.round(rawProt * normFactor * 10) / 10;
  const baseFat = Math.round(rawFat * normFactor * 10) / 10;
  const baseCarbs = Math.round(rawCarbs * normFactor * 10) / 10;

  // Derive kJ from kcal
  const kj = Math.round(baseKcal * 4.184);

  // Default deep science values per 100g
  let saturatedFat = Math.round((baseFat * 0.35) * 10) / 10;
  let sugar = Math.round((baseCarbs * 0.4) * 10) / 10;
  let cholesterol = 0;
  let waterContent = 65;

  // Vitamins
  let vitA = 0; // mcg (Retinol / Carotin)
  let vitD = 0; // mcg
  let vitE = 0.5; // mg
  let vitC = 0; // mg
  let vitB1 = 0.08; // mg
  let vitB2 = 0.12; // mg
  let vitB6 = 0.15; // mg
  let vitB12 = 0; // mcg
  let folat = 15; // mcg
  let cholin = 20; // mg

  // Minerals & Trace Elements
  let magnesium = 20; // mg
  let zink = 1.0; // mg
  let eisen = 1.2; // mg
  let isHemeIron = false;
  let kalium = 220; // mg
  let kalzium = 45; // mg
  let phosphor = 90; // mg
  let chlorid = 80; // mg
  let schwefel = 70; // mg
  let selen = 8; // mcg
  let kupfer = 0.1; // mg

  // Bio-Audit & Cell-Impact
  let cellPower = 'Liefert saubere Grundenergie und Bausteine für den Zellstoffwechsel.';
  let antiNutrients = null;
  let bioScore = 75;

  const isEggItem = /(?:^|[\s,()/-])(ei|eier|hühnerei|freilandeier|bio-eier|rührei|spiegelei|eigelb|eiklar|egg|eggs)(?:$|[\s,()/-])/i.test(name);

  // 1. Eier
  if (isEggItem) {
    cholesterol = 370;
    saturatedFat = Math.round((baseFat * 0.3) * 10) / 10;
    sugar = 0.5;
    waterContent = 75;
    vitA = 270;
    vitD = 2.9;
    vitE = 2.0;
    vitB12 = 2.1;
    vitB2 = 0.42;
    cholin = 250;
    zink = 1.4;
    eisen = 1.8;
    isHemeIron = true;
    magnesium = 12;
    kalzium = 56;
    phosphor = 210;
    selen = 31;
    cellPower = 'Maximale biologische Wertigkeit (100). Reich an Cholin für Fokus, Membranfluidität & Neurotransmitter.';
    bioScore = 96;
  }
  // 2. Rindfleisch, Steaks, Hackfleisch
  else if (name.includes('steak') || name.includes('rind') || name.includes('beef') || name.includes('hack')) {
    cholesterol = 75;
    saturatedFat = Math.round((baseFat * 0.45) * 10) / 10;
    sugar = 0;
    waterContent = 62;
    vitA = 12;
    vitD = 0.5;
    vitB12 = 5.2;
    vitB6 = 0.45;
    cholin = 110;
    zink = 7.5;
    eisen = 3.6;
    isHemeIron = true;
    magnesium = 25;
    kalium = 340;
    phosphor = 220;
    selen = 26;
    cellPower = 'Hoch bioverfügbares Häm-Eisen + Zink für Testosteron, Hämoglobin-Synthese und Muskelprotein-Aufbau.';
    bioScore = 94;
  }
  // 3. Fisch (Lachs, Thunfisch, Forelle)
  else if (name.includes('lachs') || name.includes('salmon') || name.includes('fisch') || name.includes('thunfisch')) {
    cholesterol = 60;
    saturatedFat = Math.round((baseFat * 0.2) * 10) / 10;
    sugar = 0;
    waterContent = 68;
    vitD = 16.0; // Hohes D3
    vitB12 = 4.0;
    vitE = 2.5;
    kalium = 420;
    magnesium = 32;
    zink = 1.1;
    eisen = 1.0;
    isHemeIron = true;
    selen = 40;
    cellPower = 'Essentielle Omega-3 Fettsäuren (EPA & DHA) für zelluläre Membranflexibilität und Entzündungshemmung.';
    bioScore = 95;
  }
  // 4. Früchte (Mango, Apfel, Beeren, Banane)
  else if (name.includes('mango') || name.includes('apfel') || name.includes('beere') || name.includes('banane') || name.includes('obst') || name.includes('frucht')) {
    cholesterol = 0;
    saturatedFat = 0.1;
    sugar = Math.round(baseCarbs * 0.75 * 10) / 10;
    waterContent = 84;
    vitC = name.includes('mango') ? 36 : (name.includes('beere') ? 45 : 12);
    vitA = name.includes('mango') ? 180 : 8;
    folat = 25;
    kalium = 240;
    magnesium = 14;
    zink = 0.2;
    eisen = 0.3;
    cellPower = 'Zelluläres Strukturwasser & Polyphenole zum Schutz der Mitochondrien vor oxidativem Stress.';
    bioScore = 88;
  }
  // 5. Milch & Weideprodukte (Butter, Rohmilch, Käse, Joghurt)
  else if (name.includes('milch') || name.includes('butter') || name.includes('käse') || name.includes('quark') || name.includes('joghurt')) {
    cholesterol = name.includes('butter') ? 240 : 45;
    saturatedFat = Math.round((baseFat * 0.65) * 10) / 10;
    sugar = baseCarbs;
    waterContent = name.includes('butter') ? 16 : 85;
    vitA = name.includes('butter') ? 680 : 40;
    vitD = 1.2;
    kalzium = name.includes('käse') ? 800 : (name.includes('quark') ? 120 : 130);
    magnesium = 12;
    zink = 1.5;
    vitB12 = 0.8;
    cellPower = 'Perfekt resorbierbares Calcium mit Kofaktoren für Knochenstoffwechsel und Muskelkontraktion.';
    bioScore = 90;
  }
  // 6. Getreide & Fast Food / Industriell
  else if (name.includes('pizza') || name.includes('döner') || name.includes('burger') || name.includes('toast') || name.includes('brot') || name.includes('nudeln') || name.includes('chips')) {
    cholesterol = 35;
    saturatedFat = Math.round((baseFat * 0.4) * 10) / 10;
    sugar = Math.round((baseCarbs * 0.15) * 10) / 10;
    waterContent = 45;
    vitB1 = 0.15;
    kalium = 180;
    magnesium = 22;
    eisen = 1.8;
    antiNutrients = 'Hoher Anteil an raffiniertem Weizenmehl, Phytinsäure und industriellen Frittier- oder Pflanzenölen.';
    cellPower = 'Schnelle Glukoseverfügbarkeit mit erhöhtem Insulin-Peak. Belastet die zelluläre Insulinsensitivität.';
    bioScore = 48;
  }

  // Smart Portions available for this item
  const smartPortions = [];
  if (isEggItem) {
    smartPortions.push({ label: '1 Stück (48g)', grams: 48 });
    smartPortions.push({ label: '1 Großes (63g)', grams: 63 });
    smartPortions.push({ label: '1 Stück XL (73g)', grams: 73 });
    smartPortions.push({ label: '100g Standard', grams: 100 });
  } else if (name.includes('mango') || name.includes('chunks')) {
    smartPortions.push({ label: '1 Portion Chunks (160g)', grams: 160 });
    smartPortions.push({ label: '1 halbe Mango (100g)', grams: 100 });
    smartPortions.push({ label: '1 ganze Frucht (250g)', grams: 250 });
  } else if (name.includes('apfel') || name.includes('birne') || name.includes('orange')) {
    smartPortions.push({ label: '1 kleines Stück (120g)', grams: 120 });
    smartPortions.push({ label: '1 normales Stück (160g)', grams: 160 });
    smartPortions.push({ label: '100g Standard', grams: 100 });
  } else if (name.includes('steak') || name.includes('fleisch') || name.includes('filet')) {
    smartPortions.push({ label: '1 kleines Steak (180g)', grams: 180 });
    smartPortions.push({ label: '1 normales Steak (250g)', grams: 250 });
    smartPortions.push({ label: '1 Männer-Portion (350g)', grams: 350 });
    smartPortions.push({ label: '100g Basis', grams: 100 });
  } else {
    smartPortions.push({ label: '1 Portion (150g)', grams: 150 });
    smartPortions.push({ label: '100g Standard', grams: 100 });
    smartPortions.push({ label: '1 Packung (250g)', grams: 250 });
  }

  return {
    per100g: {
      brennwertKj: kj,
      calories: baseKcal,
      protein: baseProt,
      fat: baseFat,
      saturatedFat,
      carbs: baseCarbs,
      sugar,
      cholesterol,
      waterContent,
      vitamins: {
        vitA,
        vitD,
        vitE,
        vitC,
        vitB1,
        vitB2,
        vitB6,
        vitB12,
        folat,
        cholin
      },
      minerals: {
        magnesium,
        zink,
        eisen,
        isHemeIron,
        kalium,
        kalzium,
        phosphor,
        chlorid,
        schwefel,
        selen,
        kupfer
      }
    },
    smartPortions,
    bioScore,
    cellPower,
    antiNutrients
  };
}

// Dynamically scale all biochemical values to any given grams
export function scaleBiochemicalValues(profile, grams = 100) {
  const factor = (parseFloat(grams) || 100) / 100;
  const p = profile.per100g;

  return {
    grams,
    brennwertKj: Math.round(p.brennwertKj * factor),
    calories: Math.round(p.calories * factor),
    protein: Math.round(p.protein * factor * 10) / 10,
    fat: Math.round(p.fat * factor * 10) / 10,
    saturatedFat: Math.round(p.saturatedFat * factor * 10) / 10,
    carbs: Math.round(p.carbs * factor * 10) / 10,
    sugar: Math.round(p.sugar * factor * 10) / 10,
    cholesterol: Math.round(p.cholesterol * factor),
    waterContent: p.waterContent,
    vitamins: {
      vitA: Math.round(p.vitamins.vitA * factor * 10) / 10,
      vitD: Math.round(p.vitamins.vitD * factor * 100) / 100,
      vitE: Math.round(p.vitamins.vitE * factor * 10) / 10,
      vitC: Math.round(p.vitamins.vitC * factor * 10) / 10,
      vitB1: Math.round(p.vitamins.vitB1 * factor * 100) / 100,
      vitB2: Math.round(p.vitamins.vitB2 * factor * 100) / 100,
      vitB6: Math.round(p.vitamins.vitB6 * factor * 100) / 100,
      vitB12: Math.round(p.vitamins.vitB12 * factor * 10) / 10,
      folat: Math.round(p.vitamins.folat * factor),
      cholin: Math.round(p.vitamins.cholin * factor)
    },
    minerals: {
      magnesium: Math.round(p.minerals.magnesium * factor * 10) / 10,
      zink: Math.round(p.minerals.zink * factor * 10) / 10,
      eisen: Math.round(p.minerals.eisen * factor * 10) / 10,
      isHemeIron: p.minerals.isHemeIron,
      kalium: Math.round(p.minerals.kalium * factor),
      kalzium: Math.round(p.minerals.kalzium * factor),
      phosphor: Math.round(p.minerals.phosphor * factor),
      chlorid: Math.round(p.minerals.chlorid * factor),
      schwefel: Math.round(p.minerals.schwefel * factor),
      selen: Math.round(p.minerals.selen * factor),
      kupfer: Math.round(p.minerals.kupfer * factor * 100) / 100
    },
    smartPortions: profile.smartPortions,
    bioScore: profile.bioScore,
    cellPower: profile.cellPower,
    antiNutrients: profile.antiNutrients
  };
}
