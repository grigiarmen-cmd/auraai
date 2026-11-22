import React, { useState } from 'react';
import { Flame, Check, Sparkles, ChevronRight, Scale, ShieldCheck, AlertTriangle, ArrowUpRight } from 'lucide-react';

export default function InChatFoodCard({ 
  foodData, 
  onLogMeal, 
  onOpenTracker 
}) {
  const [portionGrams, setPortionGrams] = useState(100);
  const [mealCategory, setMealCategory] = useState(() => {
    const hr = new Date().getHours();
    if (hr < 11) return 'Frühstück';
    if (hr < 15) return 'Mittagessen';
    if (hr < 20) return 'Abendessen';
    return 'Snack';
  });
  const [isLogged, setIsLogged] = useState(false);
  const [customGramInput, setCustomGramInput] = useState('100');

  if (!foodData) return null;

  // Base values per 100g
  const baseKcal = Number(foodData.calories) || Number(foodData.nutrients?.calories?.toString().replace(/[^\d.]/g, '')) || 0;
  const baseProt = Number(foodData.protein) || Number(foodData.nutrients?.protein?.toString().replace(/[^\d.]/g, '')) || 0;
  const baseFat = Number(foodData.fat) || Number(foodData.nutrients?.fat?.toString().replace(/[^\d.]/g, '')) || 0;
  const baseCarbs = Number(foodData.carbs) || Number(foodData.nutrients?.carbs?.toString().replace(/[^\d.]/g, '')) || 0;

  // Scaled values
  const factor = (portionGrams || 100) / 100;
  const scaledKcal = Math.round(baseKcal * factor);
  const scaledProt = Math.round(baseProt * factor * 10) / 10;
  const scaledFat = Math.round(baseFat * factor * 10) / 10;
  const scaledCarbs = Math.round(baseCarbs * factor * 10) / 10;

  const auraScore = foodData.auraScore || foodData.science?.auraScore || 90;
  const verdict = foodData.verdict || foodData.science?.verdict || 'PRIMAL_APPROVED';
  const cellularMechanism = foodData.cellularMechanism || foodData.science?.cellularMechanism || 'Hohe Bioverfügbarkeit der Nährstoffe und Unterstützung des Zellstoffwechsels.';

  const handleSelectPreset = (g) => {
    setPortionGrams(g);
    setCustomGramInput(g.toString());
  };

  const handleGramChange = (valStr) => {
    setCustomGramInput(valStr);
    const num = parseFloat(valStr) || 0;
    setPortionGrams(num);
  };

  const handleCommit = () => {
    if (isLogged) return;
    const mealPayload = {
      id: Date.now().toString(),
      name: foodData.name || foodData.productName || 'Gescanntes Produkt',
      brand: foodData.brand || '',
      category: mealCategory,
      amount: `${portionGrams}g`,
      calories: scaledKcal,
      protein: scaledProt,
      fat: scaledFat,
      carbs: scaledCarbs,
      isClean: auraScore >= 70,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    if (onLogMeal) {
      onLogMeal(mealPayload);
    }
    setIsLogged(true);
  };

  return (
    <div className="w-full max-w-xl my-2.5 rounded-2xl bg-[#0c0e14] border border-[#232938] p-4 text-[#e2e8f0] shadow-2xl overflow-hidden animate-in fade-in duration-200">
      {/* Top Banner: Brand / Score */}
      <div className="flex items-start justify-between gap-3 border-b border-[#1b202e] pb-3">
        <div className="flex items-center gap-3 min-w-0">
          {foodData.imageUrl ? (
            <img 
              src={foodData.imageUrl} 
              alt={foodData.name} 
              className="w-14 h-14 object-contain rounded-xl bg-[#141822] border border-[#2b3347] p-1 shrink-0" 
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Flame className="w-6 h-6 text-amber-400" />
            </div>
          )}
          <div className="min-w-0">
            <span className="text-[10px] font-mono tracking-wider uppercase text-zinc-400 block truncate">
              {foodData.brand || 'Bio / Lebensmittel'}
            </span>
            <h4 className="text-sm font-bold text-white truncate leading-tight mt-0.5">
              {foodData.name || foodData.productName}
            </h4>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                auraScore >= 80 
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                  : auraScore >= 60 
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
              }`}>
                <ShieldCheck className="w-3 h-3" />
                Aura Score: {auraScore}/100
              </span>
              {verdict === 'PRIMAL_APPROVED' && (
                <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40">
                  PRIMAL APPROVED
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Macro Pillars (Scaled Live) */}
      <div className="grid grid-cols-4 gap-2 py-3 border-b border-[#1b202e] text-center">
        <div className="p-2 rounded-xl bg-[#12151f] border border-[#1e2433]">
          <span className="text-[10px] text-zinc-400 block font-medium">Kalorien</span>
          <span className="text-base font-black text-amber-400 font-mono">{scaledKcal}</span>
          <span className="text-[9px] text-zinc-500 block">kcal</span>
        </div>
        <div className="p-2 rounded-xl bg-[#12151f] border border-[#1e2433]">
          <span className="text-[10px] text-zinc-400 block font-medium">Protein</span>
          <span className="text-base font-black text-emerald-400 font-mono">{scaledProt}</span>
          <span className="text-[9px] text-zinc-500 block">Gramm</span>
        </div>
        <div className="p-2 rounded-xl bg-[#12151f] border border-[#1e2433]">
          <span className="text-[10px] text-zinc-400 block font-medium">Fett</span>
          <span className="text-base font-black text-rose-400 font-mono">{scaledFat}</span>
          <span className="text-[9px] text-zinc-500 block">Gramm</span>
        </div>
        <div className="p-2 rounded-xl bg-[#12151f] border border-[#1e2433]">
          <span className="text-[10px] text-zinc-400 block font-medium">Carbs</span>
          <span className="text-base font-black text-sky-400 font-mono">{scaledCarbs}</span>
          <span className="text-[9px] text-zinc-500 block">Gramm</span>
        </div>
      </div>

      {/* Biochemical Cellular Mechanism Explanation */}
      <div className="py-2.5 text-xs text-zinc-300 border-b border-[#1b202e]">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-300/90 mb-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Biochemische Zell-Wirkung:</span>
        </div>
        <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">
          {cellularMechanism}
        </p>
      </div>

      {/* Interactive Controls: Portion Stepper & Meal Category */}
      {!isLogged ? (
        <div className="pt-3 space-y-3">
          {/* Portions-Auswahl */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-zinc-400">Portionsgröße:</span>
            <div className="flex items-center gap-1.5">
              {[50, 100, 150, 200].map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => handleSelectPreset(g)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition-all ${
                    portionGrams === g
                      ? 'bg-amber-400 text-black shadow-md'
                      : 'bg-[#151822] text-zinc-300 hover:bg-[#1f2433] border border-[#232938]'
                  }`}
                >
                  {g}g
                </button>
              ))}
              <div className="flex items-center gap-1 bg-[#151822] border border-[#232938] rounded-lg px-2 py-0.5">
                <input
                  type="number"
                  min="1"
                  max="2000"
                  value={customGramInput}
                  onChange={(e) => handleGramChange(e.target.value)}
                  className="w-12 bg-transparent text-center text-amber-400 font-mono font-bold text-xs focus:outline-none"
                />
                <span className="text-[10px] text-zinc-400">g</span>
              </div>
            </div>
          </div>

          {/* Mahlzeiten-Kategorie */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-zinc-400">Mahlzeit:</span>
            <div className="flex items-center gap-1">
              {['Frühstück', 'Mittagessen', 'Abendessen', 'Snack'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setMealCategory(cat)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-all ${
                    mealCategory === cat
                      ? 'bg-sky-400 text-black font-bold'
                      : 'bg-[#151822] text-zinc-400 hover:text-white border border-[#232938]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleCommit}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98]"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Jetzt {portionGrams}g eintragen ({scaledKcal} kcal)</span>
            </button>
            {onOpenTracker && (
              <button
                type="button"
                onClick={onOpenTracker}
                className="p-2.5 rounded-xl bg-[#151822] hover:bg-[#1f2433] text-zinc-300 hover:text-white border border-[#232938] transition-colors"
                title="Tagebuch öffnen"
              >
                <ArrowUpRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Confirmed Success State */
        <div className="pt-3 flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 mt-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
              ✓
            </div>
            <div>
              <span className="text-xs font-bold text-white block">
                Erfolgreich ins Ernährungstagebuch eingetragen!
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">
                {portionGrams}g • {scaledKcal} kcal • {mealCategory}
              </span>
            </div>
          </div>
          {onOpenTracker && (
            <button
              type="button"
              onClick={onOpenTracker}
              className="px-2.5 py-1 rounded-lg bg-emerald-500 text-black font-bold text-[11px] hover:bg-emerald-400 transition-colors flex items-center gap-1"
            >
              <span>Im Tracker ansehen</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
