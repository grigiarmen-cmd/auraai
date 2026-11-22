import React, { useState, useEffect } from 'react';
import { getApiBaseUrl } from '../../services/apiConfig';
const API_BASE = getApiBaseUrl();
import { searchFoodDatabase as searchLocalFoodDatabase } from '../../services/foodDatabase';
import { Flame, Plus, Search, Trash2, X, Sparkles, CheckCircle2, Apple, ChevronRight, Activity, Clock } from 'lucide-react';

export default function CalorieTrackerModal({ isOpen, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Daily Log State stored in localStorage by date string YYYY-MM-DD
  const todayKey = new Date().toISOString().split('T')[0];
  const [dailyEntries, setDailyEntries] = useState(() => {
    try {
      const saved = localStorage.getItem(`aura_meals_${todayKey}`);
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return [
      { id: '1', name: '3 Rühreier in Weidebutter', calories: 340, protein: 21, fat: 28, carbs: 1.5, time: '08:30' }
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
      // 1. Try Local Food Database directly in frontend for instant offline response
      const localResults = searchLocalFoodDatabase(q);
      
      // 2. Fetch from backend if available
      try {
        const res = await fetch(`${API_BASE}/api/food/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          const items = data.foods || data.results || [];
          setSearchResults(items.length > 0 ? items : localResults);
          return;
        }
      } catch(e) {}
      
      setSearchResults(localResults);
    } catch(e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const addMealToLog = (item) => {
    const newEntry = {
      id: 'entry_' + Date.now(),
      name: item.name,
      calories: item.calories,
      protein: item.protein,
      fat: item.fat,
      carbs: item.carbs,
      micros: item.micros,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setDailyEntries([newEntry, ...dailyEntries]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeMeal = (id) => {
    setDailyEntries(dailyEntries.filter(e => e.id !== id));
  };

  // Macro Totals
  const totalCalories = dailyEntries.reduce((sum, item) => sum + (Number(item.calories) || 0), 0);
  const totalProtein = dailyEntries.reduce((sum, item) => sum + (Number(item.protein) || 0), 0);
  const totalFat = dailyEntries.reduce((sum, item) => sum + (Number(item.fat) || 0), 0);
  const totalCarbs = dailyEntries.reduce((sum, item) => sum + (Number(item.carbs) || 0), 0);

  const calorieTarget = Number(userProfile?.targetCalories) || 2400;
  const caloriesRemaining = calorieTarget - totalCalories;
  const progressPercent = Math.min(100, Math.round((totalCalories / calorieTarget) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-zinc-950/95 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] p-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Flame size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-1.5">
                Aura Nährstoff & Kalorien-Tracker <Sparkles size={14} className="text-amber-400" />
              </h2>
              <p className="text-[11px] text-zinc-400">Tagesbudget, Makros & Mahlzeiten-Suche</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 1. Yazio Style Calorie Budget Speedometer & Remaining Display */}
        <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">Tagesbudget</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black text-white">{caloriesRemaining}</span>
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
          <div className="w-full h-2.5 rounded-full bg-zinc-800 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                caloriesRemaining < 0 ? 'bg-rose-500' : 'bg-gradient-to-r from-emerald-500 to-amber-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Macro Pills */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
              <span className="text-[10px] text-zinc-400 uppercase">Protein</span>
              <p className="text-xs font-bold text-emerald-400 mt-0.5">{totalProtein}g</p>
            </div>
            <div className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
              <span className="text-[10px] text-zinc-400 uppercase">Fett</span>
              <p className="text-xs font-bold text-amber-400 mt-0.5">{totalFat}g</p>
            </div>
            <div className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
              <span className="text-[10px] text-zinc-400 uppercase">Carbs</span>
              <p className="text-xs font-bold text-blue-400 mt-0.5">{totalCarbs}g</p>
            </div>
          </div>
        </div>

        {/* 2. Fast Food Search / Database Input */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 text-zinc-500" size={16} />
            <input
              type="text"
              placeholder="Mahlzeit suchen (z.B. 'Pizza Margherita', 'Döner', 'Steak', 'Rühreier')..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Autocomplete Search Dropdown */}
          {searchResults.length > 0 && (
            <div className="border border-zinc-800 rounded-xl bg-zinc-900/95 overflow-hidden divide-y divide-zinc-800/60 shadow-xl max-h-48 overflow-y-auto">
              {searchResults.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => addMealToLog(item)}
                  className="p-2.5 hover:bg-zinc-800/60 cursor-pointer flex items-center justify-between text-xs transition-colors"
                >
                  <div>
                    <span className="font-semibold text-white">{item.name}</span>
                    <span className="text-[10px] text-zinc-400 block">{item.serving}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-400">{item.calories} kcal</span>
                    <button className="p-1 rounded bg-amber-500/20 text-amber-300">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Daily Food Log List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-48">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold px-1">
            <span>Heute gegessen ({dailyEntries.length})</span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <Clock size={12} /> 24h Auto-Zusammenfassung aktiv
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
                className="p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white truncate">{meal.name}</span>
                    <span className="text-[10px] text-zinc-500">{meal.time}</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 flex items-center gap-2 mt-0.5">
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
