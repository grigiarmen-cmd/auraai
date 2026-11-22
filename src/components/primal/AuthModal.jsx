import React, { useState, useEffect } from 'react';
import { Mail, KeyRound, Lock, CheckCircle2, Shield, HeartPulse, Activity, Sparkles, X, ArrowRight, Loader2, Dumbbell, Home, Plus, Trash2, BookOpen, ExternalLink, LogIn, UserPlus } from 'lucide-react';

import { getApiBaseUrl } from '../../services/apiConfig';
const API_BASE = getApiBaseUrl();

const ALL_SPORTS = [
  { id: 'weightlifting', name: '🏋️ Krafttraining / Gym', met: 5.5 },
  { id: 'heavy_powerlifting', name: '🏋️‍♂️ Powerlifting / Schweres Heben', met: 6.5 },
  { id: 'running', name: '🏃 Laufen / Joggen', met: 8.5 },
  { id: 'sprinting', name: '⚡ Sprints / Intervalltraining', met: 12.0 },
  { id: 'walking', name: '🚶 Spaziergang / Wandern', met: 3.5 },
  { id: 'swimming', name: '🏊 Schwimmen', met: 7.0 },
  { id: 'cycling', name: '🚴 Radfahren / Rennrad', met: 6.8 },
  { id: 'boxing_mma', name: '🥊 Boxen / Kampfsport / MMA', met: 9.0 },
  { id: 'soccer', name: '⚽ Fußball', met: 8.0 },
  { id: 'basketball', name: '🏀 Basketball', met: 7.5 },
  { id: 'tennis', name: '🎾 Tennis / Padel', met: 7.3 },
  { id: 'calisthenics', name: '🤸 Calisthenics / Turnen', met: 6.0 },
  { id: 'crossfit', name: '🔥 CrossFit / HIIT', met: 8.5 },
  { id: 'rowing', name: '🚣 Rudern', met: 7.0 },
  { id: 'climbing', name: '🧗 Klettern / Bouldern', met: 7.5 },
  { id: 'yoga_pilates', name: '🧘 Yoga / Pilates / Stretching', met: 3.0 },
  { id: 'martial_arts', name: '🥋 Judo / BJJ / Karate', met: 8.0 }
];

