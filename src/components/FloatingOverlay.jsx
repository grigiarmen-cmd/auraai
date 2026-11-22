import React from 'react';
import { Eye, ShieldCheck, Sparkles, X } from 'lucide-react';

export default function FloatingOverlay({ isVisible, isAiSpeaking, statusText, onClose }) {
  if (!isVisible) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex items-center gap-3 px-4 py-2 bg-[#111214]/90 backdrop-blur-md border border-discord-blurple/50 shadow-[0_0_20px_rgba(88,101,242,0.35)] rounded-full text-white text-xs font-semibold select-none">
        
        {/* Pulsierender Blauer Kreis / Indikator */}
        <div className="relative flex items-center justify-center">
          <span className="w-3.5 h-3.5 rounded-full bg-blue-500 animate-ping absolute opacity-75" />
          <span className={`w-3.5 h-3.5 rounded-full ${
            isAiSpeaking ? 'bg-discord-green' : 'bg-blue-500'
          } shadow-sm shadow-blue-500`} />
        </div>

        {/* Text-Label */}
        <div className="flex items-center gap-2 pr-1">
          <span className="text-gray-100 tracking-wide font-medium">
            {statusText || "Agent is watching your screen with you"}
          </span>
          {isAiSpeaking && (
            <span className="text-[10px] bg-discord-green/20 text-discord-green px-1.5 py-0.2 rounded border border-discord-green/40">
              Spricht
            </span>
          )}
        </div>

        {/* Schließen / Minimieren */}
        {onClose && (
          <button
            onClick={onClose}
            className="text-discord-textMuted hover:text-white p-0.5 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
