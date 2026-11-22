import React, { useState, useEffect } from 'react';
import { Monitor, X } from 'lucide-react';

export default function SourceSelectorModal({ isOpen, onClose, onSelectSource }) {
  const [sources, setSources] = useState([]);

  useEffect(() => {
    if (isOpen && window.require) {
      const { desktopCapturer } = window.require('electron');
      desktopCapturer.getSources({ types: ['window', 'screen'], thumbnailSize: { width: 300, height: 180 } })
        .then(srcs => {
          setSources(srcs);
        })
        .catch(err => console.error("Fehler beim Laden der Quellen:", err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="bg-discord-dark border border-white/10 rounded-2xl max-w-3xl w-full max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-discord-darker">
          <div className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-discord-blurple" />
            <h3 className="font-bold text-white text-base">Bildschirm oder Anwendung auswählen</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-discord-textMuted hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source Grid (wie bei Discord) */}
        <div className="p-6 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-4">
          {sources.map((source) => (
            <button
              key={source.id}
              onClick={() => {
                onSelectSource(source);
                onClose();
              }}
              className="flex flex-col items-center p-3 rounded-xl bg-discord-darker hover:bg-discord-light border border-white/5 hover:border-discord-blurple/50 transition-all text-left group"
            >
              <div className="w-full aspect-video rounded-lg overflow-hidden bg-black/60 mb-2 border border-white/10 flex items-center justify-center">
                <img 
                  src={source.thumbnail.toDataURL()} 
                  alt={source.name} 
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              <span className="text-xs font-semibold text-gray-200 truncate w-full text-center">
                {source.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
