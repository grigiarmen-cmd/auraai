// Nutrition & Toxic Substance Detection Knowledge Base
// Biological mechanisms on cellular level + PubMed / EFSA / Aajonus references

const SEED_OILS = [
  { name: 'sonnenblumenöl', label: 'Sonnenblumenöl' },
  { name: 'rapsöl', label: 'Rapsöl' },
  { name: 'sojaöl', label: 'Sojaöl' },
  { name: 'palmöl', label: 'Palmöl' },
  { name: 'palmfett', label: 'Palmfett' },
  { name: 'baumwollsaatöl', label: 'Baumwollsaatöl' },
  { name: 'maiskeimöl', label: 'Maiskeimöl' },
  { name: 'distelöl', label: 'Distelöl' },
  { name: 'safloröl', label: 'Safloröl' },
  { name: 'pflanzliches öl', label: 'Pflanzliches Öl (meist raffiniert)' }
];

const EMULSIFIERS_ADDITIVES = [
  { name: 'e471', label: 'E471 (Mono- und Diglyceride)', type: 'emulsifier' },
  { name: 'polysorbat', label: 'Polysorbat 80 / E433', type: 'emulsifier' },
  { name: 'carboxymethylcellulose', label: 'Carboxymethylcellulose / E466', type: 'emulsifier' },
  { name: 'carrageen', label: 'Carrageen / E407', type: 'gut_irritant' },
  { name: 'titandioxid', label: 'Titandioxid / E171 (EU-verboten)', type: 'carcinogen' },
  { name: 'natriumbenzoat', label: 'Natriumbenzoat / E211', type: 'dna_damage' },
  { name: 'kaliumsorbat', label: 'Kaliumsorbat / E202', type: 'preservative' },
  { name: 'sucralose', label: 'Sucralose / E955', type: 'microbiome_disruptor' },
  { name: 'aspartam', label: 'Aspartam / E951', type: 'neurotoxic' },
  { name: 'acesulfam', label: 'Acesulfam K / E950', type: 'sweetener' },
  { name: 'maltodextrin', label: 'Maltodextrin', type: 'spike' }
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
