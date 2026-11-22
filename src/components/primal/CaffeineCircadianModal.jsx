import React, { useState, useEffect } from 'react';
import { 
  Coffee, Moon, Sun, Clock, Zap, AlertTriangle, ShieldCheck, 
  Trash2, Plus, Sparkles, X, ChevronRight, Activity 
} from 'lucide-react';

export default function CaffeineCircadianModal({ isOpen, onClose }) {
  const todayKey = new Date().toISOString().split('T')[0];

  // List of drinks logged today: [{ id, name, mg, timestamp, timeString }]
  const [logs, setLogs] = useState(() => {
    try {
      const saved = localStorage.getItem(`aura_caffeine_${todayKey}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { id: '1', name: 'Doppelter Espresso', mg: 140, timestamp: Date.now() - 3.5 * 3600 * 1000, timeString: '09:30' }
    ];
  });

  const [customMg, setCustomMg] = useState(80);
  const [drinkName, setDrinkName] = useState('Kaffee');

  // Half-life in hours (typically 5 to 6.5 hours depending on CYP1A2 gene)
  const halfLifeHours = 5.5;

  useEffect(() => {
    try {
      localStorage.setItem(`aura_caffeine_${todayKey}`, JSON.stringify(logs));
    } catch (e) {}
  }, [logs, todayKey]);

  if (!isOpen) return null;

  // Calculate current active caffeine in system (exponential decay: N(t) = N0 * (0.5)^(t / t_half))
  const now = Date.now();
  let currentActiveCaffeine = 0;

  logs.forEach(item => {
    const hoursElapsed = Math.max(0, (now - item.timestamp) / (3600 * 1000));
    const remaining = item.mg * Math.pow(0.5, hoursElapsed / halfLifeHours);
    currentActiveCaffeine += remaining;
  });
  currentActiveCaffeine = Math.round(currentActiveCaffeine * 10) / 10;

  // Calculate bedtime sleep window: when active caffeine drops below 20-25mg
  let hoursUntilClearance = 0;
  if (currentActiveCaffeine > 25) {
    hoursUntilClearance = (Math.log(25 / currentActiveCaffeine) / Math.log(0.5)) * halfLifeHours;
  }
  const optimalSleepTime = new Date(now + hoursUntilClearance * 3600 * 1000);
  const sleepTimeStr = optimalSleepTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Quick preset logger
  const addDrink = (name, mg) => {
    const newEntry = {
      id: 'caff_' + Date.now(),
      name,
      mg,
      timestamp: Date.now(),
      timeString: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setLogs([newEntry, ...logs]);
  };

  const removeEntry = (id) => {
    setLogs(logs.filter(l => l.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#090b10] border border-zinc-800 rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 max-h-[94vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Zap size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                Circadian & Koffein-Tracker <Sparkles size={14} className="text-amber-400" />
              </h2>
              <p className="text-[11px] text-zinc-400">Halbwertszeit-Kurve & Adenosin-Schlaffenster</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800">
            <X size={18} />
          </button>
        </div>

        {/* Current Caffeine & Sleep Window Speedometer Card */}
        <div className="p-4 rounded-2xl bg-[#11141e] border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">Aktuell im Blut</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className={`text-3xl font-black ${currentActiveCaffeine > 80 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {currentActiveCaffeine}
                </span>
                <span className="text-xs text-zinc-400">mg Koffein</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold flex items-center justify-end gap-1">
                <Moon size={11} className="text-indigo-400" /> Optimaler Tiefschlaf
              </span>
              <div className="text-lg font-black text-indigo-300 mt-0.5">
                {currentActiveCaffeine > 25 ? `ab ca. ${sleepTimeStr} Uhr` : 'Jederzeit möglich'}
              </div>
              <span className="text-[10px] text-zinc-500 block">Adenosin-Clearance: {currentActiveCaffeine > 25 ? 'läuft' : '95% (Bereit)'}</span>
            </div>
          </div>

          {/* Exponential Decay Bar */}
          <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                currentActiveCaffeine > 150 ? 'bg-rose-500' : (currentActiveCaffeine > 50 ? 'bg-amber-400' : 'bg-emerald-400')
              }`}
              style={{ width: `${Math.min(100, (currentActiveCaffeine / 250) * 100)}%` }}
            />
          </div>

          <div className="p-2.5 rounded-xl bg-black/40 border border-zinc-800/80 text-[11px] text-zinc-300 leading-relaxed flex items-start gap-2">
            <Clock size={14} className="text-amber-400 shrink-0 mt-0.5" />
            <span>
              Koffein blockiert die Adenosin-Rezeptoren im Gehirn mit einer Halbwertszeit von ca. <strong>5.5 Stunden</strong>. Für ungestörten Slow-Wave-Tiefschlaf sollte der Blutspiegel unter 25 mg sinken.
            </span>
          </div>
        </div>

        {/* Quick Add Presets */}
        <div>
          <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
            Schnell erfassen (1-Klick)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { name: 'Espresso', mg: 70, icon: '☕' },
              { name: 'Doppelter Espresso', mg: 140, icon: '⚡' },
              { name: 'Großer Kaffee', mg: 120, icon: '☕' },
              { name: 'Matcha / Grüntee', mg: 50, icon: '🍵' },
              { name: 'Mate Tee', mg: 80, icon: '🌿' },
              { name: 'Energy Drink', mg: 160, icon: '🔋' },
              { name: 'Schwarzer Tee', mg: 45, icon: '🫖' },
              { name: 'Koffeinfrei (Decaf)', mg: 3, icon: '💧' }
            ].map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => addDrink(preset.name, preset.mg)}
                className="p-2.5 rounded-xl bg-[#12151e] border border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-800/60 text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-base">{preset.icon}</span>
                  <span className="text-[10px] font-mono text-amber-400 font-bold">+{preset.mg}mg</span>
                </div>
                <span className="text-xs font-semibold text-zinc-200 block mt-1 group-hover:text-amber-300 truncate">
                  {preset.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Today's Logged Drinks */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold px-1">
            <span>Heute getrunken ({logs.length})</span>
            <span className="text-[10px] text-zinc-500">Halbwertszeit: 5.5h</span>
          </div>

          <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
            {logs.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-500">
                Heute noch kein Koffein erfasst. Perfekt für einen tiefen, regenerativen Schlaf!
              </div>
            ) : (
              logs.map((item) => {
                const hoursAgo = Math.max(0, (now - item.timestamp) / (3600 * 1000));
                const currentRemaining = Math.round(item.mg * Math.pow(0.5, hoursAgo / halfLifeHours));

                return (
                  <div key={item.id} className="p-2.5 rounded-xl bg-[#11131a] border border-zinc-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{item.name}</span>
                        <span className="text-[10px] text-zinc-500">{item.timeString}</span>
                      </div>
                      <span className="text-[10px] text-zinc-400">
                        Initial: {item.mg} mg • <span className="text-amber-400 font-semibold">Noch aktiv: {currentRemaining} mg</span>
                      </span>
                    </div>
                    <button onClick={() => removeEntry(item.id)} className="text-zinc-500 hover:text-rose-400 p-1">
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
