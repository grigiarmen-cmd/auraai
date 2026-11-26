import React, { useState, useRef, useEffect } from 'react';
import { getApiBaseUrl } from '../../services/apiConfig';
const API_BASE = getApiBaseUrl();
import { 
  Camera, Upload, Sparkles, AlertTriangle, ShieldCheck, Flame, X, 
  ChevronRight, Check, RefreshCw, Zap, Image as ImageIcon 
} from 'lucide-react';

export default function MealVisionModal({ isOpen, onClose, onSaveToNotion, onAddToTracker }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [userNote, setUserNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [savedToNotion, setSavedToNotion] = useState(false);
  const [scanMode, setScanMode] = useState('meal'); // 'meal' | 'restaurant_menu'
  
  // Live camera stream state
  const [isLiveCameraActive, setIsLiveCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const fileInputGalleryRef = useRef(null);
  const fileInputCaptureRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setSelectedImage(null);
      setAnalysisResult(null);
      setError(null);
      setUserNote('');
      setIsLiveCameraActive(false);
      return;
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        stopCamera();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsLiveCameraActive(false);
  };

  const startLiveCamera = async () => {
    setError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Kamera-API wird von diesem Browser/Webview nicht unterstützt.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      streamRef.current = stream;
      setIsLiveCameraActive(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.warn("Video play error:", e));
        }
      }, 100);
    } catch (err) {
      console.warn("Live camera start failed, falling back to native file capture:", err);
      setError('Live-Kamera nicht verfügbar — bitte wähle ein Foto aus deiner Galerie oder erlaube den Kamerazugriff.');
      if (fileInputCaptureRef.current) {
        fileInputCaptureRef.current.click();
      }
    }
  };

  const capturePhotoFromLiveCamera = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      stopCamera();
      setSelectedImage(dataUrl);
      setAnalysisResult(null);
      setError(null);
      if (navigator.vibrate) navigator.vibrate(60);
    } catch (err) {
      console.error("Capture photo error:", err);
      setError('Foto konnte nicht aufgenommen werden.');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      stopCamera();
      setSelectedImage(reader.result);
      setAnalysisResult(null);
      setError(null);
      setSavedToNotion(false);
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const finalNote = scanMode === 'restaurant_menu'
        ? `[RESTAURANT SPEISEKARTEN SCAN: Bitte analysiere alle Gerichte auf dieser Speisekarte und markiere mit grünem Glow das am wenigsten denaturierte, saatölfreie und gesündeste Primal-Gericht!] ${userNote}`
        : userNote;

      const res = await fetch(`${API_BASE}/api/analyze-meal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          note: finalNote
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Analyse fehlgeschlagen');
      }

      const data = await res.json();
      setAnalysisResult(data);
    } catch (err) {
      console.error("Meal Vision Error:", err);
      setError('Mahlzeiten-Analyse fehlgeschlagen. Bitte versuche es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'AURA_GOD':
      case 'RAW_PRIMAL':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'CLEAN':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'NORMIE':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'SUB_3_TOXIC':
      default:
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#090b10] border border-orange-500/40 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(249,115,22,0.15)] flex flex-col max-h-[92vh]">
        
        {/* Hidden File Inputs */}
        {/* 1. Camera Capture (triggers camera app on phones) */}
        <input 
          type="file" 
          ref={fileInputCaptureRef} 
          onChange={handleImageUpload} 
          accept="image/*" 
          capture="environment"
          className="hidden" 
        />
        {/* 2. Gallery / File picker */}
        <input 
          type="file" 
          ref={fileInputGalleryRef} 
          onChange={handleImageUpload} 
          accept="image/*" 
          className="hidden" 
        />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/40 flex items-center justify-center">
              <Camera className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Aura Meal Vision</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-semibold border border-orange-500/30">
                  Foto-Biochemie
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">Erkennt Makros, Saatöle & toxische Zusatzstoffe per Foto</p>
            </div>
          </div>
          <button 
            onClick={() => { stopCamera(); onClose(); }}
            className="p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="px-4 pt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setScanMode('meal')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all ${
              scanMode === 'meal'
                ? 'bg-orange-500 text-black shadow-md font-bold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50 border border-zinc-800'
            }`}
          >
            🥩 Mahlzeit / Teller scannen
          </button>
          <button
            type="button"
            onClick={() => setScanMode('restaurant_menu')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all ${
              scanMode === 'restaurant_menu'
                ? 'bg-emerald-500 text-black shadow-md font-bold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50 border border-zinc-800'
            }`}
          >
            📜 Speisekarte im Restaurant
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertTriangle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Case 1: Live Camera Stream View */}
          {isLiveCameraActive && !selectedImage && (
            <div className="relative rounded-2xl overflow-hidden border border-orange-500/50 bg-black aspect-video flex items-center justify-center shadow-2xl">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                className="w-full h-full object-cover"
              />
              {/* Laser Target Reticle */}
              <div className="absolute inset-8 pointer-events-none border-2 border-orange-400/40 rounded-2xl" />
              
              {/* Capture Control Button */}
              <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-4 py-2 rounded-xl bg-black/60 backdrop-blur-md text-white text-xs font-semibold hover:bg-black/80 transition-all border border-white/10"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={capturePhotoFromLiveCamera}
                  className="w-16 h-16 rounded-full bg-white text-black font-black flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all border-4 border-orange-500"
                  title="Foto aufnehmen"
                >
                  <Camera size={26} className="text-orange-500" />
                </button>
              </div>
            </div>
          )}

          {/* Case 2: No Image Selected -> Dual Choice Trigger (Direct Camera OR Gallery Upload) */}
          {!selectedImage && !isLiveCameraActive && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: Direct Camera Capture */}
              <button
                type="button"
                onClick={startLiveCamera}
                className="border-2 border-dashed border-orange-500/40 hover:border-orange-500 bg-orange-500/5 hover:bg-orange-500/10 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-orange-500/15 group-hover:bg-orange-500 text-orange-400 group-hover:text-black flex items-center justify-center transition-all shadow-lg shadow-orange-500/10">
                  <Camera size={26} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-orange-300 transition-colors">
                    Kamera öffnen
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Live-Kamera starten oder Foto mit Smartphone aufnehmen
                  </p>
                </div>
              </button>

              {/* Option B: Gallery File Picker */}
              <button
                type="button"
                onClick={() => fileInputGalleryRef.current?.click()}
                className="border-2 border-dashed border-zinc-700/80 hover:border-zinc-500 bg-zinc-900/30 hover:bg-zinc-900/50 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-zinc-800 text-zinc-300 group-hover:text-white flex items-center justify-center transition-all">
                  <ImageIcon size={26} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Foto aus Galerie wählen</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Bestehendes Bild oder Screenshot hochladen
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* Case 3: Image Selected -> Preview & Analyze */}
          {selectedImage && (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-black max-h-72 flex items-center justify-center">
                <img src={selectedImage} alt="Mahlzeit" className="object-contain w-full max-h-72" />
                <button 
                  onClick={() => { setSelectedImage(null); setAnalysisResult(null); }}
                  className="absolute top-3 right-3 p-2 rounded-xl bg-black/70 text-white hover:bg-black transition-colors"
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
                    className="w-full bg-[#11131a] border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                  />
                  <button
                    onClick={handleAnalyze}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black font-bold text-sm transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                  >
                    <Sparkles size={18} /> Mahlzeit biochemisch bewerten
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Case 4: Loading State */}
          {isLoading && (
            <div className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-center space-y-3">
              <RefreshCw size={28} className="animate-spin text-orange-400 mx-auto" />
              <div>
                <p className="text-sm font-bold text-white">Biochemische Zell-Analyse läuft...</p>
                <p className="text-xs text-zinc-400 mt-1">
                  Gemini Vision analysiert Zutaten, Bioverfügbarkeit, Saatöle & Makros.
                </p>
              </div>
            </div>
          )}

          {/* Case 5: Analysis Result Card */}
          {analysisResult && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Header Score Card */}
              <div className="p-4 rounded-2xl bg-[#11141d] border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${getTierColor(analysisResult.tier)}`}>
                    {analysisResult.tier}
                  </span>
                  <h3 className="text-base font-bold text-white mt-1.5">{analysisResult.dishName}</h3>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-amber-400">{analysisResult.auraScore}</div>
                  <div className="text-[10px] text-zinc-400 uppercase tracking-widest">Aura Score</div>
                </div>
              </div>

              {/* Macros & Bioavailability Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-3 rounded-xl bg-[#11141d] border border-zinc-800 text-center">
                  <span className="text-[10px] text-zinc-400 uppercase">Kalorien</span>
                  <p className="text-sm font-bold text-white mt-0.5">{analysisResult.estimatedMacros?.calories || '—'}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#11141d] border border-zinc-800 text-center">
                  <span className="text-[10px] text-zinc-400 uppercase">Protein</span>
                  <p className="text-sm font-bold text-emerald-400 mt-0.5">{analysisResult.estimatedMacros?.protein || '—'}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#11141d] border border-zinc-800 text-center">
                  <span className="text-[10px] text-zinc-400 uppercase">Fett</span>
                  <p className="text-sm font-bold text-amber-400 mt-0.5">{analysisResult.estimatedMacros?.fat || '—'}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#11141d] border border-zinc-800 text-center">
                  <span className="text-[10px] text-zinc-400 uppercase">Kohlenhydrate</span>
                  <p className="text-sm font-bold text-sky-400 mt-0.5">{analysisResult.estimatedMacros?.carbs || '—'}</p>
                </div>
              </div>

              {/* Bioavailability & Cellular Impact */}
              <div className="p-3.5 rounded-2xl bg-[#11141d] border border-zinc-800 space-y-2 text-xs">
                <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck size={16} /> Bioverfügbarkeits-Bewertung: {analysisResult.bioavailabilityRating}
                </div>
                <p className="text-zinc-300 leading-relaxed">{analysisResult.cellularImpact}</p>
              </div>

              {/* Ancestral Perspective */}
              {analysisResult.ancestralWisdom && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs">
                  <span className="font-bold text-amber-400 block mb-1">Ancestrale Lehre (Aajonus / Weston Price):</span>
                  <p className="text-zinc-300 italic">"{analysisResult.ancestralWisdom}"</p>
                </div>
              )}

              {/* Optimization Tips */}
              {analysisResult.optimizationTips && analysisResult.optimizationTips.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-[#11141d] border border-zinc-800 text-xs space-y-2">
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
                  <Flame size={15} /> Direkt im Chat & Tagebuch speichern
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
