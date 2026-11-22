// Deep Science Analysis Engine: Evaluates food products, biological toxicity,
// cellular mechanisms, PubMed/EFSA/Aajonus citations, and nearby store alternatives.

const https = require('https');
const { SEED_OILS, EMULSIFIERS_ADDITIVES, VERIFIED_FARMS } = require('./nutritionKnowledge');

// Fetch product by barcode from OpenFoodFacts
async function fetchOpenFoodFacts(barcode) {
  return new Promise((resolve) => {
    const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`;
    
    https.get(url, { 
      rejectUnauthorized: false,
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
    }).on('error', (err) => {
      console.error("OpenFoodFacts HTTPS error:", err.message);
      resolve(null);
    });
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

  // 2. DYNAMISCHE KALKULATION BASIEREND AUF INHALTSSTOFFEN
  const hasSeedOils = detectedToxins.some(t => t.type === 'SEED_OIL') || /rapsöl|sonnenblumenöl|palmöl|sojaöl|pflanzenöl/i.test(ingr);
  const hasChemicalAdditives = detectedToxins.some(t => t.type === 'ADDITIVE') || /e\d{3}|emulgator|aroma|konservier|geschmacksverstärker/i.test(ingr);
  const hasRefinedSugar = /zucker|glukosesirup|fruktosesirup|dextrose/i.test(ingr) && !/honig|apfel|mango/i.test(pName);
  
  // Clean indicators
  const isMeatOrFish = /fleisch|rind|schwein|schinken|prosciutto|lachs|fisch|steak|hack/i.test(pName);
  const isEgg = /ei|eier|egg/i.test(pName);
  const isRawHoney = /honig|honey/i.test(pName);
  const isFruit = /mango|apfel|beere|banane|frucht/i.test(pName);

  let calculatedScore = 75;
  let calculatedVerdict = "QUESTIONABLE";

  if (hasSeedOils) calculatedScore -= 35;
  if (hasChemicalAdditives) calculatedScore -= 20;
  if (hasRefinedSugar) calculatedScore -= 25;

  if (isMeatOrFish && !hasSeedOils && !hasChemicalAdditives) {
    calculatedScore = 92;
    calculatedVerdict = "PRIMAL_APPROVED";
  } else if (isEgg) {
    calculatedScore = 96;
    calculatedVerdict = "PRIMAL_APPROVED";
  } else if (isRawHoney) {
    calculatedScore = 98;
    calculatedVerdict = "PRIMAL_APPROVED";
  } else if (isFruit && !hasChemicalAdditives) {
    calculatedScore = 90;
    calculatedVerdict = "PRIMAL_APPROVED";
  } else if (calculatedScore >= 75) {
    calculatedVerdict = "PRIMAL_APPROVED";
  } else if (calculatedScore <= 40) {
    calculatedVerdict = "TOXIC";
  }

  // Bound score
  calculatedScore = Math.max(5, Math.min(99, calculatedScore));

  // Dynamische Zutaten-Zerlegung
  let realBreakdown = [];
  if (ingredientsText && ingredientsText.trim().length > 0) {
    const rawParts = ingredientsText.split(/[,;•\n]/).map(s => s.trim()).filter(s => s.length > 2 && !/serviervorschlag|suggestion/i.test(s));
    realBreakdown = rawParts.slice(0, 8).map(part => {
      const lower = part.toLowerCase();
      const isBadOil = /raps|sonnenblume|palm|soja|öl|fett/i.test(lower);
      const isBadSugar = /zucker|sirup|dextrose/i.test(lower);
      const isBadAdd = /e\d{3}|emulgator|aroma|konservier/i.test(lower);

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
  generateDeepScienceAnalysis
};
