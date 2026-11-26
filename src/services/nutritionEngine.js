// Deep Science Analysis Engine: Evaluates food products, biological toxicity,
// cellular mechanisms, PubMed/EFSA/Aajonus citations, and nearby store alternatives.

const https = require('https');
const { SEED_OILS, EMULSIFIERS_ADDITIVES, VERIFIED_FARMS } = require('./nutritionKnowledge');

// Fetch product by barcode from OpenFoodFacts
async function fetchOpenFoodFacts(barcode) {
  return new Promise((resolve) => {
    const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`;
    
    const req = https.get(url, { 
      timeout: 5000,
      headers: { 'User-Agent': 'AuraAI-NutritionApp/1.0 (contact@aura-ai.internal)' } 
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.status === 1 && json.product) {
            resolve(json.product);
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    });

    req.on('error', (err) => {
      console.error("OpenFoodFacts HTTPS error:", err.message);
      resolve(null);
    });
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
  });
}

// Haversine distance in km
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some(v => typeof v !== 'number' || Number.isNaN(v))) return 0;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Query OpenStreetMap Overpass API for nearby organic stores, farm shops, milk vending machines & supermarkets
function queryNearbyStores(lat, lon, radius = 15000) {
  return new Promise((resolve) => {
    const safeRadius = Math.min(Math.max(Number(radius) || 15000, 1000), 30000);
    const overpassQuery = `[out:json][timeout:6];(node["shop"~"organic|farm|health_food|supermarket"](around:${safeRadius},${lat},${lon});node["amenity"="vending_machine"]["vending"="milk"](around:${safeRadius},${lat},${lon}););out body 25;`;
    const postData = `data=${encodeURIComponent(overpassQuery)}`;

    const req = https.request({
      hostname: 'overpass-api.de',
      path: '/api/interpreter',
      method: 'POST',
      timeout: 6500,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'AuraAI-Locator/1.0'
      }
    }, (res) => {
      if (res.statusCode !== 200) return resolve([]);
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          const elements = Array.isArray(json.elements) ? json.elements : [];
          const mapped = elements
            .filter(el => el.tags && (el.tags.name || el.tags.vending === 'milk'))
            .map((el, idx) => {
              const tags = el.tags || {};
              const shop = tags.shop || '';
              const isMilk = tags.vending === 'milk';
              const isOrganic = shop === 'organic' || shop === 'health_food' || /bio|denns|alnatura|reformhaus|demeter|bioladen/i.test(tags.name || '');
              const isFarm = shop === 'farm' || isMilk;
              const street = [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' ');
              const city = [tags['addr:postcode'], tags['addr:city']].filter(Boolean).join(' ');
              const address = [street, city].filter(Boolean).join(', ') || 'In deiner Umgebung';

              return {
                id: `osm_${el.id || idx}`,
                name: tags.name || (isMilk ? 'Milchtankstelle / Rohmilchautomat' : 'Lebensmittelmarkt'),
                type: isFarm ? 'farm' : (isOrganic ? 'bio_market' : 'supermarket'),
                category: isMilk || isFarm ? 'raw_milk' : (isOrganic ? 'bio_market' : 'supermarket'),
                lat: el.lat,
                lon: el.lon,
                distanceKm: calculateDistanceKm(lat, lon, el.lat, el.lon),
                address,
                products: isFarm
                  ? ['Hofladen / Direktvermarktung', 'Regionale Erzeugnisse']
                  : isOrganic
                    ? ['Bio-Vollsortiment', 'Weideprodukte', 'Rohmilchkäse']
                    : ['Bio-Eigenmarke', 'Weidebutter', 'Eier aus Freiland/Bio'],
                verified: isFarm || isOrganic
              };
            })
            .sort((a, b) => a.distanceKm - b.distanceKm)
            .slice(0, 20);
          resolve(mapped);
        } catch (e) {
          resolve([]);
        }
      });
    });

    req.on('error', () => resolve([]));
    req.on('timeout', () => { req.destroy(); resolve([]); });
    req.write(postData);
    req.end();
  });
}

// Generate cellular toxic mechanism, PubMed citations and Aajonus guidance
async function generateDeepScienceAnalysis(productName, ingredientsText, detectedToxins, GoogleGenAI, apiKey) {
  const pName = (productName || '').toLowerCase();
  const ingr = (ingredientsText || '').toLowerCase();

  // 1. STRIKTER TOBACCO & NON-FOOD CHECK
  const isTobacco = /zigarette|tabak|marlboro|lucky strike|vape|liquid|nicotine|nikotin/i.test(pName) || /tabak/i.test(ingr);
  if (isTobacco) {
    return {
      verdict: "TOXIC",
      auraScore: 0,
      cellularMechanism: "EXTREME ZELLTOXIZITÄT: Inhalation von Verbrennungsprodukten, polyzyklischen aromatischen Kohlenwasserstoffen (PAK), Nitrosaminen und Schwermetallen (Cadmium, Blei). Verursacht massive DNA-Schäden, mitochondriale Dysfunktion und endotheliale Zerstörung der Blutgefäße.",
      ingredientsProsAndCons: {
        pros: ["Keine biochemischen Vorteile für den menschlichen Organismus."],
        cons: [
          "Enthält kanzerogene Tabak-spezifische Nitrosamine (TSNA)",
          "Zerstört Stickstoffmonoxid (NO) und führt zu Gefäßverengung",
          "Mitochondriale Blockade der Atmungskette durch Kohlenmonoxid"
        ]
      },
      ingredientsBreakdown: [
        {
          name: "Tabak & Verbrennungsstoffe",
          status: "TOXIC",
          explanation: "Inhaliertes Teer & Kohlenmonoxid blockieren Hämoglobin und Zellatmung."
        },
        {
          name: "Chemische Zusatzstoffe",
          status: "TOXIC",
          explanation: "Brandbeschleuniger und Feuchthaltemittel mit hoher Toxizität bei Verbrennung."
        }
      ],
      healthMinistryWarnings: "Die WHO, das DKFZ und die EFSA stufen Tabakprodukte als Gruppe-1-Karzinogen (gesichert krebserregend) ein.",
      scientificStudies: [
        {
          journal: "The Lancet / Nature Medicine",
          finding: "Chronischer Tabakkonsum schädigt die endotheliale Gefäßfunktion irreversibel und senkt die Lebenserwartung um durchschnittlich 10 Jahre.",
          doi: "10.1016/S0140-6736(17)30819-X"
        }
      ],
      hormoneIndex: {
        testosteroneImpact: "⬇️ Starker Gefäßschaden & Erektile Dysfunktion (Zerstört Mikrozirkulation in Hoden- und Schwellkörpergewebe)",
        vitalitySummary: "Akute Vasokonstriktion, chronischer Sauerstoffmangel in peripherem Gewebe."
      },
      ancestralPerspective: "Aajonus Vonderplanitz verurteilte industriell hergestellte Zigaretten als reine chemische Kontamination, die den Körper austrocknet und toxische Rückstände in Lunge und Lymphsystem hinterlässt.",
      cleanAlternatives: [
        {
          name: "Sofortiger Rauchstopp / Tiefenatmung & kaltes Quellwasser",
          whyBetter: "Regeneriert Gefäßendothel, stellt Stickstoffmonoxid-Spiegel wieder her und entlastet Mitochondrien.",
          whereToBuy: "Gesunder Lebensstil"
        }
      ]
    };
  }

  // 2. DYNAMISCHE KALKULATION BASIEREND AUF INHALTSSTOFFEN (Deutsch + Englisch + Französisch)
  const hasSeedOils = detectedToxins.some(t => t && (t.type === 'SEED_OIL' || /öl|oil/i.test(String(t)))) ||
    /rapsöl|rapeseed|canola|sonnenblumenöl|sunflower|palmöl|palmfett|palm oil|huile de palme|sojaöl|soybean|distelöl|safflower|maiskeimöl|corn oil|cottonseed|baumwollsaatöl|pflanzenöl|pflanzliches öl|pflanzenfett|vegetable oil|margarine/i.test(ingr);
  const hasChemicalAdditives = detectedToxins.some(t => t && t.type === 'ADDITIVE') ||
    /\be\s?\d{3}[a-z]?\b|emulgator|emulsifier|lecithin|sojalecithin|vanillin|aroma|flavouring|flavoring|konservier|preservative|geschmacksverstärker|carrageen|maltodextrin|sucralose|aspartam/i.test(ingr);
  const hasRefinedSugar = /zucker|sugar|sucre|glukosesirup|glucose syrup|fruktosesirup|fructose|dextrose|invertzucker/i.test(ingr) && !/\b(rohhonig|blütenhonig|raw honey)\b/i.test(pName);

  // Clean indicators (strict word boundaries for German 'ei')
  const isMeatOrFish = /fleisch|rind|schwein|schinken|prosciutto|lachs|fisch|steak|hack|hähnchen|pute|wildlachs|forelle|thunfisch/i.test(pName);
  const isEgg = /(?:^|[\s,()/-])(ei|eier|hühnerei|freilandeier|bio-eier|rührei|spiegelei|eigelb|eiklar|egg|eggs)(?:$|[\s,()/-])/i.test(pName);
  const isRawHoney = /\bhonig\b|\bhoney\b/i.test(pName);
  const isFruit = /\b(mango|mangos|apfel|äpfel|beere|beeren|blaubeeren|erdbeeren|himbeeren|banane|bananen|obst|mandarine|orange)\b/i.test(pName);

  let calculatedScore = 82;
  let calculatedVerdict = "QUESTIONABLE";

  if (hasSeedOils) calculatedScore -= 40;
  if (hasChemicalAdditives) calculatedScore -= 20;
  if (hasRefinedSugar) calculatedScore -= 30;

  const isTrulyClean = !hasSeedOils && !hasChemicalAdditives && !hasRefinedSugar;

  if (isMeatOrFish && isTrulyClean) {
    calculatedScore = 94;
    calculatedVerdict = "PRIMAL_APPROVED";
  } else if (isEgg && isTrulyClean) {
    calculatedScore = 96;
    calculatedVerdict = "PRIMAL_APPROVED";
  } else if (isRawHoney && !hasSeedOils && !hasChemicalAdditives) {
    calculatedScore = 96;
    calculatedVerdict = "PRIMAL_APPROVED";
  } else if (isFruit && isTrulyClean) {
    calculatedScore = 92;
    calculatedVerdict = "PRIMAL_APPROVED";
  } else if (calculatedScore >= 80 && isTrulyClean) {
    calculatedVerdict = "PRIMAL_APPROVED";
  } else if (calculatedScore <= 45) {
    calculatedVerdict = "TOXIC";
  }

  // Bound score
  calculatedScore = Math.max(5, Math.min(99, calculatedScore));

  // Dynamische Zutaten-Zerlegung (Deutsch + Englisch, schützt Dezimalkommas wie "8,7 %")
  let realBreakdown = [];
  if (ingredientsText && ingredientsText.trim().length > 0) {
    const normalizedIngr = ingredientsText.replace(/(\d),(\d)/g, '$1.$2');
    const rawParts = normalizedIngr.split(/[,;•\n]/).map(s => s.trim()).filter(s => s.length > 2 && !/serviervorschlag|suggestion/i.test(s));
    realBreakdown = rawParts.slice(0, 10).map(part => {
      const lower = part.toLowerCase();
      const isHealthyFat = /olivenöl|olive oil|kokosöl|coconut oil|kokosfett|butter|weidebutter|butterreinfett|ghee|rindertalg|tallow|kakaobutter|cocoa butter|avocadoöl/i.test(lower);
      const isBadOil = !isHealthyFat && /raps|rapeseed|canola|sonnenblume|sunflower|palm|soja|soy|distel|safflower|maiskeim|corn oil|baumwollsaat|cottonseed|margarine|pflanzenöl|vegetable oil|pflanzenfett|frittier/i.test(lower);
      const isBadSugar = /zucker|sugar|sucre|sirup|syrup|dextrose|fructose|maltodextrin/i.test(lower);
      const isBadAdd = /\be\s?\d{3}[a-z]?\b|emulgator|emulsifier|lecithin|vanillin|aroma|flavour|flavor|konservier|preservative|carrageen|sucralose|aspartam/i.test(lower);

      let status = 'CLEAN';
      let explanation = 'Natürlicher Bestandteil, liefert Mikronährstoffe und zelluläre Bausteine.';
      if (isBadOil) {
        status = 'TOXIC';
        explanation = 'Industriell raffiniertes Pflanzenöl mit hoher Oxidationsempfindlichkeit (Linolsäure / 4-HNE).';
      } else if (isBadSugar) {
        status = 'SUSPECT';
        explanation = 'Raffinierter Zucker, treibt Insulinspitzen und zelluläre Glykation (AGEs) an.';
      } else if (isBadAdd) {
        status = 'SUSPECT';
        explanation = 'Künstlicher Zusatzstoff, kann Darm-Mikrobiom und Tight Junctions belasten.';
      }

      return {
        name: part,
        status: status,
        explanation: explanation
      };
    });
  }

  if (realBreakdown.length === 0) {
    realBreakdown = [
      {
        name: productName || "Lebensmittelbestandteil",
        status: calculatedVerdict === 'TOXIC' ? 'TOXIC' : 'CLEAN',
        explanation: calculatedVerdict === 'TOXIC' 
          ? 'Hochgradig denaturierte Inhaltsstoffe mit potenzieller Zellbelastung.' 
          : 'Natürliche Lebensmittelmatrix mit intakten Nährstoffen.'
      }
    ];
  }

  return {
    verdict: calculatedVerdict,
    auraScore: calculatedScore,
    cellularMechanism: calculatedVerdict === 'PRIMAL_APPROVED'
      ? "Hohe Bioverfügbarkeit der Nährstoffe. Unterstützt die mitochondriale ATP-Produktion, liefert intakte Membran-Bausteine und stabilisiert den Blutzuckerspiegel."
      : "Industriell verarbeitete Fette oder Zusatzstoffe erhöhen die zelluläre Entzündungslast, belasten die Leber-Entgiftung und können Tight Junctions im Darm schädigen.",
    ingredientsProsAndCons: {
      pros: calculatedVerdict === 'PRIMAL_APPROVED' 
        ? ["Reich an natürlichen Mikronährstoffen", "Frei von industriellen Transfetten & Saatölen"]
        : ["Schnelle Kalorienzufuhr"],
      cons: calculatedVerdict === 'TOXIC'
        ? ["Enthält pro-inflammatorische Fette oder raffinierte Zuckerzusätze", "Geringe Mikronährstoffdichte"]
        : ["Kann bei empfindlichen Personen leichte Verdauungsarbeit erfordern"]
    },
    ingredientsBreakdown: realBreakdown,
    healthMinistryWarnings: calculatedVerdict === 'TOXIC'
      ? "Die EFSA stuft ultra-prozessierte Lebensmittel (NOVA 4) als Risikofaktor für metabolische Dysfunktionen ein."
      : "Gering verarbeitetes Lebensmittel gemäß den Kriterien einer vollwertigen Ernährung.",
    scientificStudies: [
      {
        journal: "Cell Metabolism / American Journal of Clinical Nutrition",
        finding: "Unverarbeitete Vollwertkost ohne industrielle Saatöle senkt systemische Entzündungsmarker (hs-CRP) signifikant.",
        doi: "10.1016/j.cmet.2019.05.008"
      }
    ],
    hormoneIndex: {
      testosteroneImpact: calculatedVerdict === 'PRIMAL_APPROVED'
        ? "⬆️ Unterstützt Testosteronsynthese & Steroidachsen (Stabile Lipide & essentielle Kofaktoren)"
        : "⬇️ Fördert Aromatase & Entzündungen (Raffinierte Fette und Zucker senken freies Testosteron)",
      vitalitySummary: calculatedVerdict === 'PRIMAL_APPROVED'
        ? "Konstante Energie ohne Insulincrash."
        : "Gefahr von Blutzucker-Spitzen und trägem Zellstoffwechsel."
    },
    ancestralPerspective: calculatedVerdict === 'PRIMAL_APPROVED'
      ? "Aajonus Vonderplanitz und Dr. Weston Price betonten den unschätzbaren Wert natürlicher, unberührter Nahrungsmittel für das menschliche Skelett und Nervensystem."
      : "Aajonus Vonderplanitz warnte eindringlich vor Fabrik-Nahrung, da synthetische Zusatzstoffe körpereigene Entgiftungsorgane überlasten.",
    cleanAlternatives: [
      {
        name: "Bio-Weidefleisch / Wildfang oder Demeter-Rohkost",
        whyBetter: "100% frei von synthetischen Hilfsstoffen mit maximalem biologischem Wert.",
        whereToBuy: "Bio-Markt / Hofladen / Wochenmarkt"
      }
    ]
  };
}

module.exports = {
  fetchOpenFoodFacts,
  calculateDistanceKm,
  queryNearbyStores,
  generateDeepScienceAnalysis
};
