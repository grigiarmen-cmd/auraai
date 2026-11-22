import React, { useState } from 'react';
import { Send, FileText, Sparkles, ExternalLink, Download } from 'lucide-react';

export default function NotesChatPanel({ isOpen, notes, chatMessages, onSendMessage, onExport }) {
  const [input, setInput] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="w-80 h-full bg-discord-dark border-l border-white/5 flex flex-col shadow-2xl z-20">
      {/* Header */}
      <div className="p-3.5 bg-discord-darker border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-discord-blurple" />
          <h4 className="text-sm font-bold text-white">Call-Dossier & Notizen</h4>
        </div>
        <button
          onClick={onExport}
          title="Als Markdown speichern"
          className="p-1.5 hover:bg-white/10 rounded text-discord-textMuted hover:text-white transition-colors"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

      {/* Notizen- / Lernzettel-Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {notes.length === 0 ? (
          <div className="text-center py-10 px-4">
            <Sparkles className="w-8 h-8 text-discord-textMuted/40 mx-auto mb-2" />
            <p className="text-xs text-discord-textMuted font-medium">
              Noch keine Notizen. Sag einfach: <br />
              <span className="text-discord-blurple italic">„Merk dir diese Folie“</span> oder <br />
              <span className="text-discord-blurple italic">„Schreib mir einen Lernzettel dazu“</span>
            </p>
          </div>
        ) : (
          notes.map((item, idx) => (
            <div key={idx} className="p-3 bg-discord-light/60 rounded-xl border border-white/5 space-y-1.5 hover:border-discord-blurple/30 transition-all">
              <div className="flex items-center justify-between text-[11px] text-discord-textMuted">
                <span className="font-semibold text-discord-blurple">{item.category || 'Notiz'}</span>
                <span>{item.timestamp || 'Gerade'}</span>
              </div>
              <h5 className="text-xs font-bold text-white">{item.title}</h5>
              <p className="text-[11px] text-gray-300 leading-relaxed whitespace-pre-wrap">{item.content}</p>
            </div>
          ))
        )}
      </div>

      {/* Whisper-Mode Chat Input (Flüstermodus) */}
      <form onSubmit={handleSubmit} className="p-3 bg-discord-darker border-t border-white/5 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Flüstern / Frage tippen..."
          className="flex-1 bg-discord-light text-white text-xs px-3 py-2.5 rounded-lg border border-transparent focus:border-discord-blurple focus:outline-none transition-colors placeholder:text-discord-textMuted"
        />
        <button
          type="submit"
          className="p-2.5 bg-discord-blurple hover:bg-[#4752c4] text-white rounded-lg transition-colors flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
