import React, { useState, useEffect } from 'react';
import { getApiBaseUrl } from '../../services/apiConfig';
const API_BASE = getApiBaseUrl();
import { 
  Flame, Plus, Search, Trash2, X, Sparkles, CheckCircle2, Scale, 
  Clock, QrCode, Camera, ShieldCheck, AlertTriangle, ChevronRight, ChevronLeft, Zap, Droplet
} from 'lucide-react';
import { getBiochemicalProfile, scaleBiochemicalValues } from '../../services/deepNutritionService';

export default function CalorieTrackerModal({ 
  isOpen, 
  onClose,
  onOpenBarcodeScanner,
  onOpenMealVision 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Selected item for 3-Column Biochemical Laboratory Modal
  const [activeItemForDetail, setActiveItemForDetail] = useState(null);
  const [activeProfile, setActiveProfile] = useState(null);
  const [currentGrams, setCurrentGrams] = useState(100);
  const [portionMultiplier, setPortionMultiplier] = useState(1);
  const [selectedPortionObj, setSelectedPortionObj] = useState(null);
  const [activeUnitLabel, setActiveUnitLabel] = useState('100g Standard');
  const [mealCategory, setMealCategory] = useState('Mittagessen');

  // Selected Day Offset (0 = Heute, -1 = Gestern, etc.)
  const [dayOffset, setDayOffset] = useState(0);

  const getTargetDateKey = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().split('T')[0];
  };

  const currentDateKey = getTargetDateKey(dayOffset);

  // Daily Log State
  const [dailyEntries, setDailyEntries] = useState(() => {
    try {
      const saved = localStorage.getItem(`aura_meals_${currentDateKey}`);
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return dayOffset === 0 ? [
      { id: '1', name: '3 Rühreier in Weidebutter', category: 'Frühstück', amount: '1 Portion (180g)', calories: 340, protein: 21, fat: 28, carbs: 1.5, time: '08:30' }
    ] : [];
  });

  // Reload entries when day changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`aura_meals_${currentDateKey}`);
      if (saved) {
        setDailyEntries(JSON.parse(saved));
      } else {
        setDailyEntries([]);
      }
    } catch(e) {
      setDailyEntries([]);
    }
  }, [currentDateKey]);

  // Read Bloodwork to provide smart recommendations in search
  const [bloodReport] = useState(() => {
    try {
      const b = localStorage.getItem('aura_latest_bloodwork');
      if (b) return JSON.parse(b);
    } catch(e) {}
    return null;
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
      localStorage.setItem(`aura_meals_${currentDateKey}`, JSON.stringify(dailyEntries));
    } catch(e) {}
  }, [dailyEntries, currentDateKey]);

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
    const profile = getBiochemicalProfile(item);
    setActiveProfile(profile);
    const firstPortion = profile.smartPortions?.[0] || { label: '100g Standard', grams: 100 };
    setSelectedPortionObj(firstPortion);
    setPortionMultiplier(1);
    setCurrentGrams(firstPortion.grams);
    setActiveUnitLabel(firstPortion.label);
  };

  // Change Portion & Multiplier
  const handleSelectPortion = (portion, multiplier = 1) => {
    setSelectedPortionObj(portion);
    setPortionMultiplier(multiplier);
    const totalG = Math.round(portion.grams * multiplier);
    setCurrentGrams(totalG);
    setActiveUnitLabel(`${multiplier > 1 ? multiplier + 'x ' : ''}${portion.label}`);
  };

  const handleMultiplierChange = (newMult) => {
    const mult = Math.max(1, parseInt(newMult, 10) || 1);
    setPortionMultiplier(mult);
    if (selectedPortionObj) {
      const totalG = Math.round(selectedPortionObj.grams * mult);
      setCurrentGrams(totalG);
      setActiveUnitLabel(`${mult}x ${selectedPortionObj.label}`);
    }
  };

  // Commit scaled item to daily log
  const handleSaveScaledMeal = () => {
    if (!activeItemForDetail || !activeProfile) return;
    const scaled = scaleBiochemicalValues(activeProfile, currentGrams);
    
    const newEntry = {
      id: 'entry_' + Date.now(),
      name: activeItemForDetail.name,
      category: mealCategory,
      amount: `${portionMultiplier > 1 ? portionMultiplier + 'x ' : ''}${selectedPortionObj?.label || activeUnitLabel} (${currentGrams}g)`,
      calories: scaled.calories,
      protein: scaled.protein,
      fat: scaled.fat,
      carbs: scaled.carbs,
      bioScore: scaled.bioScore,
      cellPower: scaled.cellPower,
      isClean: scaled.bioScore >= 70,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setDailyEntries([newEntry, ...dailyEntries]);
    setActiveItemForDetail(null);
    setActiveProfile(null);
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

  const scaled = activeProfile ? scaleBiochemicalValues(activeProfile, currentGrams) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#090a0f] border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] p-4 sm:p-6 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Flame size={19} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-1.5">
                Aura Nährstoff & Deep Nutrition Tracker <Sparkles size={14} className="text-amber-400" />
              </h2>
              <p className="text-[10px] sm:text-[11px] text-zinc-400">Echtzeit-Biochemie, Vitamine & FDDB Live-Katalog</p>
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
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#11131a] border border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-800/60 text-xs font-semibold text-amber-300 transition-all group"
          >
            <QrCode size={15} className="text-amber-400 group-hover:scale-110 transition-transform" />
            <span>Barcode scannen</span>
          </button>

          <button
            onClick={() => {
              if (onOpenMealVision) onOpenMealVision();
            }}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#11131a] border border-zinc-800 hover:border-orange-500/50 hover:bg-zinc-800/60 text-xs font-semibold text-orange-300 transition-all group"
          >
            <Camera size={15} className="text-orange-400 group-hover:scale-110 transition-transform" />
            <span>Foto Scan (Vision)</span>
          </button>
        </div>

        {/* Day Navigation Header (Swipe / Click between Yesterday, Today, etc.) */}
        <div className="flex items-center justify-between bg-[#11141e] border border-zinc-800 rounded-2xl px-3 py-2 text-xs">
          <button
            onClick={() => setDayOffset(prev => prev - 1)}
            className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={16} />
            <span className="text-[11px]">Vorheriger Tag</span>
          </button>

          <div className="text-center font-bold text-white flex items-center gap-1.5">
            <span className={dayOffset === 0 ? 'text-amber-400' : 'text-zinc-200'}>
              {dayOffset === 0 ? 'Heute' : (dayOffset === -1 ? 'Gestern' : currentDateKey)}
            </span>
            {dayOffset === 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
          </div>

          <button
            onClick={() => setDayOffset(prev => Math.min(0, prev + 1))}
            disabled={dayOffset === 0}
            className={`flex items-center gap-1 transition-colors ${
              dayOffset === 0 ? 'text-zinc-600 cursor-not-allowed' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span className="text-[11px]">Nächster Tag</span>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* 1. Calorie Budget Speedometer & Remaining Display */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#11131a] border border-zinc-800/80 space-y-2.5">
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
            <div className="p-1.5 sm:p-2 rounded-xl bg-black/60 border border-zinc-800/60">
              <span className="text-[9px] sm:text-[10px] text-zinc-400 uppercase">Protein</span>
              <p className="text-xs sm:text-sm font-bold text-emerald-400 mt-0.5">{totalProtein}g</p>
            </div>
            <div className="p-1.5 sm:p-2 rounded-xl bg-black/60 border border-zinc-800/60">
              <span className="text-[9px] sm:text-[10px] text-zinc-400 uppercase">Fett</span>
              <p className="text-xs sm:text-sm font-bold text-amber-400 mt-0.5">{totalFat}g</p>
            </div>
            <div className="p-1.5 sm:p-2 rounded-xl bg-black/60 border border-zinc-800/60">
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
              placeholder="Mahlzeit suchen (z.B. 'Eier', 'Mango', 'Apfel', 'Rumpsteak', 'Pizza')..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-[#11131a] border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Bloodwork Intelligent Recommendation Pill */}
          {bloodReport && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300">
              <Sparkles size={13} className="shrink-0 text-rose-400" />
              <span>
                <strong>Aura Labor-Fokus:</strong> Bevorzuge Lebensmittel reich an{' '}
                <strong className="text-white">Cholin, Häm-Eisen & Zink</strong> (aus deinem Blutbild-Check).
              </span>
            </div>
          )}

          {/* Autocomplete Search Dropdown */}
          {searchResults.length > 0 && (
            <div className="border border-zinc-800 rounded-xl bg-[#0e1017] overflow-hidden divide-y divide-zinc-800/60 shadow-2xl max-h-52 overflow-y-auto z-10">
              {searchResults.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => openDetailCalculator(item)}
                  className="p-3 hover:bg-zinc-800/70 cursor-pointer flex items-center justify-between text-xs transition-colors group"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-white group-hover:text-amber-300 transition-colors truncate">{item.name}</span>
                      {item.source === 'FDDB' && (
                        <span className="px-1.5 py-0.2 text-[9px] bg-blue-500/20 text-blue-300 rounded font-bold">FDDB Live</span>
                      )}
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

        {/* 3. Universal 3-Column Biochemical Laboratory Modal Overlay */}
        {activeItemForDetail && scaled && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-xl">
            <div className="w-full max-w-2xl bg-[#090b10] border border-zinc-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 max-h-[94vh] overflow-y-auto">
              
              {/* Product Header */}
              <div className="flex items-start justify-between border-b border-zinc-800/80 pb-3">
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">{activeItemForDetail.brand || activeItemForDetail.producer || 'Naturprodukt / Markenprodukt'}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      scaled.bioScore >= 80 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                      scaled.bioScore >= 60 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                      'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    }`}>
                      Aura Score: {scaled.bioScore}/100
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white truncate">{activeItemForDetail.name}</h3>
                </div>
                <button 
                  onClick={() => { setActiveItemForDetail(null); setActiveProfile(null); }}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Dynamic 1-Click Smart Portion Pills & Multiplier */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                    Portionsgröße wählen (1-Klick)
                  </label>

                  {/* Multiplier Stepper: e.g. 1, 2, 3, 4 Stück! */}
                  <div className="flex items-center gap-1.5 bg-[#12151e] border border-zinc-800 rounded-xl px-2 py-1">
                    <span className="text-[10px] text-zinc-400 font-semibold uppercase">Anzahl:</span>
                    <button
                      type="button"
                      onClick={() => handleMultiplierChange(portionMultiplier - 1)}
                      className="w-5 h-5 rounded bg-zinc-800 text-white font-bold flex items-center justify-center hover:bg-zinc-700 text-xs"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={portionMultiplier}
                      onChange={(e) => handleMultiplierChange(e.target.value)}
                      className="w-7 bg-transparent text-center text-amber-400 font-bold font-mono text-xs focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleMultiplierChange(portionMultiplier + 1)}
                      className="w-5 h-5 rounded bg-zinc-800 text-white font-bold flex items-center justify-center hover:bg-zinc-700 text-xs"
                    >
                      +
                    </button>
                    <span className="text-[10px] text-amber-300 font-medium">({currentGrams}g gesamt)</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {scaled.smartPortions?.map((p) => {
                    const isSelected = selectedPortionObj?.label === p.label;
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => handleSelectPortion(p, portionMultiplier)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-black shadow-md'
                            : 'bg-[#12151e] text-zinc-300 border border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                  <div className="flex items-center gap-1 bg-[#12151e] border border-zinc-800 rounded-xl px-2.5 py-1">
                    <span className="text-[10px] text-zinc-400 font-semibold">Frei:</span>
                    <input
                      type="number"
                      value={currentGrams}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setCurrentGrams(val);
                        setSelectedPortionObj(null);
                        setPortionMultiplier(1);
                        setActiveUnitLabel(`${val}g`);
                      }}
                      className="w-14 bg-transparent text-white font-mono font-bold text-xs focus:outline-none text-right"
                    />
                    <span className="text-[10px] text-zinc-400">g</span>
                  </div>
                </div>
              </div>

              {/* 3-Column Biochemical Laboratory Grid (Matches FDDB Screenshot perfectly in Cyberpunk OLED Look) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* Column 1: Energy & Macros */}
                <div className="bg-[#11141d] border border-zinc-800/80 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
                    <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                      <Flame size={12} /> Nährwerte für {currentGrams}g
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-0.5 border-b border-zinc-800/50">
                      <span className="text-zinc-400">Brennwert</span>
                      <span className="font-mono text-zinc-300">{scaled.brennwertKj} kJ</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-zinc-800/50">
                      <span className="text-zinc-400 font-semibold">Kalorien</span>
                      <span className="font-mono font-bold text-white">{scaled.calories} kcal</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-zinc-800/50">
                      <span className="text-zinc-400 font-semibold">Protein</span>
                      <span className="font-mono font-bold text-emerald-400">{scaled.protein} g</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-zinc-800/50">
                      <span className="text-zinc-400 font-semibold">Fett</span>
                      <span className="font-mono font-bold text-amber-400">{scaled.fat} g</span>
                    </div>
                    <div className="flex justify-between py-0.5 pl-2 text-[11px] text-zinc-400 border-b border-zinc-800/30">
                      <span>davon gesättigt</span>
                      <span className="font-mono">{scaled.saturatedFat} g</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-zinc-800/50">
                      <span className="text-zinc-400 font-semibold">Kohlenhydrate</span>
                      <span className="font-mono font-bold text-blue-400">{scaled.carbs} g</span>
                    </div>
                    <div className="flex justify-between py-0.5 pl-2 text-[11px] text-zinc-400 border-b border-zinc-800/30">
                      <span>davon Zucker</span>
                      <span className="font-mono">{scaled.sugar} g</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-zinc-800/50">
                      <span className="text-zinc-400">Cholesterin</span>
                      <span className="font-mono text-zinc-300">{scaled.cholesterol} mg</span>
                    </div>
                    <div className="flex justify-between py-0.5 text-zinc-400">
                      <span>Wassergehalt</span>
                      <span className="font-mono text-zinc-300">{scaled.waterContent}%</span>
                    </div>
                  </div>
                </div>

                {/* Column 2: Vitamins */}
                <div className="bg-[#11141d] border border-zinc-800/80 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
                    <span className="text-[11px] font-bold text-purple-400 flex items-center gap-1">
                      <Sparkles size={12} /> Vitamine
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-0.5 border-b border-zinc-800/50">
                      <span className="text-zinc-400">Vitamin A (Retinol)</span>
                      <span className="font-mono text-zinc-200">{scaled.vitamins.vitA} µg</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-zinc-800/50">
                      <span className="text-zinc-400">Vitamin D3</span>
                      <span className="font-mono text-zinc-200">{scaled.vitamins.vitD} µg</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-zinc-800/50">
                      <span className="text-zinc-400">Vitamin E</span>
                      <span className="font-mono text-zinc-200">{scaled.vitamins.vitE} mg</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-zinc-800/50">
                      <span className="text-zinc-400">Vitamin C</span>
                      <span className="font-mono text-zinc-200">{scaled.vitamins.vitC} mg</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-zinc-800/50">
                      <span className="text-zinc-400">Vitamin B1</span>
                      <span className="font-mono text-zinc-200">{scaled.vitamins.vitB1} mg</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-zinc-800/50">
                      <span className="text-zinc-400">Vitamin B2</span>
                      <span className="font-mono text-zinc-200">{scaled.vitamins.vitB2} mg</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-zinc-800/50">
                      <span className="text-zinc-400">Vitamin B6</span>
                      <span className="font-mono text-zinc-200">{scaled.vitamins.vitB6} mg</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-zinc-800/50">
                      <span className="text-zinc-400 font-semibold">Vitamin B12</span>
                      <span className="font-mono font-bold text-purple-300">{scaled.vitamins.vitB12} µg</span>
                    </div>
                    <div className="flex justify-between py-0.5 text-zinc-400">
                      <span className="font-semibold text-zinc-300">Cholin (Fokus)</span>
                      <span className="font-mono font-bold text-amber-300">{scaled.vitamins.cholin} mg</span>
                    </div>
                  </div>
                </div>

                {/* Column 3: Minerals & Trace Elements */}
                <div className="bg-[#11141d] border border-zinc-800/80 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <Zap size={12} /> Mineralstoffe
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-0.5 border-b border-zinc-800/50">
                      <span className="text-zinc-400 font-semibold">Magnesium</span>
                      <span className="font-mono font-bold text-emerald-300">{scaled.minerals.magnesium} mg</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-zinc-800/50">
                      <span className="text-zinc-400 font-semibold">Zink</span>
                      <span className="font-mono font-bold text-emerald-300">{scaled.minerals.zink} mg</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-zinc-800/50">
                      <span className="text-zinc-400">
                        Eisen {scaled.minerals.isHemeIron ? '(Häm-Eisen)' : '(Pflanzlich)'}
                      </span>
                      <span className="font-mono text-zinc-200">{scaled.minerals.eisen} mg</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-zinc-800/50">
                      <span className="text-zinc-400">Kalium</span>
                      <span className="font-mono text-zinc-200">{scaled.minerals.kalium} mg</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-zinc-800/50">
                      <span className="text-zinc-400">Kalzium</span>
                      <span className="font-mono text-zinc-200">{scaled.minerals.kalzium} mg</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-zinc-800/50">
                      <span className="text-zinc-400">Phosphor</span>
                      <span className="font-mono text-zinc-200">{scaled.minerals.phosphor} mg</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-zinc-800/50">
                      <span className="text-zinc-400">Selen</span>
                      <span className="font-mono text-zinc-200">{scaled.minerals.selen} µg</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-zinc-800/50">
                      <span className="text-zinc-400">Kupfer</span>
                      <span className="font-mono text-zinc-200">{scaled.minerals.kupfer} mg</span>
                    </div>
                    <div className="flex justify-between py-0.5 text-zinc-400">
                      <span>Chlorid / Schwefel</span>
                      <span className="font-mono text-zinc-200">{scaled.minerals.chlorid} mg</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Aura Bio-Audit & Cellular Impact */}
              <div className="p-3 rounded-2xl bg-[#11141d] border border-zinc-800/80 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <ShieldCheck size={15} className="text-emerald-400" />
                  <span>Aura Bio-Audit & Zellulärer Einfluss</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">{scaled.cellPower}</p>
                {scaled.antiNutrients && (
                  <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] flex items-start gap-1.5">
                    <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                    <span>{scaled.antiNutrients}</span>
                  </div>
                )}
              </div>

              {/* Meal Category & Save */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-start">
                  <span className="text-[10px] uppercase font-semibold text-zinc-400">Kategorie:</span>
                  <div className="flex gap-1 text-xs">
                    {['Frühstück', 'Mittagessen', 'Abendessen', 'Snack'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setMealCategory(cat)}
                        className={`px-2 py-1 rounded-lg font-medium transition-all ${
                          mealCategory === cat
                            ? 'bg-amber-500 text-black font-bold'
                            : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveScaledMeal}
                  className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl shadow-lg transition-all text-xs flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={15} />
                  <span>Jetzt eintragen ({scaled.calories} kcal)</span>
                </button>
              </div>

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
              Noch keine Mahlzeiten eingetragen. Nutze die Suche oder den Barcode-Scanner!
            </div>
          ) : (
            dailyEntries.map((meal) => (
              <div 
                key={meal.id}
                className="p-2.5 rounded-xl bg-[#11131a] border border-zinc-800/80 flex items-center justify-between gap-3 text-xs"
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
