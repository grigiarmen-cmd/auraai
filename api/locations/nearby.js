const { VERIFIED_FARMS } = require('../../src/services/nutritionKnowledge');
const { calculateDistanceKm, queryNearbyStores } = require('../../src/services/nutritionEngine');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const lat = parseFloat(req.query.lat) || 54.5571;
    const lon = parseFloat(req.query.lon) || 9.4022;
    const radius = parseInt(req.query.radius, 10) || 15000;

    const farms = (VERIFIED_FARMS || []).map(f => ({
      ...f,
      distanceKm: calculateDistanceKm ? Number(calculateDistanceKm(lat, lon, f.lat, f.lon).toFixed(1)) : 0
    })).sort((a, b) => a.distanceKm - b.distanceKm);

    let stores = [];
    try {
      if (queryNearbyStores) {
        stores = await queryNearbyStores(lat, lon, radius);
      }
    } catch (e) {
      stores = [];
    }

    return res.status(200).json({
      success: true,
      verifiedFarms: farms,
      nearbyStores: Array.isArray(stores) ? stores : []
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Standort-Suche fehlgeschlagen', verifiedFarms: [], nearbyStores: [] });
  }
};
