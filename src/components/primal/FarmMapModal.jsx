import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, ShoppingBag, Store, Sparkles, X, ExternalLink, CheckCircle } from 'lucide-react';

export default function FarmMapModal({ isOpen, onClose, initialQuery }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'raw_milk' | 'bio_market' | 'supermarket'
  const [locations, setLocations] = useState({ verifiedFarms: [], nearbyStores: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [userCoords, setUserCoords] = useState({ lat: 54.54, lon: 9.40 }); // Default Jübek / Norddeutschland

  useEffect(() => {
    if (!isOpen) return;

    // Get user geolocation if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setUserCoords({ lat, lon });
          fetchLocations(lat, lon);
        },
        () => {
          fetchLocations(userCoords.lat, userCoords.lon);
        }
      );
    } else {
      fetchLocations(userCoords.lat, userCoords.lon);
    }
  }, [isOpen]);

  const fetchLocations = async (lat, lon) => {
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/locations/nearby?lat=${lat}&lon=${lon}&radius=6000`);
      if (res.ok) {
        const data = await res.json();
        setLocations(data);
      }
    } catch (e) {
      console.error("Locations error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Combine and filter listings
  const allListings = [
    ...locations.verifiedFarms.map(f => ({ ...f, isFarm: true })),
    ...locations.nearbyStores.map(s => ({ ...s, isFarm: false }))
  ].filter(item => {
    if (filter === 'raw_milk') return item.isFarm || item.category === 'raw_milk' || item.category === 'demeter';
    if (filter === 'bio_market') return item.type === 'bio_market' || /denns|alnatura|bio|reformhaus/i.test(item.name);
    if (filter === 'supermarket') return item.type === 'supermarket' || /edeka|rewe|aldi|lidl|kaufland|netto|supermarkt/i.test(item.name);
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-zinc-950/95 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <MapPin size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                Aura Clean-Food & Farm Locator <Sparkles size={16} className="text-emerald-400" />
              </h2>
              <p className="text-xs text-zinc-400">Rohmilchtankstellen, Bio-Märkte & Demeter-Höfe in deiner Nähe</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="p-4 border-b border-zinc-800/50 bg-zinc-900/30 flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'all', label: 'Alle Quellen', icon: Store },
            { id: 'raw_milk', label: '🥛 Rohmilch & Demeter-Höfe', icon: Navigation },
            { id: 'bio_market', label: '🌿 Bio-Märkte (Denns / Alnatura)', icon: ShoppingBag },
            { id: 'supermarket', label: '🛒 Supermärkte mit Bio-Sortiment', icon: Store },
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setFilter(btn.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                filter === btn.id
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                  : 'bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Listings List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {isLoading ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-10 h-10 mx-auto border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-zinc-400">Lade Standorte & Entfernungen im Umkreis...</p>
            </div>
          ) : allListings.length === 0 ? (
            <div className="py-16 text-center text-zinc-400 text-xs">
              Keine Einträge für diesen Filter im Umkreis gefunden.
            </div>
          ) : (
            allListings.map((item, idx) => {
              const isVerified = item.verified;
              const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.name + ' ' + (item.address || ''))}`;

              return (
                <div 
                  key={idx}
                  className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 hover:border-emerald-500/40 transition-all flex items-start justify-between gap-4"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{item.name}</span>
                      {isVerified && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle size={10} /> Verifiziert
                        </span>
                      )}
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                        {item.distanceKm} km entfernt
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400">{item.address}</p>

                    {item.products && (
                      <div className="flex flex-wrap gap-1.5 pt-1.5">
                        {item.products.map((p, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800/80 text-emerald-300/80 border border-zinc-700/50">
                            {p}
                          </span>
                        ))}
                      </div>
                    )}

                    {item.notes && (
                      <p className="text-[11px] text-amber-300/80 italic pt-1">{item.notes}</p>
                    )}
                  </div>

                  <a
                    href={gmapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-zinc-800 hover:bg-emerald-500 hover:text-black text-zinc-400 transition-all shrink-0 flex items-center justify-center shadow-md"
                    title="In Google Maps öffnen"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
