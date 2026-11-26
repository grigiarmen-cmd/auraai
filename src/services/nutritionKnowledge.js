// Nutrition & Toxic Substance Detection Knowledge Base
// Biological mechanisms on cellular level + PubMed / EFSA / Aajonus references

const SEED_OILS = [
  { name: 'sonnenblumenöl', label: 'Sonnenblumenöl', risk: 'Hoher Linolsäure-Anteil (Omega-6)', impact: 'Fördert Lipidperoxidation (4-HNE) in Mitochondrienmembranen', severity: 'HIGH' },
  { name: 'rapsöl', label: 'Rapsöl', risk: 'Industriell desodoriert & oxidationsanfällig', impact: 'Kann trans-Fettsäure-Spuren und Entzündungsmediatoren erhöhen', severity: 'HIGH' },
  { name: 'sojaöl', label: 'Sojaöl', risk: 'Stark verarbeitetes Industrieöl (Omega-6)', impact: 'Belastet Leberstoffwechsel und Insulinsensitivität', severity: 'HIGH' },
  { name: 'palmöl', label: 'Palmöl', risk: 'Raffiniertes Industriefett (3-MCPD / Glycidylester)', impact: 'Prozesskontaminanten bei Hochtemperatur-Raffination', severity: 'MEDIUM' },
  { name: 'palmfett', label: 'Palmfett', risk: 'Raffiniertes Industriefett', impact: 'Oft gehärtet oder umgeestert in Ultra-Processed Foods', severity: 'MEDIUM' },
  { name: 'baumwollsaatöl', label: 'Baumwollsaatöl', risk: 'Gossypol-Rückstände & hohe Linolsäure', impact: 'Stark entzündungsfördernd auf Zellebene', severity: 'HIGH' },
  { name: 'maiskeimöl', label: 'Maiskeimöl', risk: 'Extrem ungünstiges Omega-6:Omega-3-Verhältnis', impact: 'Treibt Arachidonsäure-Kaskade und Zellentzündung', severity: 'HIGH' },
  { name: 'distelöl', label: 'Distelöl', risk: 'Sehr hoher mehrfach ungesättigter Fettsäureanteil', impact: 'Schnelle Oxidation bei Licht und Wärme', severity: 'HIGH' },
  { name: 'safloröl', label: 'Safloröl', risk: 'Hohe Oxidationsanfälligkeit', impact: 'Belastet Cardiolipin in den Mitochondrien', severity: 'HIGH' },
  { name: 'pflanzliches öl', label: 'Pflanzliches Öl (meist raffiniert)', risk: 'Unklare industrielle Saatöl-Mischung', impact: 'Fördert oxidativen Stress', severity: 'MEDIUM' }
];

const EMULSIFIERS_ADDITIVES = [
  { name: 'e471', code: 'E471', label: 'E471 (Mono- und Diglyceride)', type: 'emulsifier', risk: 'Synthetischer Emulgator', impact: 'Kann Darmschleimhaut-Barriere (Tight Junctions) schwächen', severity: 'MEDIUM' },
  { name: 'polysorbat', code: 'E433', label: 'Polysorbat 80 / E433', type: 'emulsifier', risk: 'Emulgator', impact: 'Stört Mukusschicht und Darmmikrobiom', severity: 'HIGH' },
  { name: 'carboxymethylcellulose', code: 'E466', label: 'Carboxymethylcellulose / E466', type: 'emulsifier', risk: 'Synthetisches Verdickungsmittel', impact: 'Fördert niedriggradige Darmentzündungen', severity: 'MEDIUM' },
  { name: 'carrageen', code: 'E407', label: 'Carrageen / E407', type: 'gut_irritant', risk: 'Darmreizendes Geliermittel', impact: 'Kann TLR4-Entzündungssignalwege im Darm triggern', severity: 'HIGH' },
  { name: 'titandioxid', code: 'E171', label: 'Titandioxid / E171 (EU-verboten)', type: 'carcinogen', risk: 'Nanopartikel / Genotoxizitätsverdacht', impact: 'Von der EFSA als nicht mehr sicher eingestuft', severity: 'HIGH' },
  { name: 'natriumbenzoat', code: 'E211', label: 'Natriumbenzoat / E211', type: 'dna_damage', risk: 'Konservierungsstoff', impact: 'Kann mit Ascorbinsäure Benzolspuren bilden & Mitochondrien belasten', severity: 'HIGH' },
  { name: 'kaliumsorbat', code: 'E202', label: 'Kaliumsorbat / E202', type: 'preservative', risk: 'Konservierungsstoff', impact: 'Hemmt auch nützliche Fermentationskulturen', severity: 'LOW' },
  { name: 'sucralose', code: 'E955', label: 'Sucralose / E955', type: 'microbiome_disruptor', risk: 'Chlorierter Süßstoff', impact: 'Reduziert nützliche Darmbakterien und beeinflusst Glukosetoleranz', severity: 'MEDIUM' },
  { name: 'aspartam', code: 'E951', label: 'Aspartam / E951', type: 'neurotoxic', risk: 'Synthetischer Süßstoff', impact: 'Exzitatorische Metaboliten (Phenylalanin, Asparaginsäure, Methanol)', severity: 'HIGH' },
  { name: 'acesulfam', code: 'E950', label: 'Acesulfam K / E950', type: 'sweetener', risk: 'Künstlicher Süßstoff', impact: 'Kann cephale Insulinantwort und Mikrobiom stören', severity: 'MEDIUM' },
  { name: 'maltodextrin', code: null, label: 'Maltodextrin', type: 'spike', risk: 'Hochglykämisches Industriepulver (GI > 100)', impact: 'Extremer Blutzucker- & Insulin-Spike', severity: 'MEDIUM' }
];