const DAILY_CHORES = [
  { id: 'house_cleaning', name: '🧹 Haus putzen / Staubsaugen', met: 3.3 },
  { id: 'dishwashing', name: '🍽️ Tellerwaschen / Küche aufräumen', met: 2.3 },
  { id: 'cooking', name: '🍳 Kochen & Vorbereitung', met: 2.5 },
  { id: 'gardening', name: '🌱 Gartenarbeit / Rasenmähen', met: 3.8 },
  { id: 'stairs', name: '🪜 Treppensteigen', met: 5.0 },
  { id: 'standing_work', name: '🧍 Stehende Arbeit / Verkauf / Pflege', met: 2.2 },
  { id: 'moving_furniture', name: '📦 Schwere Lasten tragen / Umzug', met: 6.0 }
];

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [step, setStep] = useState('auth'); // 'auth' | 'pin' | 'health_profile'
  const [email, setEmail] = useState(() => {
    try { return localStorage.getItem('aura_saved_email') || ''; } catch(e) { return ''; }
  });
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Body Data
  const [weightKg, setWeightKg] = useState('80');
  const [heightCm, setHeightCm] = useState('180');
  const [age, setAge] = useState('25');
  const [gender, setGender] = useState('male'); // 'male' | 'female'
  const [dailySteps, setDailySteps] = useState('10000');
  const [goal, setGoal] = useState('recomposition'); // 'fat_loss' | 'muscle_gain' | 'recomposition'
  const [conditions, setConditions] = useState('');

  // Manuelle Makro & Kalorien-Ziele (Optional überschreibbar)
  const [customCalories, setCustomCalories] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [customFat, setCustomFat] = useState('');
  const [customCarbs, setCustomCarbs] = useState('');

  // Selected Sports & Chores with Hours
  const [selectedSports, setSelectedSports] = useState([
    { sportId: 'weightlifting', hoursPerWeek: 4 }
  ]);
  const [selectedChores, setSelectedChores] = useState([
    { choreId: 'house_cleaning', hoursPerWeek: 3 },
    { choreId: 'dishwashing', hoursPerWeek: 2 }
  ]);

  // Optional Notion Token for Custom Second-Brain
  const [userNotionToken, setUserNotionToken] = useState(() => {
    try { return localStorage.getItem('aura_custom_notion_token') || ''; } catch(e) { return ''; }
  });
  const [userNotionDbId, setUserNotionDbId] = useState(() => {
    try { return localStorage.getItem('aura_custom_notion_db') || ''; } catch(e) { return ''; }
  });

  // Antwort-Tiefe / Erklärungstiefe (wenig, mid, viel, extrem, ultra)
  const [explanationDepth, setExplanationDepth] = useState(() => {
    try { return localStorage.getItem('aura_explanation_depth') || 'viel'; } catch(e) { return 'viel'; }
  });

  // Load existing profile from localStorage on open if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem('aura_user_profile');
      if (saved) {
        const p = JSON.parse(saved);
        if (p.email) setEmail(p.email);
        if (p.weightKg) setWeightKg(p.weightKg.toString());
        if (p.heightCm) setHeightCm(p.heightCm.toString());
        if (p.age) setAge(p.age.toString());
        if (p.gender) setGender(p.gender);
        if (p.dailySteps) setDailySteps(p.dailySteps.toString());
        if (p.goal) setGoal(p.goal);
        if (p.conditions) setConditions(p.conditions);
        if (p.explanationDepth) setExplanationDepth(p.explanationDepth);
        if (p.customMacros?.calories) setCustomCalories(p.customMacros.calories.toString());
        if (p.customMacros?.protein) setCustomProtein(p.customMacros.protein.toString());
        if (p.customMacros?.fat) setCustomFat(p.customMacros.fat.toString());
        if (p.customMacros?.carbs) setCustomCarbs(p.customMacros.carbs.toString());
        if (p.selectedSports) setSelectedSports(p.selectedSports);
        if (p.selectedChores) setSelectedChores(p.selectedChores);
      }
    } catch(e) {}
  }, [isOpen]);

  if (!isOpen) return null;

  // 1. Direct Cloud Login with Email + Password
  const handleLogin = async () => {
    if (!email || !email.includes('@')) {
      setError('Bitte eine gültige E-Mail-Adresse eingeben.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Bitte dein Passwort (mind. 6 Zeichen) eingeben.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login fehlgeschlagen');

      const profile = data.user?.profile || {};
      profile.email = email.trim();

      // Save to localStorage so user stays logged in across sessions
      localStorage.setItem('aura_saved_email', email.trim());
      localStorage.setItem('aura_user_profile', JSON.stringify(profile));
      if (profile.explanationDepth) localStorage.setItem('aura_explanation_depth', profile.explanationDepth);
      if (profile.notionToken) localStorage.setItem('aura_custom_notion_token', profile.notionToken);
      if (profile.notionDbId) localStorage.setItem('aura_custom_notion_db', profile.notionDbId);

      if (onAuthSuccess) onAuthSuccess(profile);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Start Registration / Verification (Send 6-digit Code to Email)
  const handleStartRegister = async () => {
    if (!email || !email.includes('@')) {
      setError('Bitte eine gültige E-Mail-Adresse eingeben.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Bitte erstelle ein Passwort mit mindestens 6 Zeichen.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`${API_BASE}/api/auth/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler beim Senden des Codes');

      setMessage('6-stelliger PIN wurde an deine E-Mail gesendet!');
      setStep('pin');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Verify Code
  const handleVerifyPin = async () => {
    if (!pin || pin.length < 6) {
      setError('Bitte den vollständigen 6-stelligen Code eingeben.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: pin.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ungültiger oder abgelaufener Code');

      setStep('health_profile');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Add / remove sports & chores
  const addSport = (sportId) => {
    if (!selectedSports.some(s => s.sportId === sportId)) {
      setSelectedSports([...selectedSports, { sportId, hoursPerWeek: 2 }]);
    }
  };

  const updateSportHours = (sportId, hours) => {
    setSelectedSports(selectedSports.map(s => s.sportId === sportId ? { ...s, hoursPerWeek: Number(hours) || 0 } : s));
  };

  const removeSport = (sportId) => {
    setSelectedSports(selectedSports.filter(s => s.sportId !== sportId));
  };

  const addChore = (choreId) => {
    if (!selectedChores.some(c => c.choreId === choreId)) {
      setSelectedChores([...selectedChores, { choreId, hoursPerWeek: 2 }]);
    }
  };

  const updateChoreHours = (choreId, hours) => {
    setSelectedChores(selectedChores.map(c => c.choreId === choreId ? { ...c, hoursPerWeek: Number(hours) || 0 } : c));
  };

  const removeChore = (choreId) => {
    setSelectedChores(selectedChores.filter(c => c.choreId !== choreId));
  };

  // BMR & PAL Calculation
  const w = Number(weightKg) || 80;
  const h = Number(heightCm) || 180;
  const a = Number(age) || 25;

  const bmr = gender === 'male'
    ? Math.round(10 * w + 6.25 * h - 5 * a + 5)
    : Math.round(10 * w + 6.25 * h - 5 * a - 161);

  const stepsKcal = Math.round((Number(dailySteps) || 10000) * 0.04);

  const totalWeeklySportsKcal = selectedSports.reduce((acc, s) => {
    const sp = ALL_SPORTS.find(item => item.id === s.sportId);
    const met = sp ? sp.met : 6.0;
    return acc + (met * w * s.hoursPerWeek);
  }, 0);
  const dailySportsKcal = totalWeeklySportsKcal / 7;

  const totalWeeklyChoresKcal = selectedChores.reduce((acc, c) => {
    const ch = DAILY_CHORES.find(item => item.id === c.choreId);
    const met = ch ? ch.met : 2.5;
    return acc + (met * w * c.hoursPerWeek);
  }, 0);
  const dailyChoresKcal = totalWeeklyChoresKcal / 7;

  const tdee = Math.round(bmr + stepsKcal + dailySportsKcal + dailyChoresKcal);
  const targetCalories = goal === 'fat_loss' ? Math.round(tdee - 450) : goal === 'muscle_gain' ? Math.round(tdee + 350) : tdee;
  const pal = (tdee / bmr).toFixed(2);

  // 4. Save Profile Globally to Notion Cloud Database & LocalStorage
  const handleSaveProfile = async () => {
    setIsLoading(true);
    setError(null);

    const finalCalories = Number(customCalories) || targetCalories;
    const profile = {
      email: email.trim(),
      weightKg: w,
      heightCm: h,
      age: a,
      gender,
      dailySteps: Number(dailySteps) || 10000,
      selectedSports,
      selectedChores,
      bmr,
      tdee,
      pal,
      targetCalories: finalCalories,
      customMacros: {
        calories: finalCalories,
        protein: Number(customProtein) || Math.round(w * 2.2),
        fat: Number(customFat) || Math.round(w * 0.9),
        carbs: Number(customCarbs) || Math.round((finalCalories - (w * 2.2 * 4) - (w * 0.9 * 9)) / 4)
      },
      goal,
      conditions: conditions.trim(),
      explanationDepth,
      notionToken: userNotionToken.trim(),
      notionDbId: userNotionDbId.trim()
    };

    try {
      // Save to global Cloud Database (Notion)
      if (password) {
        await fetch(`${API_BASE}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            password: password.trim(),
            profile
          })
        });
      }

      localStorage.setItem('aura_saved_email', email.trim());
      localStorage.setItem('aura_explanation_depth', explanationDepth);
      if (userNotionToken.trim()) localStorage.setItem('aura_custom_notion_token', userNotionToken.trim());
      if (userNotionDbId.trim()) localStorage.setItem('aura_custom_notion_db', userNotionDbId.trim());
      localStorage.setItem('aura_user_profile', JSON.stringify(profile));

      if (onAuthSuccess) onAuthSuccess(profile);
      onClose();
    } catch(err) {
      console.error(err);
      // Still allow local completion
      localStorage.setItem('aura_user_profile', JSON.stringify(profile));
      if (onAuthSuccess) onAuthSuccess(profile);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl p-6 overflow-hidden max-h-[92vh] overflow-y-auto space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-1.5">
                Aura Global Account & Profil <Sparkles size={14} className="text-indigo-400" />
              </h2>
              <p className="text-[11px] text-zinc-400">Überall weltweit einloggen (Cloud-Sync & Diagnostik)</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        {message && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
            {message}
          </div>
        )}

        {/* STEP 1: LOGIN oder REGISTRIEREN Toggle */}
        {step === 'auth' && (
          <div className="space-y-4">
            {/* Mode Switcher */}
            <div className="flex bg-zinc-900/80 p-1 rounded-2xl border border-zinc-800">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setError(null); setMessage(null); }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  authMode === 'login'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <LogIn size={14} /> Anmelden (Passwort)
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('register'); setError(null); setMessage(null); }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  authMode === 'register'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <UserPlus size={14} /> Neu registrieren
              </button>
            </div>

            <p className="text-xs text-zinc-300">
              {authMode === 'login'
                ? 'Gib deine E-Mail und dein Passwort ein, um dein Profil auf jedem Gerät weltweit sofort abzurufen:'
                : 'Erstelle deinen Account mit E-Mail und sicherem Passwort. Deine Diagnosen und Makros werden sicher in deiner Cloud gespeichert:'}
            </p>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-zinc-400 font-medium">E-Mail-Adresse</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 text-zinc-500" size={16} />
                <input
                  type="email"
                  placeholder="deine.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-zinc-400 font-medium">Passwort</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 text-zinc-500" size={16} />
                <input
                  type="password"
                  placeholder="Mindestens 6 Zeichen"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') authMode === 'login' ? handleLogin() : handleStartRegister(); }}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {authMode === 'login' ? (
              <button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <>In Account einloggen <LogIn size={14} /></>}
              </button>
            ) : (
              <button
                onClick={handleStartRegister}
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <>Account erstellen & Code anfordern <ArrowRight size={14} /></>}
              </button>
            )}
          </div>
        )}

        {/* STEP 2: PIN Verification (Only on new Registration) */}
        {step === 'pin' && (
          <div className="space-y-4">
            <p className="text-xs text-zinc-300">
              Gib den 6-stelligen Sicherheitscode ein, den wir an <span className="text-indigo-400 font-bold">{email}</span> gesendet haben:
            </p>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3.5 text-zinc-500" size={16} />
              <input
                type="text"
                maxLength={6}
                placeholder="6-stelliger Code"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleVerifyPin(); }}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-lg font-mono tracking-widest text-white placeholder-zinc-600 text-center focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep('auth')}
                className="py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs"
              >
                Zurück
              </button>
              <button
                onClick={handleVerifyPin}
                disabled={isLoading}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <>E-Mail bestätigen <CheckCircle2 size={14} /></>}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Detailed Health, PAL & Metabolism Profile Configuration */}
        {step === 'health_profile' && (
          <div className="space-y-4">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-between text-xs text-indigo-300">
              <span>Account verifiziert: <b className="text-white">{email}</b></span>
              <span className="text-[10px] bg-indigo-500/20 px-2 py-0.5 rounded text-indigo-300">Cloud Sync aktiv</span>
            </div>

            {/* 1. Basis Körperdaten */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Gewicht (kg)</label>
                <input
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Größe (cm)</label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Alter</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Biologisches Geschlecht</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-semibold"
                >
                  <option value="male">Männlich</option>
                  <option value="female">Weiblich</option>
                </select>
              </div>
            </div>

            {/* 2. Tägliche Schritte & Ziel */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Tägliche Schritte</label>
                <input
                  type="number"
                  step="500"
                  value={dailySteps}
                  onChange={(e) => setDailySteps(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Stoffwechsel-Ziel</label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-semibold"
                >
                  <option value="fat_loss">Fettverbrennung (-450 kcal)</option>
                  <option value="recomposition">Body Recomposition / Erhalt</option>
                  <option value="muscle_gain">Muskelaufbau (+350 kcal)</option>
                </select>
              </div>
            </div>

            {/* 3. Sportarten & MET */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Dumbbell size={14} className="text-amber-400" /> Sport & Training (Stunden pro Woche):
                </span>
                <select
                  onChange={(e) => { if (e.target.value) { addSport(e.target.value); e.target.value = ''; } }}
                  className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-[11px] rounded-lg px-2 py-1"
                >
                  <option value="">+ Sport hinzufügen</option>
                  {ALL_SPORTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5 pt-1">
                {selectedSports.map(s => {
                  const sp = ALL_SPORTS.find(item => item.id === s.sportId);
                  return (
                    <div key={s.sportId} className="flex items-center justify-between bg-zinc-950/60 p-2 rounded-xl border border-zinc-800/80">
                      <span className="text-zinc-300 font-medium">{sp ? sp.name : s.sportId}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="30"
                          step="0.5"
                          value={s.hoursPerWeek}
                          onChange={(e) => updateSportHours(s.sportId, e.target.value)}
                          className="w-14 bg-zinc-900 border border-zinc-700 rounded-lg px-1.5 py-0.5 text-center text-amber-400 font-bold"
                        />
                        <span className="text-[10px] text-zinc-500">h/Wo</span>
                        <button onClick={() => removeSport(s.sportId)} className="text-zinc-500 hover:text-rose-400">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Alltagsaktivitäten & Haushalt */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Home size={14} className="text-teal-400" /> Alltagsbewegung & Haushalt (Stunden pro Woche):
                </span>
                <select
                  onChange={(e) => { if (e.target.value) { addChore(e.target.value); e.target.value = ''; } }}
                  className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-[11px] rounded-lg px-2 py-1"
                >
                  <option value="">+ Aktivität hinzufügen</option>
                  {DAILY_CHORES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5 pt-1">
                {selectedChores.map(c => {
                  const ch = DAILY_CHORES.find(item => item.id === c.choreId);
                  return (
                    <div key={c.choreId} className="flex items-center justify-between bg-zinc-950/60 p-2 rounded-xl border border-zinc-800/80">
                      <span className="text-zinc-300 font-medium">{ch ? ch.name : c.choreId}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="40"
                          step="0.5"
                          value={c.hoursPerWeek}
                          onChange={(e) => updateChoreHours(c.choreId, e.target.value)}
                          className="w-14 bg-zinc-900 border border-zinc-700 rounded-lg px-1.5 py-0.5 text-center text-teal-400 font-bold"
                        />
                        <span className="text-[10px] text-zinc-500">h/Wo</span>
                        <button onClick={() => removeChore(c.choreId)} className="text-zinc-500 hover:text-rose-400">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. Vorerkrankungen & Diagnosen */}
            <div className="space-y-1 text-xs">
              <label className="text-[11px] text-zinc-300 font-bold flex items-center gap-1.5">
                <HeartPulse size={12} className="text-rose-400" /> Vorerkrankungen / Diagnosen (z.B. Diabetes, Insulinresistenz, Hashimoto):
              </label>
              <textarea
                rows={2}
                placeholder="Z.B. Typ-2 Diabetes, Insulinresistenz, Fettleber, HOMA-Index erhöht"
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* 6. Kalorien- & Makroziele anpassen */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-2 text-xs">
              <span className="font-bold text-amber-400 flex items-center gap-1.5">
                <Activity size={14} /> Individuelle Kalorien- & Makro-Ziele (Optional):
              </span>
              <p className="text-[11px] text-zinc-400">
                Automatisch berechnet: <span className="text-white font-bold">{targetCalories} kcal</span>. Trage hier eigene Werte ein, wenn du sie manuell festlegen willst:
              </p>
              <div className="grid grid-cols-4 gap-2 pt-1">
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-0.5">Kcal Ziel</label>
                  <input
                    type="number"
                    placeholder={targetCalories.toString()}
                    value={customCalories}
                    onChange={(e) => setCustomCalories(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-center font-bold text-amber-300 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-0.5">Protein (g)</label>
                  <input
                    type="number"
                    placeholder="180"
                    value={customProtein}
                    onChange={(e) => setCustomProtein(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-center font-bold text-emerald-400 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-0.5">Fett (g)</label>
                  <input
                    type="number"
                    placeholder="80"
                    value={customFat}
                    onChange={(e) => setCustomFat(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-center font-bold text-amber-400 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-0.5">Carbs (g)</label>
                  <input
                    type="number"
                    placeholder="200"
                    value={customCarbs}
                    onChange={(e) => setCustomCarbs(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-center font-bold text-blue-400 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* 7. Erklärungstiefe & Detailgrad der Antworten */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-2 text-xs">
              <span className="font-bold text-purple-400 flex items-center gap-1.5">
                <Sparkles size={14} /> KI-Erklärungstiefe & Detailgrad:
              </span>
              <p className="text-[11px] text-zinc-400">
                Wähle, wie tief und wissenschaftlich Aura dir biologische, medizinische oder ernährungstechnische Fragen beantworten soll:
              </p>
              <div className="grid grid-cols-5 gap-1.5 pt-1">
                {[
                  { id: 'wenig', label: 'Wenig', desc: '1-2 Sätze, ultra-kurz' },
                  { id: 'mid', label: 'Mid', desc: 'Kompakte Fakten' },
                  { id: 'viel', label: 'Viel', desc: 'Ausführlich & klar' },
                  { id: 'extrem', label: 'Extrem', desc: 'Tief auf Zellebene' },
                  { id: 'ultra', label: 'Ultra', desc: 'Molekularbiologisch + Studien' }
                ].map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setExplanationDepth(tier.id)}
                    className={`py-2 px-1 rounded-xl text-center border transition-all ${
                      explanationDepth === tier.id
                        ? 'bg-purple-600/30 border-purple-500 text-purple-300 font-bold shadow-md shadow-purple-500/20'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <span className="block text-xs font-semibold capitalize">{tier.label}</span>
                    <span className="text-[9px] text-zinc-400 block mt-0.5 leading-tight">{tier.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 8. Optionales Notion Second-Brain (Eigener Token oder Integrierter Speicher) */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-400 flex items-center gap-1.5">
                  <BookOpen size={14} /> Optional: Eigenes Notion Second-Brain verbinden
                </span>
                <a
                  href="https://www.notion.so/profile/integrations"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-zinc-400 hover:text-indigo-300 underline flex items-center gap-1"
                >
                  Token erstellen <ExternalLink size={10} />
                </a>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Standardmäßig nutzt Aura den integrierten Speicher. Wenn du deine Pläne & Einkaufslisten in dein eigenes Notion schreiben willst, trage hier deinen Token ein:
              </p>
              <div className="space-y-1.5 pt-1">
                <input
                  type="password"
                  placeholder="Notion Internal Integration Secret (secret_...)"
                  value={userNotionToken}
                  onChange={(e) => setUserNotionToken(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
                <input
                  type="text"
                  placeholder="Notion Page-ID oder Database-ID (optional)"
                  value={userNotionDbId}
                  onChange={(e) => setUserNotionDbId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <><Activity size={16} /> Profil in Cloud speichern & aktivieren</>}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
