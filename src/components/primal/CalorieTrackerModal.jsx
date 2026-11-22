import React, { useState, useEffect, useRef } from 'react';
import { getApiBaseUrl } from '../../services/apiConfig';
const API_BASE = getApiBaseUrl();
import { 
  Flame, Plus, Search, Trash2, X, Sparkles, CheckCircle2, Scale, 
  Clock, QrCode, Camera, ShieldCheck, AlertTriangle, ChevronRight, ChevronLeft, Zap, Droplet,
  ChevronDown, ChevronUp, PieChart, BookOpen, Utensils, Mic, MicOff, Edit3, Activity, Heart, Send
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

  // Active View Mode inside Tracker: 'dashboard' | 'foodscan_hub' | 'food_search_modal'
  const [activeSubView, setActiveSubView] = useState('dashboard');

  // Edit meal modal / slide
  const [editingMeal, setEditingMeal] = useState(null);

  // AI FoodScan Interactive State
  const [aiInputMode, setAiInputMode] = useState('text'); // 'text' | 'voice' | 'photo' | 'barcode'
  const [aiFoodText, setAiFoodText] = useState('');
  const [isAiListening, setIsAiListening] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  // Live Fasting Timer State
  const [fastingSeconds, setFastingSeconds] = useState(55903); // starts around 15:31:43
  useEffect(() => {
    const timer = setInterval(() => {
      setFastingSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatFastingTime = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Food Search Modal Tab: 'kürzlich' | 'gesucht' | 'favoriten'
  const [searchTab, setSearchTab] = useState('kürzlich');

  // Carousel Slide Index for Dashboard Stats (0: Gauge Speedometer, 1: Macro Breakdown, 2: Micronutrients/Electrolytes, 3: Equation Summary)
  const [dashboardSlide, setDashboardSlide] = useState(0);

  // Quick Action FAB Menu State (+ button bottom right)
  const [isFabOpen, setIsFabOpen] = useState(false);

  // Accordion open state for meal categories (Frühstück, Mittagessen, Abendessen, Snacks)
  const [openCategories, setOpenCategories] = useState({
    'Frühstück': true,
    'Mittagessen': true,
    'Abendessen': true,
    'Snack': true
  });

  const toggleCategory = (cat) => {
    setOpenCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

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

  // Reload entries when day changes OR when external meal is logged
  useEffect(() => {
    const loadEntries = () => {
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
    };

    loadEntries();

    const handleStorageUpdate = (e) => {
      if (e?.detail?.dateKey && e.detail.dateKey !== currentDateKey) return;
      loadEntries();
    };

    window.addEventListener('storage', loadEntries);
    window.addEventListener('aura_meals_updated', handleStorageUpdate);

    return () => {
      window.removeEventListener('storage', loadEntries);
      window.removeEventListener('aura_meals_updated', handleStorageUpdate);
    };
  }, [currentDateKey, isOpen]);

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

    const updated = [newEntry, ...dailyEntries];
    setDailyEntries(updated);
    try {
      localStorage.setItem(`aura_meals_${currentDateKey}`, JSON.stringify(updated));
    } catch(e) {}
    setActiveItemForDetail(null);
    setActiveProfile(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeMeal = (id) => {
    const updated = dailyEntries.filter(e => e.id !== id);
    setDailyEntries(updated);
    try {
      localStorage.setItem(`aura_meals_${currentDateKey}`, JSON.stringify(updated));
    } catch(e) {}
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

        {/* FDDB-Inspired 7-Day Circular Calendar Bar */}
        <div className="flex items-center justify-between gap-1 bg-[#0d0f17] border border-zinc-800/80 rounded-2xl p-2">
          {[-6, -5, -4, -3, -2, -1, 0].map((offset) => {
            const dateObj = new Date();
            dateObj.setDate(dateObj.getDate() + offset);
            const dayNum = dateObj.getDate();
            const weekday = dateObj.toLocaleDateString('de-DE', { weekday: 'short' });
            const isSelected = dayOffset === offset;
            const isToday = offset === 0;

            // Check if user has meals on that day
            const dKey = getTargetDateKey(offset);
            let hasMeals = false;
            try {
              const savedMeals = localStorage.getItem(`aura_meals_${dKey}`);
              if (savedMeals && JSON.parse(savedMeals).length > 0) hasMeals = true;
            } catch(e) {}

            return (
              <button
                key={offset}
                type="button"
                onClick={() => setDayOffset(offset)}
                className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
                  isSelected
                    ? 'bg-gradient-to-b from-sky-500/20 to-blue-600/20 border border-sky-400 shadow-md shadow-sky-500/20'
                    : 'hover:bg-zinc-800/40 border border-transparent'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-transform ${
                  isSelected
                    ? 'bg-sky-400 text-black shadow-lg shadow-sky-400/40 scale-105'
                    : hasMeals
                      ? 'bg-rose-500/20 border border-rose-500/50 text-rose-300'
                      : 'bg-zinc-800/80 border border-zinc-700/50 text-zinc-300'
                }`}>
                  {dayNum}
                </div>
                <span className={`text-[10px] mt-1 font-semibold uppercase tracking-wider ${
                  isSelected ? 'text-sky-400' : (isToday ? 'text-white' : 'text-zinc-500')
                }`}>
                  {weekday}
                </span>
              </button>
            );
          })}
        </div>

        {/* Circadian Fasting / Metabolic State Pill */}
        <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-gradient-to-r from-[#21193a] to-[#1c1833] border border-purple-900/40 text-xs shadow-md">
          <div className="flex items-center gap-2.5">
            <Clock size={16} className="text-purple-300 animate-pulse" />
            <span className="text-xs font-semibold text-purple-200">Fasten</span>
            <span className="text-xs font-mono font-bold text-white tracking-wide">{formatFastingTime(fastingSeconds)}</span>
          </div>
          <ChevronRight size={16} className="text-purple-400/80" />
        </div>

        {/* 1. FDDB-Authentic Dashboard Card */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[#0f121d] border border-zinc-800/80 shadow-2xl relative">
          
          {/* Header Row: Dein Tag + Details */}
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-bold text-white text-sm">Dein Tag</span>
            <button 
              type="button"
              onClick={() => setDashboardSlide(prev => (prev + 1) % 4)}
              className="text-sky-400 hover:text-sky-300 font-semibold text-xs flex items-center gap-1 transition-colors"
            >
              <span>Details</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Slide 0: The Classic Circular Arc Layout matching FDDB */}
          {dashboardSlide === 0 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Central Speedometer Row with perfect symmetry */}
              <div className="grid grid-cols-3 items-center text-center">
                
                {/* Left: 2.194 gegessen / 100% erreicht */}
                <div className="flex flex-col items-center justify-center">
                  <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">{totalCalories}</span>
                  <span className="text-[11px] text-zinc-400 font-medium">gegessen</span>
                  <span className="text-[10px] text-zinc-500 font-medium mt-2">{progressPercent}% erreicht</span>
                </div>

                {/* Center: The Iconic Arc with remaining calories in the middle */}
                <div className="relative w-36 sm:w-44 h-24 mx-auto flex flex-col items-center justify-end">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 160 95">
                    {/* Background Arc */}
                    <path
                      d="M 20 85 A 60 60 0 0 1 140 85"
                      fill="none"
                      stroke="#222838"
                      strokeWidth="9"
                      strokeLinecap="round"
                    />
                    {/* Active Sky-Blue Glowing Progress Arc */}
                    <path
                      d="M 20 85 A 60 60 0 0 1 140 85"
                      fill="none"
                      stroke={caloriesRemaining < 0 ? '#f43f5e' : '#60a5fa'}
                      strokeWidth="9"
                      strokeLinecap="round"
                      strokeDasharray="188"
                      strokeDashoffset={188 - (188 * Math.min(100, progressPercent)) / 100}
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>

                  {/* Centered Number inside Arc - aligned with left & right columns */}
                  <div className="absolute inset-0 flex flex-col items-center justify-start pt-2">
                    <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight leading-none ${
                      caloriesRemaining < 0 ? 'text-rose-400' : 'text-white'
                    }`}>
                      {Math.max(0, caloriesRemaining)}
                    </span>
                    <span className="text-[11px] text-zinc-400 font-medium mt-1">übrig</span>
                  </div>
                </div>

                {/* Right: 0 verbrannt / 2.200 Ziel */}
                <div className="flex flex-col items-center justify-center">
                  <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">0</span>
                  <span className="text-[11px] text-zinc-400 font-medium">verbrannt</span>
                  <div className="mt-2 text-right">
                    <span className="text-[11px] text-zinc-300 font-mono font-bold block">{calorieTarget}</span>
                    <span className="text-[9px] text-zinc-500 uppercase font-medium">Ziel</span>
                  </div>
                </div>

              </div>

              {/* Bottom: 3 Macro Indicators with Pill-Bars (Fett, KH, Protein) */}
              <div className="grid grid-cols-3 gap-4 pt-2">
                {/* Fett */}
                <div className="flex flex-col items-center text-center">
                  <span className="text-xs font-semibold text-zinc-300 mb-1">Fett</span>
                  <div className="w-full max-w-[80px] h-1.5 rounded-full bg-[#2a1c22] overflow-hidden mb-1">
                    <div 
                      className="h-full rounded-full bg-[#f87171] transition-all duration-500"
                      style={{ width: `${Math.min(100, (totalFat / 60) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-zinc-400 font-mono">{totalFat}/60 g</span>
                </div>

                {/* KH */}
                <div className="flex flex-col items-center text-center">
                  <span className="text-xs font-semibold text-zinc-300 mb-1">KH</span>
                  <div className="w-full max-w-[80px] h-1.5 rounded-full bg-[#2d2516] overflow-hidden mb-1">
                    <div 
                      className="h-full rounded-full bg-[#fbbf24] transition-all duration-500"
                      style={{ width: `${Math.min(100, (totalCarbs / 390) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-zinc-400 font-mono">{totalCarbs}/390 g</span>
                </div>

                {/* Protein */}
                <div className="flex flex-col items-center text-center">
                  <span className="text-xs font-semibold text-zinc-300 mb-1">Protein</span>
                  <div className="w-full max-w-[80px] h-1.5 rounded-full bg-[#182a22] overflow-hidden mb-1">
                    <div 
                      className="h-full rounded-full bg-[#4ade80] transition-all duration-500"
                      style={{ width: `${Math.min(100, (totalProtein / 130) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-zinc-400 font-mono">{totalProtein}/130 g</span>
                </div>
              </div>

            </div>
          )}

          {/* Slide 1: Pure Grams & Kcal Display */}
          {dashboardSlide === 1 && (
            <div className="grid grid-cols-4 gap-2 text-center py-2 animate-in fade-in duration-200">
              <div className="p-2.5 rounded-2xl bg-[#141824] border border-zinc-800/80">
                <span className="text-xl font-black text-[#f87171] font-mono">{totalFat} g</span>
                <span className="text-[10px] text-zinc-400 block mt-1 font-medium">Fett</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-[#141824] border border-zinc-800/80">
                <span className="text-xl font-black text-[#fbbf24] font-mono">{totalCarbs} g</span>
                <span className="text-[10px] text-zinc-400 block mt-1 font-medium">KH</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-[#141824] border border-zinc-800/80">
                <span className="text-xl font-black text-[#4ade80] font-mono">{totalProtein} g</span>
                <span className="text-[10px] text-zinc-400 block mt-1 font-medium">Protein</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-[#141824] border border-sky-500/40">
                <span className="text-xl font-black text-sky-400 font-mono">{totalCalories}</span>
                <span className="text-[10px] text-sky-300 block mt-1 font-medium">kcal</span>
              </div>
            </div>
          )}

          {/* Slide 2: Electrolytes & Hydration (Salz, Kalium, Wasser, Gesättigt) */}
          {dashboardSlide === 2 && (
            <div className="grid grid-cols-4 gap-2 text-center py-2 animate-in fade-in duration-200">
              <div className="p-2.5 rounded-2xl bg-[#141824] border border-zinc-800/80">
                <span className="text-xl font-black text-cyan-300 font-mono">6.2 g</span>
                <span className="text-[10px] text-zinc-400 block mt-1 font-medium">Meersalz</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-[#141824] border border-zinc-800/80">
                <span className="text-xl font-black text-purple-300 font-mono">3.8 g</span>
                <span className="text-[10px] text-zinc-400 block mt-1 font-medium">Kalium</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-[#141824] border border-zinc-800/80">
                <span className="text-xl font-black text-blue-400 font-mono">2.4 L</span>
                <span className="text-[10px] text-zinc-400 block mt-1 font-medium">Wasser</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-[#141824] border border-zinc-800/80">
                <span className="text-xl font-black text-amber-300 font-mono">28 g</span>
                <span className="text-[10px] text-zinc-400 block mt-1 font-medium">Gesätt. Fett</span>
              </div>
            </div>
          )}

          {/* Slide 3: Formula Equation: Ziel - Gegessen + Verbrannt = Übrig */}
          {dashboardSlide === 3 && (
            <div className="flex items-center justify-around text-center py-2 animate-in fade-in duration-200">
              <div>
                <span className="text-xl font-black text-white font-mono">{calorieTarget}</span>
                <span className="text-[10px] text-zinc-400 block font-medium">Ziel</span>
              </div>
              <span className="text-zinc-600 font-bold text-lg">-</span>
              <div>
                <span className="text-xl font-black text-sky-400 font-mono">{totalCalories}</span>
                <span className="text-[10px] text-zinc-400 block font-medium">gegessen</span>
              </div>
              <span className="text-zinc-600 font-bold text-lg">+</span>
              <div>
                <span className="text-xl font-black text-emerald-400 font-mono">0</span>
                <span className="text-[10px] text-zinc-400 block font-medium">verbrannt</span>
              </div>
              <span className="text-zinc-600 font-bold text-lg">=</span>
              <div>
                <span className="text-xl font-black text-amber-400 font-mono">{Math.max(0, caloriesRemaining)}</span>
                <span className="text-[10px] text-amber-300 block font-bold">übrig</span>
              </div>
            </div>
          )}

          {/* Carousel Pagination Dots & Nav Controls */}
          <div className="flex items-center justify-center gap-1.5 pt-3 mt-1">
            {[0, 1, 2, 3].map(idx => (
              <button
                key={idx}
                type="button"
                onClick={() => setDashboardSlide(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  dashboardSlide === idx ? 'w-4 bg-sky-400 shadow-sm shadow-sky-400/50' : 'w-1.5 bg-zinc-700 hover:bg-zinc-600'
                }`}
              />
            ))}
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

        {/* 4. Categorized Food Log (Frühstück, Mittagessen, Abendessen, Snacks) - Accordion View */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-56 sm:max-h-64 pb-12">
          {['Frühstück', 'Mittagessen', 'Abendessen', 'Snack'].map((category) => {
            const meals = dailyEntries.filter(m => (m.category || 'Mahlzeit') === category || (category === 'Snack' && m.category === 'Mahlzeit'));
            const catKcal = meals.reduce((sum, m) => sum + (Number(m.calories) || 0), 0);
            const catProt = Math.round(meals.reduce((sum, m) => sum + (Number(m.protein) || 0), 0) * 10) / 10;
            const catFat = Math.round(meals.reduce((sum, m) => sum + (Number(m.fat) || 0), 0) * 10) / 10;
            const catCarb = Math.round(meals.reduce((sum, m) => sum + (Number(m.carbs) || 0), 0) * 10) / 10;
            const isOpen = openCategories[category] !== false;

            return (
              <div key={category} className="rounded-2xl bg-[#0d0f17] border border-zinc-800/80 overflow-hidden">
                {/* Category Header */}
                <button
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between bg-zinc-900/40 hover:bg-zinc-900/60 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    {isOpen ? <ChevronUp size={15} className="text-sky-400" /> : <ChevronDown size={15} className="text-zinc-500" />}
                    <div>
                      <span className="font-bold text-white text-xs">{category}</span>
                      <span className="text-[10px] text-zinc-400 ml-2 font-mono">
                        {catFat}g F • {catCarb}g KH • {catProt}g P
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-sky-400">{catKcal} kcal</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMealCategory(category);
                        const searchEl = document.querySelector("input[placeholder*='Mahlzeit suchen']");
                        if (searchEl) searchEl.focus();
                      }}
                      className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                      title={`${category} hinzufügen`}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </button>

                {/* Meals under category */}
                {isOpen && (
                  <div className="divide-y divide-zinc-800/50">
                    {meals.length === 0 ? (
                      <div className="py-2.5 px-4 text-[11px] text-zinc-500 italic">
                        Keine Einträge für {category}.
                      </div>
                    ) : (
                      meals.map((meal) => (
                        <div 
                          key={meal.id}
                          onClick={() => setEditingMeal(meal)}
                          className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-zinc-800/40 cursor-pointer transition-colors group relative"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-300 text-[11px] font-bold shrink-0">
                              🍎
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-white group-hover:text-sky-300 truncate block text-xs transition-colors">
                                {meal.name}
                              </span>
                              <div className="text-[10px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                                {meal.amount && <span>{meal.amount} •</span>}
                                <span>{meal.fat || 0} g F</span>
                                <span>•</span>
                                <span>{meal.carbs || 0} g KH</span>
                                <span>•</span>
                                <span>{meal.protein || 0} g P</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <span className="font-mono font-bold text-white text-xs block">{meal.calories} kcal</span>
                              {meal.time && <span className="text-[10px] text-zinc-500 font-mono block">{meal.time} Uhr</span>}
                            </div>
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeMeal(meal.id);
                              }} 
                              className="text-zinc-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                              title="Eintrag löschen"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 5. Floating Action Button (FAB) Bottom-Right with Menu */}
        <div className="absolute bottom-5 right-5 z-20 flex flex-col items-end gap-2">
          {/* Expanded FAB Menu Items matching FDDB design */}
          {isFabOpen && (
            <div className="flex flex-col items-end gap-2 mb-2 animate-in slide-in-from-bottom-4 fade-in duration-200">
              
              {/* Körperwerte */}
              <button
                type="button"
                onClick={() => {
                  setIsFabOpen(false);
                  alert("Körperwerte-Tracking: Gewicht, KFA & Biomarker werden synchronisiert.");
                }}
                className="h-10 px-4 rounded-full bg-[#1e4a7a] hover:bg-[#255c99] text-white font-medium text-xs flex items-center gap-2.5 shadow-lg shadow-black/60 transition-all border border-sky-400/20 active:scale-95"
              >
                <Scale size={15} className="text-sky-300" />
                <span>Körperwerte</span>
              </button>

              {/* Aktivität */}
              <button
                type="button"
                onClick={() => {
                  setIsFabOpen(false);
                  alert("Aktivität & Kalorienverbrauch werden erfasst.");
                }}
                className="h-10 px-4 rounded-full bg-[#1e4a7a] hover:bg-[#255c99] text-white font-medium text-xs flex items-center gap-2.5 shadow-lg shadow-black/60 transition-all border border-sky-400/20 active:scale-95"
              >
                <Activity size={15} className="text-sky-300" />
                <span>Aktivität</span>
              </button>

              {/* Mahlzeit (Tagebucheintrag) */}
              <button
                type="button"
                onClick={() => {
                  setIsFabOpen(false);
                  setActiveSubView('food_search_modal');
                }}
                className="h-10 px-4 rounded-full bg-[#1e4a7a] hover:bg-[#255c99] text-white font-medium text-xs flex items-center gap-2.5 shadow-lg shadow-black/60 transition-all border border-sky-400/20 active:scale-95"
              >
                <Utensils size={15} className="text-sky-300" />
                <span>Mahlzeit</span>
              </button>

              {/* KI FoodScan */}
              <button
                type="button"
                onClick={() => {
                  setIsFabOpen(false);
                  setActiveSubView('foodscan_hub');
                }}
                className="h-10 px-4 rounded-full bg-[#1e4a7a] hover:bg-[#255c99] text-white font-medium text-xs flex items-center gap-2.5 shadow-lg shadow-black/60 transition-all border border-sky-400/20 active:scale-95"
              >
                <Sparkles size={15} className="text-sky-300" />
                <span>KI FoodScan</span>
              </button>

              {/* Suchen */}
              <button
                type="button"
                onClick={() => {
                  setIsFabOpen(false);
                  setActiveSubView('food_search_modal');
                }}
                className="h-10 px-4 rounded-full bg-[#1e4a7a] hover:bg-[#255c99] text-white font-medium text-xs flex items-center gap-2.5 shadow-lg shadow-black/60 transition-all border border-sky-400/20 active:scale-95"
              >
                <Search size={15} className="text-sky-300" />
                <span>Suchen</span>
              </button>

              {/* Scannen (Barcode) */}
              <button
                type="button"
                onClick={() => {
                  setIsFabOpen(false);
                  if (onOpenBarcodeScanner) onOpenBarcodeScanner();
                }}
                className="h-10 px-4 rounded-full bg-[#1e4a7a] hover:bg-[#255c99] text-white font-medium text-xs flex items-center gap-2.5 shadow-lg shadow-black/60 transition-all border border-sky-400/20 active:scale-95"
              >
                <QrCode size={15} className="text-sky-300" />
                <span>Scannen</span>
              </button>

            </div>
          )}

          {/* Main Neon Cyan FAB Button (Exact round pill button with + / x) */}
          <button
            type="button"
            onClick={() => setIsFabOpen(prev => !prev)}
            className={`w-14 h-14 rounded-full bg-[#60a5fa] hover:bg-[#93c5fd] text-[#090b10] flex items-center justify-center shadow-xl shadow-sky-500/30 active:scale-90 transition-all ${
              isFabOpen ? 'rotate-45 bg-zinc-800 text-white border border-zinc-700' : ''
            }`}
            title="Aktion hinzufügen"
          >
            <Plus size={26} className="stroke-[2.5]" />
          </button>
        </div>

        {/* 6. KI FoodScan SubView Modal (1:1 matching Screenshot 2) */}
        {activeSubView === 'foodscan_hub' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-[#111319] border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col justify-between min-h-[520px]">
              
              {/* Header */}
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-zinc-800/60">
                  <button 
                    onClick={() => setActiveSubView('dashboard')}
                    className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800/60"
                  >
                    <X size={20} />
                  </button>
                  <span className="font-bold text-white text-sm">KI FoodScan</span>
                  <div className="w-6" />
                </div>

                {/* Subtitle */}
                <div className="mt-6 space-y-2">
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    Wie möchtest du deine Mahlzeit tracken?
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Beschreibe dein Essen per Text, Sprache oder Scan — unsere Aura KI erkennt Zutaten und Kalorien automatisch.
                  </p>
                </div>

                {/* Action Pills matching Screenshot 2 */}
                <div className="mt-6 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => setAiInputMode('text')}
                    className={`h-11 px-5 rounded-full font-semibold text-xs flex items-center gap-3 transition-all ${
                      aiInputMode === 'text'
                        ? 'bg-[#1e4a7a] text-white shadow-md shadow-sky-500/20 border border-sky-400/30'
                        : 'bg-[#161a24] text-zinc-300 hover:text-white border border-zinc-800'
                    }`}
                  >
                    <Edit3 size={15} />
                    <span>Text eingeben</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAiInputMode('voice');
                      setIsAiListening(!isAiListening);
                    }}
                    className={`h-11 px-5 rounded-full font-semibold text-xs flex items-center gap-3 transition-all ${
                      isAiListening
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-[#1e4a7a] text-white hover:bg-[#255c99]'
                    }`}
                  >
                    <Mic size={15} />
                    <span>{isAiListening ? 'Ich höre zu... (Tap zum Stoppen)' : 'Spracheingabe machen'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveSubView('dashboard');
                      if (onOpenMealVision) onOpenMealVision();
                    }}
                    className="h-11 px-5 rounded-full bg-[#1e4a7a] hover:bg-[#255c99] text-white font-semibold text-xs flex items-center gap-3 transition-all active:scale-95"
                  >
                    <Camera size={15} />
                    <span>Foto aufnehmen</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveSubView('dashboard');
                      if (onOpenBarcodeScanner) onOpenBarcodeScanner();
                    }}
                    className="h-11 px-5 rounded-full bg-[#1e4a7a] hover:bg-[#255c99] text-white font-semibold text-xs flex items-center gap-3 transition-all active:scale-95"
                  >
                    <QrCode size={15} />
                    <span>Barcode scannen</span>
                  </button>
                </div>
              </div>

              {/* Bottom Natural Language Input Box matching Screenshot 2 */}
              <div className="mt-6 pt-3 border-t border-zinc-800/60">
                <div className="relative flex items-center bg-[#161a25] border border-zinc-700/60 rounded-2xl px-4 py-3 shadow-inner">
                  <input
                    type="text"
                    placeholder="Beschreibe, was du gegessen hast..."
                    value={aiFoodText}
                    onChange={(e) => setAiFoodText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && aiFoodText.trim()) {
                        handleSearch(aiFoodText);
                        setActiveSubView('food_search_modal');
                      }
                    }}
                    className="w-full bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none pr-16"
                  />
                  <div className="absolute right-3 flex items-center gap-2 text-zinc-400">
                    <button 
                      type="button" 
                      onClick={() => {
                        setActiveSubView('dashboard');
                        if (onOpenMealVision) onOpenMealVision();
                      }}
                      className="hover:text-white"
                      title="Foto anfügen"
                    >
                      <Camera size={16} />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setIsAiListening(!isAiListening)}
                      className={`hover:text-white ${isAiListening ? 'text-rose-400' : ''}`}
                      title="Spracheingabe"
                    >
                      <Mic size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (aiFoodText.trim()) {
                          handleSearch(aiFoodText);
                          setActiveSubView('food_search_modal');
                        }
                      }}
                      className="text-sky-400 hover:text-sky-300"
                      title="Senden"
                    >
                      <Send size={15} />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-zinc-500 mt-1.5 px-1">
                  <span>{aiFoodText.length}/500 Zeichen</span>
                  <span>Aura Deep-Science AI</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 7. Tagebucheintrag & Food Search View Modal (1:1 matching Screenshot 3) */}
        {activeSubView === 'food_search_modal' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-[#111319] border border-zinc-800 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[92vh]">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
                <button 
                  onClick={() => setActiveSubView('dashboard')}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800/60"
                >
                  <X size={20} />
                </button>
                <span className="font-bold text-white text-sm">Tagebucheintrag</span>
                <button
                  type="button"
                  onClick={() => setActiveSubView('foodscan_hub')}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800/60"
                >
                  <Plus size={20} />
                </button>
              </div>

              {/* Navigation Tabs (Suche, Favoriten, Meine Rezepte, Aktivitäten) */}
              <div className="flex border-b border-zinc-800/80 gap-4 mt-3 overflow-x-auto text-xs font-semibold no-scrollbar">
                {['Suche', 'Favoriten', 'Meine Rezepte', 'Aktivitäten', 'Kalorien'].map((tab, idx) => (
                  <button
                    key={tab}
                    className={`pb-2.5 transition-colors whitespace-nowrap ${
                      idx === 0
                        ? 'border-b-2 border-sky-400 text-sky-400'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Search Bar matching Screenshot 3 */}
              <div className="relative mt-3.5">
                <Search className="absolute left-3.5 top-3 text-zinc-400" size={16} />
                <input
                  type="text"
                  placeholder="Lebensmittel suchen..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full bg-[#181c28] border border-zinc-700/60 rounded-2xl pl-10 pr-16 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
                />
                <div className="absolute right-3 top-2.5 flex items-center gap-2 text-zinc-400">
                  <button 
                    onClick={() => {
                      setActiveSubView('dashboard');
                      if (onOpenBarcodeScanner) onOpenBarcodeScanner();
                    }}
                    title="Barcode scannen"
                    className="hover:text-white"
                  >
                    <QrCode size={16} />
                  </button>
                  <button 
                    onClick={() => setActiveSubView('foodscan_hub')}
                    title="KI Scan"
                    className="hover:text-sky-400"
                  >
                    <Sparkles size={16} className="text-purple-400" />
                  </button>
                </div>
              </div>

              {/* Sub-Tabs: Kürzlich eingetragen | Zuletzt gesucht */}
              <div className="flex items-center gap-6 mt-4 border-b border-zinc-800/50 pb-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setSearchTab('kürzlich')}
                  className={`transition-colors ${
                    searchTab === 'kürzlich' ? 'text-white border-b-2 border-sky-400 pb-1' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Kürzlich eingetragen
                </button>
                <button
                  type="button"
                  onClick={() => setSearchTab('gesucht')}
                  className={`transition-colors ${
                    searchTab === 'gesucht' ? 'text-white border-b-2 border-sky-400 pb-1' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Zuletzt gesucht
                </button>
              </div>

              {/* Items List (Live Search Results or Recent Grocery Items matching Screenshot 3) */}
              <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/40 mt-2 pr-1">
                {(searchResults.length > 0 ? searchResults : [
                  { id: 'f1', name: 'Apfel (frisch)', serving: 'mittelgroßer (130 g)', calories: 70, fat: 0, carbs: 19, protein: 0 },
                  { id: 'f2', name: 'Mango Chunks (Frozen)', serving: '250 g', calories: 165, fat: 1, carbs: 36, protein: 1 },
                  { id: 'f3', name: 'Banane (frisch)', serving: '100 g', calories: 93, fat: 0, carbs: 20, protein: 1 },
                  { id: 'f4', name: 'Mandarine (frisch)', serving: '2x mittelgroße (210 g)', calories: 55, fat: 0, carbs: 11, protein: 1 },
                  { id: 'f5', name: 'Kartoffel (gegart, mit Schale)', serving: '700 g', calories: 455, fat: 1, carbs: 83, protein: 14 },
                  { id: 'f6', name: 'Prosciutto', serving: '100 g', calories: 234, fat: 14, carbs: 0, protein: 27 },
                  { id: 'f7', name: 'Honig (Bio-Rohkost)', serving: '50 g', calories: 153, fat: 0, carbs: 38, protein: 0 }
                ]).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setActiveSubView('dashboard');
                      openDetailCalculator(item);
                    }}
                    className="py-3 px-1 flex items-center justify-between hover:bg-zinc-800/30 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-sm font-bold shrink-0">
                        🍎
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-white group-hover:text-sky-300 transition-colors block text-xs truncate">
                          {item.name}
                        </span>
                        <span className="text-[11px] text-zinc-400 block mt-0.5">
                          {item.serving}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
                          {item.calories} kcal - {item.fat} g F, {item.carbs} g KH, {item.protein} g P
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveSubView('dashboard');
                        openDetailCalculator(item);
                      }}
                      className="w-8 h-8 rounded-full bg-[#1e4a7a] group-hover:bg-[#255c99] text-white flex items-center justify-center shrink-0 shadow-md shadow-sky-500/10 transition-transform active:scale-90"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

        {/* 8. Edit / View Meal Details Modal (1:1 matching Screenshot from Video Frame sec 110) */}
        {editingMeal && (() => {
          const defaultGram = parseInt((editingMeal.amount || '').match(/(\d+)\s*g/i)?.[1] || 100, 10);
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
              <div className="w-full max-w-sm bg-[#111319] border border-zinc-800 rounded-3xl p-5 shadow-2xl flex flex-col justify-between min-h-[460px]">
                
                {/* Header matching FDDB: X on left, "Eintrag bearbeiten" center, Trash on right */}
                <div>
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                    <button
                      type="button"
                      onClick={() => setEditingMeal(null)}
                      className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800"
                    >
                      <X size={20} />
                    </button>
                    <span className="font-bold text-white text-sm">Eintrag bearbeiten</span>
                    <button
                      type="button"
                      onClick={() => {
                        removeMeal(editingMeal.id);
                        setEditingMeal(null);
                      }}
                      className="p-1.5 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Eintrag löschen"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* Title & Brand */}
                  <div className="mt-4">
                    <h4 className="text-lg font-bold text-white">{editingMeal.name}</h4>
                    <span className="text-xs text-zinc-400 block mt-0.5">Aura Food Database</span>
                  </div>

                  {/* 4 Macro Pillars matching FDDB */}
                  <div className="grid grid-cols-4 gap-2 text-center py-3 mt-3">
                    <div>
                      <span className="text-sm font-black text-white font-mono block">{editingMeal.calories}</span>
                      <span className="text-[10px] text-zinc-400 font-medium">kcal</span>
                    </div>
                    <div>
                      <span className="text-sm font-black text-white font-mono block">{editingMeal.fat || 0} g</span>
                      <span className="text-[10px] text-zinc-400 font-medium">Fett</span>
                    </div>
                    <div>
                      <span className="text-sm font-black text-white font-mono block">{editingMeal.carbs || 0} g</span>
                      <span className="text-[10px] text-zinc-400 font-medium">KH</span>
                    </div>
                    <div>
                      <span className="text-sm font-black text-white font-mono block">{editingMeal.protein || 0} g</span>
                      <span className="text-[10px] text-zinc-400 font-medium">Protein</span>
                    </div>
                  </div>

                  {/* Portion & Unit Input Box matching FDDB Frame 110 */}
                  <div className="flex gap-2.5 mt-2">
                    <div className="w-1/3 bg-[#181c28] border-2 border-sky-400/80 rounded-2xl p-2.5 text-center flex flex-col justify-center">
                      <input
                        type="number"
                        id="edit-meal-gram-input"
                        defaultValue={defaultGram}
                        className="w-full bg-transparent text-center font-mono text-base font-bold text-white focus:outline-none"
                      />
                    </div>
                    <div className="w-2/3 bg-[#181c28] border border-zinc-700/80 rounded-2xl px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-zinc-200">
                      <span>Gramm (g)</span>
                      <ChevronDown size={16} className="text-zinc-400" />
                    </div>
                  </div>

                  {/* Zeitpunkt Card */}
                  <div className="mt-4 p-3.5 rounded-2xl bg-[#141824] border border-zinc-800 space-y-1.5">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">Zeitpunkt</span>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-300 flex items-center gap-1.5">
                        <Clock size={13} className="text-sky-400" /> Datum & Uhrzeit
                      </span>
                      <span className="font-semibold text-white bg-zinc-800/80 px-2.5 py-1 rounded-lg border border-zinc-700">
                        {editingMeal.time || 'Heute'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Buttons matching FDDB Frame 110 */}
                <div className="space-y-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('edit-meal-gram-input');
                      const newGram = parseInt(input?.value || defaultGram, 10);
                      const ratio = newGram / (defaultGram || 100);
                      const updated = dailyEntries.map(m => {
                        if (m.id === editingMeal.id) {
                          return {
                            ...m,
                            amount: `${newGram} g`,
                            calories: Math.round(m.calories * ratio),
                            protein: Math.round((m.protein || 0) * ratio * 10) / 10,
                            fat: Math.round((m.fat || 0) * ratio * 10) / 10,
                            carbs: Math.round((m.carbs || 0) * ratio * 10) / 10,
                          };
                        }
                        return m;
                      });
                      setDailyEntries(updated);
                      try {
                        localStorage.setItem(`aura_meals_${currentDateKey}`, JSON.stringify(updated));
                      } catch(e) {}
                      setEditingMeal(null);
                    }}
                    className="w-full py-3.5 rounded-2xl bg-[#60a5fa] hover:bg-[#93c5fd] text-black font-extrabold text-sm shadow-lg shadow-sky-500/20 active:scale-95 transition-all"
                  >
                    Speichern
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const copy = {
                        ...editingMeal,
                        id: 'copy_' + Date.now(),
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      };
                      const updated = [copy, ...dailyEntries];
                      setDailyEntries(updated);
                      try {
                        localStorage.setItem(`aura_meals_${currentDateKey}`, JSON.stringify(updated));
                      } catch(e) {}
                      setEditingMeal(null);
                    }}
                    className="w-full py-3 rounded-2xl bg-[#1e4a7a] hover:bg-[#255c99] text-white font-bold text-xs transition-all active:scale-95"
                  >
                    Kopieren
                  </button>
                </div>

              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}