// Curated verified raw milk farms, pasture-raised cattle & Demeter sources in DACH
const VERIFIED_FARMS = [
  {
    id: 'farm-0',
    name: 'Demeter Hof & Milchtankstelle Schleswig-Flensburg',
    type: 'farm',
    category: 'demeter',
    lat: 54.552,
    lon: 9.428,
    address: 'Umland Jübek / Schleswig, 24855',
    products: ['Demeter Vorzugsmilch', 'Frische Weiderohmilch', 'Demeter-Käse', 'Weideeier'],
    notes: '24/7 Rohmilchtankstelle am Hof. 100% Grasfütterung & Demeter-zertifiziert.',
    verified: true
  },
  {
    id: 'farm-1',
    name: 'Demeter Hofgut Oberfeld',
    type: 'farm',
    category: 'demeter',
    lat: 49.8821,
    lon: 8.6892,
    address: 'Erbacher Str. 125, 64287 Darmstadt',
    products: ['Demeter Rohmilch', 'Weidefleisch', 'Rohmilchkäse', 'Freilandeier'],
    notes: '24/7 Rohmilchtankstelle am Hof. Eigene Demeter-Molkerei.',
    verified: true
  },
  {
    id: 'farm-2',
    name: 'Milchtankstelle Bauer Funke',
    type: 'vending_machine',
    category: 'raw_milk',
    lat: 51.3412,
    lon: 7.2289,
    address: 'Hattinger Str. 805, 44879 Bochum',
    products: ['Frische Rohmilch zapfen', 'Freilandeier'],
    notes: '24h Automat, Rohmilch tagesfrisch gekühlt.',
    verified: true
  },
  {
    id: 'farm-3',
    name: 'Bio-Hof Mayer & Rohmilchtankstelle',
    type: 'farm',
    category: 'raw_milk',
    lat: 48.1482,
    lon: 11.5721,
    address: 'Münchner Umland / Dachau',
    products: ['Heumilch Rohmilch', 'Bio-Rindertalg', 'Weidebutter'],
    notes: '100% Weidehaltung, gentechnikfrei.',
    verified: true
  },
  {
    id: 'farm-4',
    name: 'Biohof Mauracher (Wien/NÖ)',
    type: 'farm',
    category: 'demeter',
    lat: 48.2082,
    lon: 16.3738,
    address: 'Umland Wien, Österreich',
    products: ['Vorzugsmilch', 'Weiderindfleisch', 'Rohmilchbutter'],
    notes: 'Regenerative Landwirtschaft, A2-Urmilch.',
    verified: true
  }
];

module.exports = {
  SEED_OILS,
  EMULSIFIERS_ADDITIVES,
  VERIFIED_FARMS
};
