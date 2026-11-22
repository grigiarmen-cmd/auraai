import React from 'react';
import { 
  Mic, MicOff, Headphones, Monitor, MonitorOff, 
  PhoneOff, Crosshair, FileDown, Music, Sparkles, MessageSquare
} from 'lucide-react';

export default function CallControls({
  isCallActive,
  isMuted,
  isDeafened,
  isSharingScreen,
  isLaserActive,
  activePersona,
  onToggleMute,
  onToggleDeafen,
  onToggleScreenShare,
  onToggleLaser,
  onSnapshot,
  onExportNotes,
  onToggleSoundboard,
  onChangePersona,
  onToggleChat,
  isChatOpen,
  onStartCall,
  onEndCall
}) {
  return (
    <div className="flex items-center justify-center gap-2 p-3 bg-discord-darker/95 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl">
      {/* Wenn Call nicht aktiv ist: Grüner Haupt-Anrufbutton */}
      {!isCallActive ? (
        <button
          onClick={onStartCall}
          className="flex items-center gap-3 px-8 py-3.5 bg-discord-green hover:bg-[#1f9250] text-white font-bold rounded-xl shadow-lg shadow-discord-green/20 transition-all hover:scale-105 active:scale-95"
        >
          <span className="w-3 h-3 rounded-full bg-white animate-ping" />
          KI-Call starten
        </button>
      ) : (
        <>
          {/* Mute Button */}
          <button
            onClick={onToggleMute}
            title={isMuted ? "Mikrofon aktivieren (Unmute)" : "Stummschalten (Mute)"}
            className={`p-3.5 rounded-xl transition-all duration-200 flex items-center justify-center ${
              isMuted 
                ? 'bg-discord-red text-white hover:bg-[#d8363a]' 
                : 'bg-discord-light text-white hover:bg-discord-lighter'
            }`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Deafen Button */}
          <button
            onClick={onToggleDeafen}
            title={isDeafened ? "Ton aktivieren" : "Taub schalten (Deafen)"}
            className={`p-3.5 rounded-xl transition-all duration-200 flex items-center justify-center ${
              isDeafened 
                ? 'bg-discord-red text-white hover:bg-[#d8363a]' 
                : 'bg-discord-light text-white hover:bg-discord-lighter'
            }`}
          >
            <Headphones className="w-5 h-5" />
          </button>

          <div className="w-[1px] h-7 bg-white/10 mx-1" />

          {/* Screen Share Button */}
          <button
            onClick={onToggleScreenShare}
            title={isSharingScreen ? "Bildschirmübertragung stoppen" : "Bildschirm live übertragen (3 FPS an KI)"}
            className={`px-4 py-3.5 rounded-xl font-medium text-xs flex items-center gap-2 transition-all duration-200 ${
              isSharingScreen 
                ? 'bg-discord-blurple text-white shadow-lg shadow-discord-blurple/30 ring-2 ring-discord-blurple/50' 
                : 'bg-discord-light text-white hover:bg-discord-lighter'
            }`}
          >
            {isSharingScreen ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
            <span>{isSharingScreen ? 'Stream läuft' : 'Screen Share'}</span>
          </button>

          {/* Laserpointer Toggle */}
          <button
            onClick={onToggleLaser}
            title={isLaserActive ? "Laserpointer aktiv" : "Laserpointer einschalten"}
            className={`p-3.5 rounded-xl transition-all duration-200 flex items-center justify-center ${
              isLaserActive 
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-400' 
                : 'bg-discord-light text-discord-textMuted hover:text-white hover:bg-discord-lighter'
            }`}
          >
            <Crosshair className="w-5 h-5" />
          </button>

          {/* 📸 Schnappschuss / Folie merken Button */}
          {isSharingScreen && (
            <button
              onClick={onSnapshot}
              title="Folie / Bildschirm jetzt als Lernzettel-Bild erfassen"
              className="p-3.5 bg-discord-light hover:bg-discord-blurple text-discord-textMuted hover:text-white rounded-xl transition-all flex items-center justify-center"
            >
              <Sparkles className="w-5 h-5" />
            </button>
          )}

          {/* Export Lernzettel & Notizen Button */}
          <button
            onClick={onExportNotes}
            title="Lernzettel & Notizen sofort als Markdown exportieren"
            className="p-3.5 bg-discord-light text-discord-textMuted hover:text-white hover:bg-discord-lighter rounded-xl transition-all flex items-center justify-center"
          >
            <FileDown className="w-5 h-5" />
          </button>

          {/* Soundboard Button */}
          <button
            onClick={onToggleSoundboard}
            title="Soundboard & Audio-Reaktionen"
            className="p-3.5 bg-discord-light text-discord-textMuted hover:text-white hover:bg-discord-lighter rounded-xl transition-all flex items-center justify-center"
          >
            <Music className="w-5 h-5" />
          </button>

          {/* Side-Chat Toggle */}
          <button
            onClick={onToggleChat}
            title="Begleiter-Notizen & Chat einblenden"
            className={`p-3.5 rounded-xl transition-all flex items-center justify-center ${
              isChatOpen 
                ? 'bg-discord-blurple text-white' 
                : 'bg-discord-light text-discord-textMuted hover:text-white hover:bg-discord-lighter'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          <div className="w-[1px] h-7 bg-white/10 mx-1" />

          {/* Auflegen / End Call */}
          <button
            onClick={onEndCall}
            title="Anruf beenden"
            className="p-3.5 bg-discord-red hover:bg-[#d8363a] text-white rounded-xl shadow-lg shadow-discord-red/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
}
