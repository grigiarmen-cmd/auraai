import React, { useState, useEffect } from 'react';
import { getApiBaseUrl } from '../../services/apiConfig';
const API_BASE = getApiBaseUrl();
import { 
  Flame, Plus, Search, Trash2, X, Sparkles, CheckCircle2, Apple, ChevronRight, 
  Activity, Clock, QrCode, Camera, ChevronDown, ChevronUp, Scale, AlertTriangle, ShieldCheck
} from 'lucide-react';

export default function CalorieTrackerModal({ 
  isOpen, 
  onClose,
  onOpenBarcodeScanner,
  onOpenMealVision 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Selected item for portion & gram calculation modal (Yazio Style)
  const [activeItemForDetail, setActiveItemForDetail] = useState(null);
  const [amount, setAmount] = useState('100');
  const [selectedUnit, setSelectedUnit] = useState('Gramm'); // 'Gramm' | 'Portion' | '100g'
  const [mealCategory, setMealCategory] = useState('Mittagessen'); // 'Frühstück' | 'Mittagessen' | 'Abendessen' | 'Snack'
  const [showMicrosAccordion, setShowMicrosAccordion] = useState(false);

  // Daily Log State stored in localStorage by date string YYYY-MM-DD
  const todayKey = new Date().toISOString().split('T')[0];
  const [dailyEntries, setDailyEntries] = useState(() => {
    try {
      const saved = localStorage.getItem(`aura_meals_${todayKey}`);
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return [
      { id: '1', name: '3 Rühreier in Weidebutter', category: 'Frühstück', amount: '1 Portion', calories: 340, protein: 21, fat: 28, carbs: 1.5, time: '08:30' }
    ];
  });

  // User Profile Target
  const [userProfile] = useState(() => {
    try {
      const p = localStorage.getItem('aura_user_profile');
      if (p) return JSON.parse(p);
    } catch(e) {}
    return { targetCalories: 2400, weightKg: 80 };
  });

  useEffect(() => {
    try {
      localStorage.setItem(`aura_meals_${todayKey}`, JSON.stringify(dailyEntries));
    } catch(e) {}
  }, [dailyEntries, todayKey]);

  if (!isOpen) return null;

  // Search Food Database
  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (!q || q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`${API_BASE}/api/food/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.foods || data.results || []);
      }
    } catch(e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  // Open detail calculator for an item
  const openDetailCalculator = (item) => {
    setActiveItemForDetail(item);
    setAmount('100');
    setSelectedUnit('Gramm');
    setShowMicrosAccordion(false);
  };

  // Calculate scaled values based on amount & unit
  const calculateScaledMacros = () => {
    if (!activeItemForDetail) return { calories: 0, protein: 0, fat: 0, carbs: 0, ratio: 1 };
    const numAmount = parseFloat(amount) || 100;
    
    // Base assumptions: If item has serving with grams, derive baseline per 100g
    let ratio = 1;
    if (selectedUnit === 'Gramm') {
      ratio = numAmount / 100;
    } else if (selectedUnit === 'Portion') {
      ratio = numAmount;
    } else {
      ratio = (numAmount * 100) / 100;
    }

    return {
      calories: Math.round((activeItemForDetail.calories || 0) * (selectedUnit === 'Gramm' ? ratio : ratio)),
      protein: Math.round(((activeItemForDetail.protein || 0) * (selectedUnit === 'Gramm' ? ratio : ratio)) * 10) / 10,
      fat: Math.round(((activeItemForDetail.fat || 0) * (selectedUnit === 'Gramm' ? ratio : ratio)) * 10) / 10,
      carbs: Math.round(((activeItemForDetail.carbs || 0) * (selectedUnit === 'Gramm' ? ratio : ratio)) * 10) / 10,
      ratio
    };
  };

  // Commit scaled item to daily log
  const handleSaveScaledMeal = () => {
    if (!activeItemForDetail) return;
    const scaled = calculateScaledMacros();
    const newEntry = {
      id: 'entry_' + Date.now(),
      name: activeItemForDetail.name,
      category: mealCategory,
      amount: `${amount} ${selectedUnit}`,
      calories: scaled.calories,
      protein: scaled.protein,
      fat: scaled.fat,
      carbs: scaled.carbs,
      micros: activeItemForDetail.micros,
      isClean: activeItemForDetail.isClean !== false,
      warning: activeItemForDetail.warning || null,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setDailyEntries([newEntry, ...dailyEntries]);
    setActiveItemForDetail(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeMeal = (id) => {
    setDailyEntries(dailyEntries.filter(e => e.id !== id));
  };

  // Macro Totals
  const totalCalories = dailyEntries.reduce((sum, item) => sum + (Number(item.calories) || 0), 0);
  const totalProtein = Math.round(dailyEntries.reduce((sum, item) => sum + (Number(item.protein) || 0), 0) * 10) / 10;
  const totalFat = Math.round(dailyEntries.reduce((sum, item) => sum + (Number(item.fat) || 0), 0) * 10) / 10;
  const totalCarbs = Math.round(dailyEntries.reduce((sum, item) => sum + (Number(item.carbs) || 0), 0) * 10) / 10;

  const calorieTarget = Number(userProfile?.targetCalories) || 2400;
  const caloriesRemaining = calorieTarget - totalCalories;
  const progressPercent = Math.min(100, Math.round((totalCalories / calorieTarget) * 100));

  const scaled = calculateScaledMacros();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-zinc-950/95 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] p-5 sm:p-6 space-y-4">
        
        {/* Header with Title and Integrated Fast-Access Buttons */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Flame size={19} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-1.5">
                Aura Nährstoff & Kalorien-Tracker <Sparkles size={14} className="text-amber-400" />
              </h2>
              <p className="text-[10px] sm:text-[11px] text-zinc-400">Tagesbudget, Gramm-Kalkulator & Deep Nutrition</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Integrated Quick Action Bar (Scanner & Meal Vision direct in Tracker!) */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              if (onOpenBarcodeScanner) onOpenBarcodeScanner();
            }}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-800/60 text-xs font-semibold text-amber-300 transition-all group"
          >
            <QrCode size={15} className="text-amber-400 group-hover:scale-110 transition-transform" />
            <span>Barcode scannen</span>
          </button>

          <button
            onClick={() => {
              if (onOpenMealVision) onOpenMealVision();
            }}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-orange-500/50 hover:bg-zinc-800/60 text-xs font-semibold text-orange-300 transition-all group"
          >
            <Camera size={15} className="text-orange-400 group-hover:scale-110 transition-transform" />
            <span>Foto Scan (Vision)</span>
          </button>
        </div>

        {/* 1. Yazio Style Calorie Budget Speedometer & Remaining Display */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[9px] sm:text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">Tagesbudget</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className={`text-2xl sm:text-3xl font-black ${caloriesRemaining < 0 ? 'text-rose-400' : 'text-white'}`}>
                  {caloriesRemaining}
                </span>
                <span className="text-xs text-zinc-400">kcal übrig</span>
              </div>
            </div>
            <div className="text-right text-xs">
              <span className="text-zinc-400">Ziel: </span>
              <span className="font-bold text-white">{calorieTarget} kcal</span>
              <div className="text-[11px] text-amber-400 font-semibold">{totalCalories} gegessen</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                caloriesRemaining < 0 ? 'bg-rose-500' : 'bg-gradient-to-r from-emerald-500 via-amber-400 to-orange-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Macro Pills */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="p-1.5 sm:p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
              <span className="text-[9px] sm:text-[10px] text-zinc-400 uppercase">Protein</span>
              <p className="text-xs sm:text-sm font-bold text-emerald-400 mt-0.5">{totalProtein}g</p>
            </div>
            <div className="p-1.5 sm:p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
              <span className="text-[9px] sm:text-[10px] text-zinc-400 uppercase">Fett</span>
              <p className="text-xs sm:text-sm font-bold text-amber-400 mt-0.5">{totalFat}g</p>
            </div>
            <div className="p-1.5 sm:p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
              <span className="text-[9px] sm:text-[10px] text-zinc-400 uppercase">Carbs</span>
              <p className="text-xs sm:text-sm font-bold text-blue-400 mt-0.5">{totalCarbs}g</p>
            </div>
          </div>
        </div>

        {/* 2. Fast Food Search / Database Input */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 text-zinc-500" size={16} />
            <input
              type="text"
              placeholder="Mahlzeit suchen (z.B. 'Mango', 'Rumpsteak', 'Pizza', 'Hähnchen Reis')..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Autocomplete Search Dropdown */}
          {searchResults.length > 0 && (
            <div className="border border-zinc-800 rounded-xl bg-zinc-900/98 overflow-hidden divide-y divide-zinc-800/60 shadow-2xl max-h-52 overflow-y-auto z-10">
              {searchResults.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => openDetailCalculator(item)}
                  className="p-3 hover:bg-zinc-800/70 cursor-pointer flex items-center justify-between text-xs transition-colors group"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-white group-hover:text-amber-300 transition-colors truncate">{item.name}</span>
                      {item.isClean && (
                        <span className="px-1.5 py-0.2 text-[9px] bg-emerald-500/20 text-emerald-300 rounded font-bold">Bio/Clean</span>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-400 block mt-0.5">{item.serving || '100g Basis'}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono font-bold text-amber-400">{item.calories} kcal</span>
                    <button className="p-1 rounded-lg bg-amber-500/20 text-amber-300 group-hover:bg-amber-500 group-hover:text-black transition-all">
                      <Scale size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Detail Portion / Gram Modal Overlay (Matching User Screenshot 1:1) */}
        {activeItemForDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="w-full max-w-md bg-[#13161f] border border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="min-w-0 pr-2">
                  <h3 className="text-base font-bold text-white truncate">{activeItemForDetail.name}</h3>
                  <span className="text-xs text-zinc-400">{activeItemForDetail.serving || 'Standard-Portion'}</span>
                </div>
                <button 
                  onClick={() => setActiveItemForDetail(null)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Macro Cards Preview */}
              <div className="grid grid-cols-4 gap-2 text-center bg-zinc-900/80 p-3 rounded-2xl border border-zinc-800/80">
                <div>
                  <span className="text-lg font-black text-white">{scaled.calories}</span>
                  <span className="block text-[10px] text-zinc-400 font-semibold">kcal</span>
                </div>
                <div>
                  <span className="text-lg font-black text-amber-400">{scaled.fat} g</span>
                  <span className="block text-[10px] text-zinc-400 font-semibold">Fett</span>
                </div>
                <div>
                  <span className="text-lg font-black text-blue-400">{scaled.carbs} g</span>
                  <span className="block text-[10px] text-zinc-400 font-semibold">KH</span>
                </div>
                <div>
                  <span className="text-lg font-black text-emerald-400">{scaled.protein} g</span>
                  <span className="block text-[10px] text-zinc-400 font-semibold">Protein</span>
                </div>
              </div>

              {/* Amount Input & Unit Selector (Gramm, Portion, 100g) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">Menge</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white font-mono font-bold text-base focus:border-amber-500 focus:outline-none"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">Einheit</label>
                  <select
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white text-xs font-semibold focus:border-amber-500 focus:outline-none"
                  >
                    <option value="Gramm">Gramm (g)</option>
                    <option value="Portion">Portion / Stück</option>
                    <option value="100g">100g Einheiten</option>
                  </select>
                </div>
              </div>

              {/* Meal Category Selector */}
              <div>
                <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">Mahlzeit-Kategorie</label>
                <div className="grid grid-cols-4 gap-1.5 text-xs">
                  {['Frühstück', 'Mittagessen', 'Abendessen', 'Snack'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setMealCategory(cat)}
                      className={`py-1.5 px-2 rounded-xl text-center font-medium transition-all ${
                        mealCategory === cat 
                          ? 'bg-amber-500 text-black font-bold shadow-md' 
                          : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Deep Nutrition & Micronutrient Accordion (Vitamins & Minerals) */}
              <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/50">
                <button
                  type="button"
                  onClick={() => setShowMicrosAccordion(!showMicrosAccordion)}
                  className="w-full p-3 flex items-center justify-between text-xs font-bold text-zinc-300 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-amber-400" />
                    <span>Vitamine & Mineralstoffe (Deep Science)</span>
                  </div>
                  {showMicrosAccordion ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showMicrosAccordion && (
                  <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/70 text-xs space-y-2">
                    {activeItemForDetail.micros ? (
                      Object.entries(activeItemForDetail.micros).map(([key, val]) => (
                        <div key={key} className="flex justify-between py-1 border-b border-zinc-800/40 text-[11px]">
                          <span className="text-zinc-400 capitalize">{key}:</span>
                          <span className="font-semibold text-zinc-200">{val}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-zinc-400 text-[11px]">
                        Standard-Nährwerte für {amount}g. Reich an essentiellen Aminosäuren und Mikronährstoffen.
                      </div>
                    )}

                    {activeItemForDetail.warning && (
                      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] flex items-start gap-2 mt-2">
                        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                        <span>{activeItemForDetail.warning}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Button (Eintragen) */}
              <button
                type="button"
                onClick={handleSaveScaledMeal}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-2xl shadow-lg transition-all text-sm flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={16} />
                <span>Eintragen ({scaled.calories} kcal)</span>
              </button>
            </div>
          </div>
        )}

        {/* 4. Daily Food Log List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-48 sm:max-h-56">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold px-1">
            <span>Heute gegessen ({dailyEntries.length})</span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <Clock size={12} /> 24h Auto-Sync
            </span>
          </div>

          {dailyEntries.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              Noch keine Mahlzeiten eingetragen. Nutze die Suche oder die Schnelltasten oben!
            </div>
          ) : (
            dailyEntries.map((meal) => (
              <div 
                key={meal.id}
                className="p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white truncate">{meal.name}</span>
                    <span className="text-[10px] text-amber-400/90 bg-amber-400/10 px-1.5 py-0.2 rounded font-medium">{meal.category || 'Mahlzeit'}</span>
                    <span className="text-[10px] text-zinc-500">{meal.time}</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 flex items-center gap-2 mt-0.5">
                    {meal.amount && <span className="text-zinc-300 font-medium">{meal.amount} •</span>}
                    <span>{meal.protein || 0}g P</span>
                    <span>•</span>
                    <span>{meal.fat || 0}g F</span>
                    <span>•</span>
                    <span>{meal.carbs || 0}g C</span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-white font-mono">{meal.calories} kcal</span>
                  <button onClick={() => removeMeal(meal.id)} className="text-zinc-500 hover:text-rose-400 p-1">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
