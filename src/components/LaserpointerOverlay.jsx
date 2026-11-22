import React from 'react';

export default function LaserpointerOverlay({ isActive, marker }) {
  if (!isActive || !marker) return null;

  const { x, y, label, type } = marker;

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      <div 
        className="absolute transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${x}%`, top: `${y}%` }}
      >
        {/* Pulsierender Zielkreis */}
        <div className="relative flex items-center justify-center">
          <div className="w-14 h-14 rounded-full border-2 border-cyan-400 laser-active shadow-[0_0_20px_#22d3ee]" />
          <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] absolute" />
        </div>

        {/* Info-Label über dem Laserpunkt */}
        {label && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/85 text-cyan-300 text-[11px] font-bold px-2.5 py-1 rounded-md border border-cyan-500/50 shadow-lg backdrop-blur-sm">
            {label}
          </div>
        )}
      </div>
    </div>
  );
}
