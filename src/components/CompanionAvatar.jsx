import React from 'react';
import { Bot, Sparkles, Smile, Laugh, Eye, AlertCircle } from 'lucide-react';

export default function CompanionAvatar({ isCallActive, isAiSpeaking, isUserSpeaking, emotion = 'happy', isSharingScreen }) {
  // Emotionale Zustände & Mimik
  const getEmotionDetails = () => {
    switch (emotion) {
      case 'laughing':
        return {
          icon: <Laugh className="w-16 h-16 text-yellow-400 animate-bounce" />,
          label: 'Lacht herzhaft',
          statusColor: 'bg-yellow-400',
          borderColor: 'border-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.5)]'
        };
      case 'surprised':
        return {
          icon: <AlertCircle className="w-16 h-16 text-cyan-400 animate-pulse" />,
          label: 'Staunt / Analysiert',
          statusColor: 'bg-cyan-400',
          borderColor: 'border-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.5)]'
        };
      case 'thinking':
        return {
          icon: <Sparkles className="w-16 h-16 text-purple-400 animate-spin" />,
          label: 'Denkt nach / Recherchiert',
          statusColor: 'bg-purple-400',
          borderColor: 'border-purple-400 shadow-[0_0_25px_rgba(192,132,252,0.5)]'
        };
      default:
        return {
          icon: <Bot className="w-16 h-16 text-discord-blurple" />,
          label: isSharingScreen ? 'Schaut auf deinen Screen' : 'Bereit für Call',
          statusColor: isAiSpeaking ? 'bg-discord-green' : 'bg-gray-400',
          borderColor: isAiSpeaking 
            ? 'speaking-glow border-discord-green' 
            : 'border-discord-blurple/40 hover:border-discord-blurple'
        };
    }
  };

  const details = getEmotionDetails();

  return (
    <div className="relative flex flex-col items-center justify-center p-8 bg-discord-darker rounded-2xl border border-white/5 shadow-2xl overflow-hidden group">
      {/* Hintergrund-Aura wenn aktiv */}
      {isCallActive && (
        <div className={`absolute inset-0 opacity-20 blur-3xl transition-all duration-700 pointer-events-none ${
          isAiSpeaking ? 'bg-discord-green scale-110' : 'bg-discord-blurple scale-95'
        }`} />
      )}

      {/* Avatar Kreis mit Sprach-Glow Ring */}
      <div className="relative mb-5">
        <div className={`w-36 h-36 rounded-full bg-gradient-to-tr from-discord-light to-discord-lighter flex items-center justify-center border-4 transition-all duration-300 ${details.borderColor}`}>
          {details.icon}
        </div>

        {/* Status Indikator (Unten rechts wie bei Discord) */}
        <div className="absolute bottom-1 right-2 flex items-center justify-center">
          <span className={`w-6 h-6 rounded-full border-4 border-discord-darker ${details.statusColor} shadow-md`} />
        </div>

        {/* Augen-Focus Indikator wenn Screen geteilt wird */}
        {isSharingScreen && (
          <div className="absolute -top-2 -right-2 bg-discord-blurple text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg animate-pulse">
            <Eye className="w-3 h-3" /> Screen-Focus
          </div>
        )}
      </div>

      {/* Name & Persona Status */}
      <div className="text-center z-10">
        <h3 className="text-xl font-bold text-white tracking-wide flex items-center justify-center gap-2">
          DCAI Companion
          <span className="text-[11px] font-medium bg-discord-blurple/20 text-discord-blurple px-2 py-0.5 rounded border border-discord-blurple/30">
            AI Bro
          </span>
        </h3>
        
        <p className="text-xs text-discord-textMuted mt-1 font-medium flex items-center justify-center gap-1.5">
          {isAiSpeaking ? (
            <span className="text-discord-green font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-discord-green animate-ping" />
              Spricht mit dir...
            </span>
          ) : isUserSpeaking ? (
            <span className="text-cyan-400 font-medium">Hört dir aufmerksam zu...</span>
          ) : (
            details.label
          )}
        </p>
      </div>

      {/* Realtime Audio Wellenform-Animation */}
      {isCallActive && isAiSpeaking && (
        <div className="flex items-center gap-1 mt-4 h-6">
          {[40, 75, 100, 60, 90, 45, 80, 50, 95, 65, 30].map((h, i) => (
            <div
              key={i}
              className="w-1 bg-discord-green rounded-full transition-all duration-150"
              style={{
                height: `${Math.max(6, Math.min(24, (h * Math.random()) + 6))}px`,
                opacity: 0.8
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
