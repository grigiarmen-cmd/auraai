import React, { useState } from 'react';
import { Mail, KeyRound, CheckCircle2, Shield, HeartPulse, Activity, Sparkles, X, ArrowRight, Loader2, Dumbbell, Home, Plus, Trash2 } from 'lucide-react';

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
  const [step, setStep] = useState('email'); // 'email' | 'pin' | 'health_profile'
  const [email, setEmail] = useState('');
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

  // Selected Sports & Chores with Hours
  const [selectedSports, setSelectedSports] = useState([
    { sportId: 'weightlifting', hoursPerWeek: 4 }
  ]);
  const [selectedChores, setSelectedChores] = useState([
    { choreId: 'house_cleaning', hoursPerWeek: 3 },
    { choreId: 'dishwashing', hoursPerWeek: 2 }
  ]);

  if (!isOpen) return null;

  const handleSendCode = async () => {
    if (!email || !email.includes('@')) {
      setError('Bitte eine gültige E-Mail-Adresse eingeben.');
      return;
    }
    setIsLoading(true);
    setError(null);
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

  // Add a new sport
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

  // Add a new chore
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

  // PAL expenditure
  const stepsKcal = (Number(dailySteps) || 10000) * 0.04;
  const totalWeeklySportsKcal = selectedSports.reduce((acc, s) => {
    const sp = ALL_SPORTS.find(item => item.id === s.sportId);
    const met = sp ? sp.met : 5.0;
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

  const handleSaveProfile = () => {
    const profile = {
      email,
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
      targetCalories,
      goal,
      conditions: conditions.trim()
    };
    localStorage.setItem('aura_user_profile', JSON.stringify(profile));
    if (onAuthSuccess) onAuthSuccess(profile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-zinc-950/95 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] p-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-blue-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-1.5">
                Aura Clinical & PAL Metabolism Engine <Sparkles size={14} className="text-indigo-400" />
              </h2>
              <p className="text-[11px] text-zinc-400">Millimetergenauer MET-Tracker & Diagnostik</p>
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

        {/* STEP 1: Email */}
        {step === 'email' && (
          <div className="space-y-4">
            <p className="text-xs text-zinc-300">
              Melde dich mit deiner E-Mail an, um deine Laborbefunde, Stoffwechselziele und Vorerkrankungen sicher zu synchronisieren:
            </p>
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
            <button
              onClick={handleSendCode}
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <>6-stelligen Code anfordern <ArrowRight size={14} /></>}
            </button>
          </div>
        )}

        {/* STEP 2: PIN */}
        {step === 'pin' && (
          <div className="space-y-4">
            <p className="text-xs text-zinc-300">
              Gib den 6-stelligen PIN ein, den wir an <span className="text-indigo-400 font-bold">{email}</span> gesendet haben:
            </p>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3.5 text-zinc-500" size={16} />
              <input
                type="text"
                maxLength={6}
                placeholder="123456"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-lg font-mono tracking-widest text-white placeholder-zinc-600 text-center focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep('email')}
                className="py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs"
              >
                Zurück
              </button>
              <button
                onClick={handleVerifyPin}
                disabled={isLoading}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <>Code bestätigen <CheckCircle2 size={14} /></>}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Körperdaten, Sportarten, Chores & Krankheiten */}
        {step === 'health_profile' && (
          <div className="space-y-4 overflow-y-auto pr-1">
            
            {/* Live Computed Metabolic Target Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">Errechneter Stoffwechsel</span>
                <div className="text-lg font-black text-white flex items-center gap-2">
                  <span>{targetCalories} kcal / Tag</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">PAL: {pal}</span>
                </div>
              </div>
              <div className="text-right text-[11px] text-zinc-400">
                <div>BMR: {bmr} kcal</div>
                <div>Aktivität: +{Math.round(stepsKcal + dailySportsKcal + dailyChoresKcal)} kcal</div>
              </div>
            </div>

            {/* 1. Body Measurements */}
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div>
                <label className="text-zinc-400 text-[10px] block mb-1">Gewicht (kg)</label>
                <input
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-zinc-400 text-[10px] block mb-1">Größe (cm)</label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-zinc-400 text-[10px] block mb-1">Alter</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-zinc-400 text-[10px] block mb-1">Ziel</label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-2 text-white text-[11px]"
                >
                  <option value="recomposition">Recomp</option>
                  <option value="fat_loss">Fettabbau</option>
                  <option value="muscle_gain">Muskelaufbau</option>
                </select>
              </div>
            </div>

            {/* 2. Steps */}
            <div>
              <label className="text-zinc-400 text-[10px] block mb-1">Tägliche Schritte (NEAT)</label>
              <input
                type="number"
                value={dailySteps}
                onChange={(e) => setDailySteps(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs"
              />
            </div>

            {/* 3. Sportarten Auswählen & Std pro Woche */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-400 font-bold flex items-center gap-1.5">
                  <Dumbbell size={14} /> Sportarten auswählen:
                </span>
                <select 
                  onChange={(e) => {
                    if (e.target.value) {
                      addSport(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-[11px] rounded-lg px-2 py-1"
                >
                  <option value="">+ Sportart hinzufügen...</option>
                  {ALL_SPORTS.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (MET {s.met})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 max-h-28 overflow-y-auto">
                {selectedSports.map(s => {
                  const sp = ALL_SPORTS.find(item => item.id === s.sportId);
                  return (
                    <div key={s.sportId} className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs">
                      <span className="text-white font-medium truncate max-w-[200px]">{sp?.name || s.sportId}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0.5"
                          step="0.5"
                          value={s.hoursPerWeek}
                          onChange={(e) => updateSportHours(s.sportId, e.target.value)}
                          className="w-14 bg-zinc-950 border border-zinc-700 rounded px-2 py-0.5 text-center text-amber-300 font-bold"
                        />
                        <span className="text-zinc-400 text-[10px]">Std/Woche</span>
                        <button onClick={() => removeSport(s.sportId)} className="text-zinc-500 hover:text-rose-400">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Hausarbeit & Alltags-METs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-teal-400 font-bold flex items-center gap-1.5">
                  <Home size={14} /> Hausarbeit & Alltag (Putzen, Spülen etc.):
                </span>
                <select 
                  onChange={(e) => {
                    if (e.target.value) {
                      addChore(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-[11px] rounded-lg px-2 py-1"
                >
                  <option value="">+ Hausarbeit hinzufügen...</option>
                  {DAILY_CHORES.map(c => (
                    <option key={c.id} value={c.id}>{c.name} (MET {c.met})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 max-h-28 overflow-y-auto">
                {selectedChores.map(c => {
                  const ch = DAILY_CHORES.find(item => item.id === c.choreId);
                  return (
                    <div key={c.choreId} className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs">
                      <span className="text-white font-medium truncate max-w-[200px]">{ch?.name || c.choreId}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0.5"
                          step="0.5"
                          value={c.hoursPerWeek}
                          onChange={(e) => updateChoreHours(c.choreId, e.target.value)}
                          className="w-14 bg-zinc-950 border border-zinc-700 rounded px-2 py-0.5 text-center text-teal-300 font-bold"
                        />
                        <span className="text-zinc-400 text-[10px]">Std/Woche</span>
                        <button onClick={() => removeChore(c.choreId)} className="text-zinc-500 hover:text-rose-400">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. Krankheiten & Diagnosen */}
            <div className="text-xs">
              <label className="text-zinc-400 text-[10px] block mb-1 flex items-center gap-1">
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

            <button
              onClick={handleSaveProfile}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
            >
              <Activity size={16} /> Profil, PAL & Stoffwechsel aktivieren
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
