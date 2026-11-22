import React, { useState, useRef } from 'react';
import { getApiBaseUrl } from '../../services/apiConfig';
const API_BASE = getApiBaseUrl();
import { Camera, Upload, Sparkles, AlertTriangle, ShieldCheck, Flame, X, ChevronRight, Check } from 'lucide-react';

export default function MealVisionModal({ isOpen, onClose, onSaveToNotion, onAddToTracker }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [userNote, setUserNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [savedToNotion, setSavedToNotion] = useState(false);
  const [scanMode, setScanMode] = useState('meal'); // 'meal' | 'restaurant_menu'
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result);
      setAnalysisResult(null);
      setError(null);
      setSavedToNotion(false);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      let res = await fetch(`${API_BASE}/api/nutrition/analyze-meal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          note: scanMode === 'restaurant_menu' 
            ? `[RESTAURANT SPEISEKARTEN SCAN: Bitte analysiere alle Gerichte auf dieser Speisekarte und markiere mit grünem Glow das am wenigsten denaturierte, saatölfreie und gesündeste Primal-Gericht!] ${userNote}`
            : userNote
        })
      });

      if (!res.ok) {
        // Fallback directly to root serverless endpoint
        res = await fetch(`${API_BASE}/api/analyze-meal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: selectedImage,
            note: userNote
          })
        });
      }

      if (!res.ok) {
        throw new Error('Analyse fehlgeschlagen.');
      }

      const data = await res.json();
      setAnalysisResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'AURA_GOD':
      case 'RAW_PRIMAL':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'CLEAN':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'NORMIE':
        return 'text-zinc-300 bg-zinc-800 border-zinc-700';
      default:
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-zinc-950/95 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500/20 to-red-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Camera size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                Aura Vision & Speisekarten-Scan <Sparkles size={16} className="text-orange-400" />
              </h2>
              <p className="text-xs text-zinc-400">Teller-Nährstoffe & Restaurant-Menü Scanner</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scan Mode Switcher */}
        <div className="px-6 py-2 border-b border-zinc-800/50 bg-zinc-900/30 flex items-center gap-2">
          <button
            onClick={() => setScanMode('meal')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              scanMode === 'meal'
                ? 'bg-orange-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            🍽️ Mahlzeit auf dem Teller
          </button>
          <button
            onClick={() => setScanMode('restaurant_menu')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              scanMode === 'restaurant_menu'
                ? 'bg-emerald-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            📜 Speisekarte im Restaurant
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-3">
              <AlertTriangle size={20} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Upload Dropzone */}
          {!selectedImage ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-700/80 hover:border-orange-500/60 rounded-3xl p-10 text-center cursor-pointer bg-zinc-900/20 hover:bg-zinc-900/40 transition-all flex flex-col items-center justify-center gap-3 group"
            >
              <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 group-hover:bg-orange-500/20 flex items-center justify-center text-zinc-400 group-hover:text-orange-400 transition-colors">
                <Upload size={28} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">Foto der Mahlzeit aufnehmen oder hochladen</p>
                <p className="text-xs text-zinc-400">Direkter Kamera-Zugriff auf Smartphone oder Bild auswählen</p>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                capture="environment"
                className="hidden" 
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-black max-h-64 flex items-center justify-center">
                <img src={selectedImage} alt="Mahlzeit" className="object-cover w-full h-full" />
                <button 
                  onClick={() => { setSelectedImage(null); setAnalysisResult(null); }}
                  className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 text-white hover:bg-black transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {!analysisResult && !isLoading && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Optional: Z.B. 'Steak medium rare in Bio-Weidebutter gebraten'"
                    value={userNote}
                    onChange={(e) => setUserNote(e.target.value)}
                    className="w-full bg-zinc-900/90 border border-zinc-700/60 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                  />
                  <button
                    onClick={handleAnalyze}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black font-bold text-sm transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                  >
                    <Sparkles size={18} /> Mahlzeit biochemisch bewerten
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="py-12 text-center space-y-4">
              <div className="w-12 h-12 mx-auto border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">Gemini Vision scannt Nährstoffdichte...</p>
                <p className="text-xs text-zinc-400">Bioverfügbarkeit, Antinährstoffe & Hormon-Faktor werden ermittelt</p>
              </div>
            </div>
          )}

          {/* Result Card */}
          {analysisResult && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Header Score Card */}
              <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${getTierColor(analysisResult.tier)}`}>
                    {analysisResult.tier}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1.5">{analysisResult.dishName}</h3>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-amber-400">{analysisResult.auraScore}</div>
                  <div className="text-[10px] text-zinc-400 uppercase tracking-widest">Aura Score</div>
                </div>
              </div>

              {/* Macros & Bioavailability Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800 text-center">
                  <span className="text-[10px] text-zinc-400 uppercase">Kalorien</span>
                  <p className="text-sm font-bold text-white mt-0.5">{analysisResult.estimatedMacros?.calories || '—'}</p>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800 text-center">
                  <span className="text-[10px] text-zinc-400 uppercase">Protein</span>
                  <p className="text-sm font-bold text-emerald-400 mt-0.5">{analysisResult.estimatedMacros?.protein || '—'}</p>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800 text-center">
                  <span className="text-[10px] text-zinc-400 uppercase">Fett</span>
                  <p className="text-sm font-bold text-amber-400 mt-0.5">{analysisResult.estimatedMacros?.fat || '—'}</p>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800 text-center">
                  <span className="text-[10px] text-zinc-400 uppercase">Kohlenhydrate</span>
                  <p className="text-sm font-bold text-zinc-300 mt-0.5">{analysisResult.estimatedMacros?.carbs || '—'}</p>
                </div>
              </div>

              {/* Bioavailability & Cellular Impact */}
              <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-2 text-xs">
                <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck size={16} /> Bioverfügbarkeits-Bewertung: {analysisResult.bioavailabilityRating}
                </div>
                <p className="text-zinc-300 leading-relaxed">{analysisResult.cellularImpact}</p>
              </div>

              {/* Ancestral Perspective */}
              {analysisResult.ancestralWisdom && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs">
                  <span className="font-bold text-amber-400 block mb-1">Ancestrale Lehre (Aajonus / Weston Price):</span>
                  <p className="text-zinc-300 italic">"{analysisResult.ancestralWisdom}"</p>
                </div>
              )}

              {/* Optimization Tips */}
              {analysisResult.optimizationTips && analysisResult.optimizationTips.length > 0 && (
                <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-xs space-y-2">
                  <span className="font-bold text-orange-400 flex items-center gap-1.5">
                    <Flame size={14} /> Biohacking & Upgrade-Tipps:
                  </span>
                  <ul className="space-y-1 list-disc list-inside text-zinc-300">
                    {analysisResult.optimizationTips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  onClick={() => { setSelectedImage(null); setAnalysisResult(null); }}
                  className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs transition-colors"
                >
                  Neues Foto
                </button>
                <button
                  onClick={() => {
                    if (onAddToTracker) {
                      onAddToTracker(analysisResult);
                    }
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/20"
                >
                  <Flame size={15} /> In Kalorien-Tracker loggen
                </button>
                <button
                  onClick={() => {
                    if (onSaveToNotion) {
                      onSaveToNotion(analysisResult);
                      setSavedToNotion(true);
                    }
                  }}
                  disabled={savedToNotion}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  {savedToNotion ? <Check size={15} /> : <Sparkles size={15} />}
                  <span>{savedToNotion ? 'Notion ✓' : 'Notion'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
