import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  ArrowUp,
  X,
  CheckCircle,
  ExternalLink,
  ChevronDown,
  Check,
  Loader2,
  Calendar,
  Sparkles,
  RefreshCw,
  FolderOpen,
  BookOpen,
  MessageSquare,
  Trash2,
  MapPin,
  PanelLeftClose,
  PanelLeftOpen,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Mic,
  Volume2,
  VolumeX,
  Gauge,
  Image as ImageIcon,
  Play,
  ShoppingCart,
  MicOff,
  FileText,
  FileUp,
  Wand2,
  Lock,
  Volume1,
  Camera,
  Sun,
  FileSearch,
  Music,
  Disc3,
  QrCode,
  Shield,
  Flame,
  Activity,
  AtSign
} from 'lucide-react';

import BarcodeScannerModal from './components/primal/BarcodeScannerModal';
import MealVisionModal from './components/primal/MealVisionModal';
import FarmMapModal from './components/primal/FarmMapModal';
import AuthModal from './components/primal/AuthModal';
import BloodWorkModal from './components/primal/BloodWorkModal';
import CaffeineCircadianModal from './components/primal/CaffeineCircadianModal';
import CalorieTrackerModal from './components/primal/CalorieTrackerModal';
import InChatFoodCard from './components/primal/InChatFoodCard';
import InChatCameraScanner from './components/primal/InChatCameraScanner';

import { getApiBaseUrl } from './services/apiConfig';

const API_BASE = getApiBaseUrl();
const IS_ELECTRON = typeof window !== 'undefined' && Boolean(window.require);

const MODELS = [
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash', badge: 'Fast' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Pro', badge: 'Deep' },
  { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B', badge: 'Groq' }
];

const DEPTH_MODES = [
  { id: 'wenig', short: 'Kurz', label: '⚡ Kurz', desc: '1–2 Sätze, ultra-direkt' },
  { id: 'mid', short: 'Kompakt', label: '🎯 Kompakt', desc: '3–4 Sätze, auf den Punkt' },
  { id: 'viel', short: 'Turbo', label: '🧬 Turbo', desc: 'Ausführlich & strukturiert' },
  { id: 'extrem', short: 'Zell-Tiefe', label: '🔬 Zell-Tiefe', desc: 'Biochemisch & zellulär' },
  { id: 'ultra', short: 'Ultra', label: '🧠 Ultra-Science', desc: 'Molekular + PubMed-Studien' }
];

export default function App() {
  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_chat_sessions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [{ id: 'default', title: 'Neue Unterhaltung', messages: [], createdAt: Date.now() }];
  });

  const [activeSessionId, setActiveSessionId] = useState(() => {
    try {
      return localStorage.getItem('aura_active_session') || 'default';
    } catch (e) {
      return 'default';
    }
  });

  // Declared at top so hooks below never hit a Temporal Dead Zone!
  const currentSession = sessions.find(s => s.id === activeSessionId) || sessions[0] || { id: 'default', title: 'Chat', messages: [] };
  const messages = currentSession.messages || [];

  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState(false);
  const [userLocation] = useState({ city: 'Jübek', region: 'Schleswig-Holstein' });

  const [input, setInput] = useState('');
  const [attachedImage, setAttachedImage] = useState(null);
  const [attachedDocument, setAttachedDocument] = useState(null);
  const [previewModalImage, setPreviewModalImage] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [expandedMetaIdx, setExpandedMetaIdx] = useState(null);
  const [loading, setLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashSelectedIdx, setSlashSelectedIdx] = useState(0);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash-lite');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isTurboOpen, setIsTurboOpen] = useState(false);
  const [explanationDepth, setExplanationDepth] = useState(() => {
    try { return localStorage.getItem('aura_explanation_depth') || 'viel'; } catch (e) { return 'viel'; }
  });

  // Aura Nutrition & Primal Modals
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [isInChatCameraOpen, setIsInChatCameraOpen] = useState(false);
  const [isMealVisionOpen, setIsMealVisionOpen] = useState(false);
  const [isFarmMapOpen, setIsFarmMapOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isBloodWorkOpen, setIsBloodWorkOpen] = useState(false);
  const [isCaffeineModalOpen, setIsCaffeineModalOpen] = useState(false);
  const [isCalorieTrackerOpen, setIsCalorieTrackerOpen] = useState(false);
  const [uiNotice, setUiNotice] = useState(null);

  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_user_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  // System Monitor State (local server only)
  const [sysStats, setSysStats] = useState(null);

  // Ghost-Writer Modal State
  const [ghostWriterOpen, setGhostWriterOpen] = useState(false);
  const [ghostText, setGhostText] = useState('');
  const [ghostResult, setGhostResult] = useState('');
  const [ghostLoading, setGhostLoading] = useState(false);

  // Music Playlist & Jukebox State
  const [isMusicSidebarOpen, setIsMusicSidebarOpen] = useState(false);
  const [musicPlaylist, setMusicPlaylist] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_music_playlist');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });
  const [currentPlayingSong, setCurrentPlayingSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Notion Sidebar State
  const [isNotionSidebarOpen, setIsNotionSidebarOpen] = useState(false);
  const [notionPages, setNotionPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState({ id: '41c6c80d-4897-80be-9350-f279e5b77f98', title: 'products needa buy' });
  const [notionProducts, setNotionProducts] = useState([]);
  const [loadingNotion, setLoadingNotion] = useState(false);
  const [isPageDropdownOpen, setIsPageDropdownOpen] = useState(false);

  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);
  const dropdownRef = useRef(null);
  const turboDropdownRef = useRef(null);
  const composerRef = useRef(null);
  const pageDropdownRef = useRef(null);
  const recognitionRef = useRef(null);

  const showToast = (msg) => {
    setUiNotice(msg);
    setTimeout(() => setUiNotice(null), 3200);
  };

  const openExternalSafe = (href) => {
    if (!href) return;
    if (IS_ELECTRON) {
      try {
        const { ipcRenderer } = window.require('electron');
        ipcRenderer.send('open-external-url', href);
        return;
      } catch (e) {}
    }
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  // Inline Markdown parser (**bold**, *italic*, `code`, [label](url), bare URLs)
  const renderInlineMarkdown = (text, keyPrefix = 'in') => {
    if (!text) return null;
    const inlineRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`|\*([^*\n]+)\*|(https?:\/\/[^\s)]+)/g;
    const parts = [];
    let lastIdx = 0;
    let match;

    while ((match = inlineRegex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        parts.push(text.slice(lastIdx, match.index));
      }
      if (match[1] && match[2]) {
        const href = match[2];
        parts.push(
          <a
            key={`${keyPrefix}-${match.index}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (IS_ELECTRON) {
                e.preventDefault();
                openExternalSafe(href);
              }
            }}
            className="text-purple-400 hover:text-purple-300 underline font-medium inline-flex items-center gap-0.5 break-all mx-0.5 transition-colors"
          >
            {match[1]}
          </a>
        );
      } else if (match[3]) {
        parts.push(<strong key={`${keyPrefix}-${match.index}`} className="font-semibold text-white">{match[3]}</strong>);
      } else if (match[4]) {
        parts.push(
          <code key={`${keyPrefix}-${match.index}`} className="px-1.5 py-0.5 rounded bg-[#1e2230] border border-[#2b3040] text-cyan-300 font-mono text-xs">
            {match[4]}
          </code>
        );
      } else if (match[5]) {
        parts.push(<em key={`${keyPrefix}-${match.index}`} className="italic text-slate-200">{match[5]}</em>);
      } else if (match[6]) {
        const href = match[6];
        parts.push(
          <a
            key={`${keyPrefix}-${match.index}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (IS_ELECTRON) {
                e.preventDefault();
                openExternalSafe(href);
              }
            }}
            className="text-purple-400 hover:text-purple-300 underline font-medium inline-flex items-center gap-0.5 break-all mx-0.5 transition-colors"
          >
            {href}
          </a>
        );
      }
      lastIdx = inlineRegex.lastIndex;
    }

    if (lastIdx < text.length) {
      parts.push(text.slice(lastIdx));
    }
    return parts;
  };

  // Full Markdown Renderer (Tables, Code Blocks, Headings, Lists, Blockquotes, Links)
  const renderFormattedText = (rawText) => {
    if (!rawText) return null;

    // Split out fenced code blocks first
    const segments = rawText.split(/(```[\s\S]*?```)/g);
    const elements = [];

    segments.forEach((seg, segIdx) => {
      if (seg.startsWith('```') && seg.endsWith('```')) {
        const inner = seg.slice(3, -3);
        const firstNewline = inner.indexOf('\n');
        const lang = firstNewline !== -1 ? inner.slice(0, firstNewline).trim() : '';
        const codeBody = firstNewline !== -1 ? inner.slice(firstNewline + 1) : inner;
        elements.push(
          <div key={`code-${segIdx}`} className="my-2.5 rounded-xl overflow-hidden border border-[#282e3f] bg-[#0e1017]">
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#151823] border-b border-[#232838] text-[11px] text-slate-400 font-mono">
              <span>{lang || 'code'}</span>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(codeBody)}
                className="hover:text-white flex items-center gap-1 text-[10px]"
              >
                <Copy className="w-3 h-3" /> Kopieren
              </button>
            </div>
            <pre className="p-3 overflow-x-auto text-xs font-mono text-slate-200 leading-relaxed select-text">
              <code>{codeBody}</code>
            </pre>
          </div>
        );
        return;
      }

      const lines = seg.split('\n');
      let i = 0;

      while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();

        if (!trimmed) {
          i++;
          continue;
        }

        // Markdown Table detection
        if (trimmed.startsWith('|') && i + 1 < lines.length && /^\s*\|?[\s:-]+\|[\s|:-]*$/.test(lines[i + 1])) {
          const parseRow = (r) =>
            r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
          const headers = parseRow(lines[i]);
          i += 2; // skip header + separator
          const rows = [];
          while (i < lines.length && lines[i].trim().startsWith('|')) {
            rows.push(parseRow(lines[i]));
            i++;
          }
          elements.push(
            <div key={`tbl-${segIdx}-${i}`} className="my-2.5 overflow-x-auto rounded-xl border border-[#272d3d] bg-[#10131c]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#171b27] border-b border-[#272d3d] text-white font-semibold">
                    {headers.map((h, hIdx) => (
                      <th key={hIdx} className="px-3 py-2 whitespace-nowrap">
                        {renderInlineMarkdown(h, `th-${segIdx}-${i}-${hIdx}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1d2230]">
                  {rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-[#161a25] transition-colors">
                      {headers.map((_, cIdx) => (
                        <td key={cIdx} className="px-3 py-2 text-slate-300 align-top">
                          {renderInlineMarkdown(row[cIdx] || '', `td-${segIdx}-${i}-${rIdx}-${cIdx}`)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          continue;
        }

        // Horizontal Rule
        if (/^---+$/.test(trimmed)) {
          elements.push(<hr key={`hr-${segIdx}-${i}`} className="my-3 border-[#222634]" />);
          i++;
          continue;
        }

        // Headings
        const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
        if (headingMatch) {
          const level = headingMatch[1].length;
          const cls =
            level === 1 ? 'text-lg font-bold text-white mt-3 mb-1' :
            level === 2 ? 'text-base font-bold text-white mt-2.5 mb-1' :
            'text-sm font-bold text-slate-100 mt-2 mb-0.5';
          elements.push(
            <div key={`h-${segIdx}-${i}`} className={cls}>
              {renderInlineMarkdown(headingMatch[2], `hd-${segIdx}-${i}`)}
            </div>
          );
          i++;
          continue;
        }

        // Blockquote
        if (trimmed.startsWith('> ')) {
          elements.push(
            <blockquote key={`bq-${segIdx}-${i}`} className="my-1.5 pl-3 border-l-2 border-purple-400/60 text-slate-300 italic text-xs">
              {renderInlineMarkdown(trimmed.slice(2), `bqi-${segIdx}-${i}`)}
            </blockquote>
          );
          i++;
          continue;
        }

        // Unordered List
        if (/^[-*•]\s+/.test(trimmed)) {
          const items = [];
          while (i < lines.length && /^[-*•]\s+/.test(lines[i].trim())) {
            items.push(lines[i].trim().replace(/^[-*•]\s+/, ''));
            i++;
          }
          elements.push(
            <ul key={`ul-${segIdx}-${i}`} className="my-1.5 space-y-1 pl-4 list-disc marker:text-blue-400 text-slate-200">
              {items.map((it, itIdx) => (
                <li key={itIdx} className="leading-relaxed">
                  {renderInlineMarkdown(it, `uli-${segIdx}-${i}-${itIdx}`)}
                </li>
              ))}
            </ul>
          );
          continue;
        }

        // Ordered List
        if (/^\d+\.\s+/.test(trimmed)) {
          const items = [];
          while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
            items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
            i++;
          }
          elements.push(
            <ol key={`ol-${segIdx}-${i}`} className="my-1.5 space-y-1 pl-5 list-decimal marker:text-blue-400 text-slate-200">
              {items.map((it, itIdx) => (
                <li key={itIdx} className="leading-relaxed">
                  {renderInlineMarkdown(it, `oli-${segIdx}-${i}-${itIdx}`)}
                </li>
              ))}
            </ol>
          );
          continue;
        }

        // Normal paragraph
        elements.push(
          <p key={`p-${segIdx}-${i}`} className="leading-relaxed my-1">
            {renderInlineMarkdown(line, `pi-${segIdx}-${i}`)}
          </p>
        );
        i++;
      }
    });

    return elements;
  };

  useEffect(() => {
    try {
      localStorage.setItem('aura_music_playlist', JSON.stringify(musicPlaylist));
    } catch (e) {}
  }, [musicPlaylist]);

  const addSongToPlaylist = (title, artist, url, videoId = null) => {
    setMusicPlaylist(prev => {
      const cleanTitle = (title || '').trim().toLowerCase();
      const alreadyExists = prev.some(s =>
        s.title.toLowerCase() === cleanTitle
      );
      if (alreadyExists) return prev;

      const newSong = {
        id: 'song_' + Date.now(),
        title: title || 'Song',
        artist: artist || 'YouTube',
        videoId,
        url: url || `https://www.youtube.com/results?search_query=${encodeURIComponent(title)}`,
        addedAt: 'Gerade hinzugefügt'
      };
      playJarvisChime();
      return [newSong, ...prev];
    });
  };

  const playSong = (song) => {
    setCurrentPlayingSong(song);
    setIsPlaying(true);
    if (!song.videoId) {
      openExternalSafe(song.url);
    }
  };

  const removeSongFromPlaylist = (id, e) => {
    e.stopPropagation();
    setMusicPlaylist(prev => prev.filter(s => s.id !== id));
  };

  // System Stats Polling (only locally on localhost)
  useEffect(() => {
    if (!API_BASE.includes('localhost')) return;
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/system-stats`);
        if (res.ok) {
          const data = await res.json();
          setSysStats(data);
        }
      } catch (e) {}
    };
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll chat to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, loading]);

  // Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'de-DE';

      rec.onresult = (e) => {
        let transcript = '';
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          transcript += e.results[i][0].transcript;
        }
        setInput(transcript);
      };

      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);
      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      showToast('Spracheingabe wird von diesem Browser nicht unterstützt.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        setIsListening(false);
      }
    }
  };

  const playJarvisChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch (e) {}
  };

  // Screen Capture (works in both Electron AND Web browsers!)
  const handleScreenCapture = async () => {
    if (IS_ELECTRON) {
      try {
        const { desktopCapturer } = window.require('electron');
        const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 1920, height: 1080 } });
        if (sources && sources[0]) {
          setAttachedImage(sources[0].thumbnail.toDataURL());
          playJarvisChime();
          return;
        }
      } catch (e) {}
    }
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const video = document.createElement('video');
        video.srcObject = stream;
        await video.play();
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        stream.getTracks().forEach(t => t.stop());
        setAttachedImage(dataUrl);
        playJarvisChime();
      } catch (err) {
        showToast('Screenshot abgebrochen.');
      }
    } else {
      showToast('Screenshot wird auf diesem Gerät nicht direkt unterstützt.');
    }
  };

  // Electron IPC Listener + Global Escape for Ghostwriter / Preview
  useEffect(() => {
    if (IS_ELECTRON) {
      try {
        const { ipcRenderer } = window.require('electron');
        ipcRenderer.on('trigger-ghostwriter', (event, clipText) => {
          setGhostText(clipText || '');
          setGhostResult('');
          setGhostWriterOpen(true);
        });
        ipcRenderer.on('trigger-screen-capture', (event, dataUrl) => {
          setAttachedImage(dataUrl);
          playJarvisChime();
        });
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (previewModalImage) setPreviewModalImage(null);
        if (ghostWriterOpen) setGhostWriterOpen(false);
        if (showSlashMenu) setShowSlashMenu(false);
        if (showMentionMenu) setShowMentionMenu(false);
        if (isModelDropdownOpen) setIsModelDropdownOpen(false);
        if (isTurboOpen) setIsTurboOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [previewModalImage, ghostWriterOpen, showSlashMenu, showMentionMenu, isModelDropdownOpen, isTurboOpen]);

  const runGhostwriter = async (mode) => {
    if (!ghostText.trim()) return;
    setGhostLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/tools?action=ghostwrite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: ghostText, mode })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGhostResult(`⚠️ Fehler: ${data.error || `HTTP ${res.status}`}`);
      } else if (data.result) {
        setGhostResult(data.result);
      }
    } catch (e) {
      setGhostResult(`⚠️ Netzwerkfehler: ${e.message}`);
    } finally {
      setGhostLoading(false);
    }
  };

  const handleDocumentDrop = async (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result;
      try {
        const res = await fetch(`${API_BASE}/api/tools?action=parse-document`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, fileBase64: base64 })
        });
        const data = await res.json();
        if (data.content) {
          setAttachedDocument({
            name: file.name,
            size: (file.size / 1024).toFixed(1) + ' KB',
            content: data.content
          });
        } else {
          showToast(data.error || 'Dokument konnte nicht gelesen werden.');
        }
      } catch (err) {
        showToast('Fehler beim Dokument-Upload.');
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    try {
      localStorage.setItem('aura_chat_sessions', JSON.stringify(sessions));
      localStorage.setItem('aura_active_session', activeSessionId);
    } catch (e) {}
  }, [sessions, activeSessionId]);

  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => setAttachedImage(event.target.result);
            reader.readAsDataURL(file);
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleCopyText = (text, idx) => {
    navigator.clipboard.writeText(text || '');
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1800);
  };

  const handleFeedback = (idx, vote) => {
    setSessions(prev => prev.map(s => {
      if (s.id !== activeSessionId) return s;
      return {
        ...s,
        messages: s.messages.map((m, i) => i === idx ? { ...m, feedback: m.feedback === vote ? null : vote } : m)
      };
    }));
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsModelDropdownOpen(false);
      }
      if (turboDropdownRef.current && !turboDropdownRef.current.contains(e.target)) {
        setIsTurboOpen(false);
      }
      if (composerRef.current && !composerRef.current.contains(e.target)) {
        setShowSlashMenu(false);
        setShowMentionMenu(false);
      }
      if (pageDropdownRef.current && !pageDropdownRef.current.contains(e.target)) {
        setIsPageDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [input]);

  const createNewChat = () => {
    const newId = 'chat_' + Date.now();
    const newChat = {
      id: newId,
      title: 'Neue Unterhaltung',
      messages: [],
      createdAt: Date.now()
    };
    setSessions(prev => [newChat, ...prev]);
    setActiveSessionId(newId);
  };

  const deleteChat = (id, e) => {
    e.stopPropagation();
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      return filtered.length === 0
        ? [{ id: 'default', title: 'Neue Unterhaltung', messages: [], createdAt: Date.now() }]
        : filtered;
    });
    if (activeSessionId === id) {
      const rem = sessions.filter(s => s.id !== id);
      setActiveSessionId(rem[0]?.id || 'default');
    }
  };

  const getNotionHeaders = () => {
    const customToken = userProfile?.notionToken || localStorage.getItem('aura_custom_notion_token') || '';
    return customToken ? { 'x-notion-token': customToken } : {};
  };

  const fetchNotionPages = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/notion?action=pages`, { headers: getNotionHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.pages) setNotionPages(data.pages);
      }
    } catch (e) {}
  };

  const fetchNotionProducts = async (dbId) => {
    setLoadingNotion(true);
    const targetId = dbId || selectedPage.id;
    try {
      const res = await fetch(`${API_BASE}/api/notion?action=products&dbId=${encodeURIComponent(targetId)}`, {
        headers: getNotionHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.products) setNotionProducts(data.products);
      }
    } catch (e) {} finally {
      setLoadingNotion(false);
    }
  };

  const handleLogInChatMeal = (mealPayload) => {
    try {
      const todayKey = new Date().toISOString().split('T')[0];
      const saved = localStorage.getItem(`aura_meals_${todayKey}`);
      const list = saved ? JSON.parse(saved) : [];
      list.unshift(mealPayload);
      localStorage.setItem(`aura_meals_${todayKey}`, JSON.stringify(list));
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('aura_meals_updated', { detail: { dateKey: todayKey } }));

      const totalKcal = list.reduce((s, m) => s + (Number(m.calories) || 0), 0);
      const targetKcal = Number(userProfile?.targetCalories || userProfile?.customMacros?.calories) || 2400;
      const remaining = Math.max(0, targetKcal - totalKcal);

      const confirmMsg = {
        role: 'assistant',
        text: `✅ **${mealPayload.name}** (${mealPayload.amount || '100g'}) erfolgreich für **${mealPayload.category || 'Mahlzeit'}** eingetragen!\n\n🔥 **${mealPayload.calories} kcal** (${mealPayload.protein}g Protein | ${mealPayload.fat}g Fett | ${mealPayload.carbs}g KH)\n📊 **Tagesstatus:** ${totalKcal} / ${targetKcal} kcal gegessen • **${remaining} kcal übrig**.`,
        workedTime: 'Im Ernährungstagebuch gespeichert',
        timestamp: 'gerade eben'
      };

      setSessions(prev => prev.map(s =>
        s.id === activeSessionId ? { ...s, messages: [...s.messages, confirmMsg] } : s
      ));
    } catch (e) {
      console.error('Error logging meal from in-chat card:', e);
    }
  };

  const handleScanInChat = async (barcode) => {
    if (!barcode) return;
    setIsInChatCameraOpen(false);

    const userMsg = {
      role: 'user',
      text: `📷 Barcode gescannt: ${barcode}`,
      timestamp: 'gerade eben'
    };

    setSessions(prev => prev.map(s =>
      s.id === activeSessionId ? { ...s, messages: [...s.messages, userMsg] } : s
    ));

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/barcode?code=${encodeURIComponent(barcode)}`);
      if (!res.ok) throw new Error('Produkt nicht gefunden');
      const data = await res.json();

      const assistantMsg = {
        role: 'assistant',
        text: `Ich habe das gescannte Produkt analysiert: **${data.name || data.productName}**.\n\nHier sind die Nährwerte, der biochemische Aura Score und die zelluläre Wirkung. Bestätige unten mit 1 Klick, um es direkt in dein Ernährungstagebuch einzutragen:`,
        foodData: data,
        workedTime: 'Biochemie-Scan abgeschlossen',
        timestamp: 'gerade eben'
      };

      setSessions(prev => prev.map(s =>
        s.id === activeSessionId ? { ...s, messages: [...s.messages, assistantMsg] } : s
      ));
    } catch (e) {
      const errorMsg = {
        role: 'assistant',
        text: `⚠️ Produkt mit Barcode \`${barcode}\` konnte in der Datenbank nicht gefunden werden. Du kannst den Lebensmittelnamen direkt im **Kalorien-Tracker** (\`/kalorien\`) suchen!`,
        timestamp: 'gerade eben'
      };
      setSessions(prev => prev.map(s =>
        s.id === activeSessionId ? { ...s, messages: [...s.messages, errorMsg] } : s
      ));
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (customText) => {
    const textToSend = (customText !== undefined ? customText : input) || '';
    const lowerCmd = textToSend.trim().toLowerCase();

    // Instant client-side modal slash commands
    if (lowerCmd === '/auth' || lowerCmd === '/login' || lowerCmd === '/profil') {
      setIsAuthModalOpen(true);
      setInput('');
      setShowSlashMenu(false);
      return;
    }
    if (lowerCmd === '/scanner') {
      setIsInChatCameraOpen(true);
      setInput('');
      setShowSlashMenu(false);
      return;
    }
    if (lowerCmd === '/meal' || lowerCmd === '/vision') {
      setIsMealVisionOpen(true);
      setInput('');
      setShowSlashMenu(false);
      return;
    }
    if (lowerCmd === '/kalorien' || lowerCmd === '/tracker' || lowerCmd === '/diary') {
      setIsCalorieTrackerOpen(true);
      setInput('');
      setShowSlashMenu(false);
      return;
    }
    if (lowerCmd === '/labor' || lowerCmd === '/blutbild') {
      setIsBloodWorkOpen(true);
      setInput('');
      setShowSlashMenu(false);
      return;
    }
    if (lowerCmd === '/koffein') {
      setIsCaffeineModalOpen(true);
      setInput('');
      setShowSlashMenu(false);
      return;
    }
    if (lowerCmd === '/hoefe' || lowerCmd === '/höfe' || lowerCmd === '/farms') {
      setIsFarmMapOpen(true);
      setInput('');
      setShowSlashMenu(false);
      return;
    }
    if (lowerCmd === '/ghost' || lowerCmd === '/ghostwriter') {
      setGhostWriterOpen(true);
      setInput('');
      setShowSlashMenu(false);
      return;
    }
    if (lowerCmd === '/notion') {
      setIsNotionSidebarOpen(true);
      fetchNotionPages();
      fetchNotionProducts();
      setInput('');
      setShowSlashMenu(false);
      return;
    }

    if ((!textToSend.trim() && !attachedImage && !attachedDocument) || loading) return;

    // Direct EAN-8..14 barcode pasted in chat
    const trimmedInput = textToSend.trim();
    if (/^\d{8,14}$/.test(trimmedInput) && !attachedImage && !attachedDocument) {
      setInput('');
      handleScanInChat(trimmedInput);
      return;
    }

    let enrichedText = textToSend;
    const activeSensors = [];

    if (userProfile) {
      const sportHrs = Array.isArray(userProfile.selectedSports)
        ? userProfile.selectedSports.reduce((s, sp) => s + (Number(sp.hoursPerWeek) || 0), 0)
        : 0;
      const condPart = userProfile.conditions ? `, Vorerkrankungen: "${userProfile.conditions}"` : '';
      enrichedText = `[PATIENTEN-KONTEXT: Gewicht: ${userProfile.weightKg || 80}kg, Größe: ${userProfile.heightCm || 180}cm, Alter: ${userProfile.age || 25}, Ziel: ${userProfile.goal || 'recomposition'}, Kalorienziel: ${userProfile.targetCalories || 2400} kcal, Schritte: ${userProfile.dailySteps || 10000}/Tag, Sport: ${sportHrs}h/Woche${condPart}]\n${enrichedText}`;
      activeSensors.push('Profil');
    }

    try {
      const savedBlood = localStorage.getItem('aura_latest_bloodwork');
      if (savedBlood) {
        const b = JSON.parse(savedBlood);
        if (b && Array.isArray(b.markers) && b.markers.length > 0) {
          enrichedText = `[AKTUELLER LABOR-STATUS: Vitalitäts-Score: ${b.overallScore}/100. Werte: ${b.markers.map(m => `${m.name}: ${m.value} (${m.status})`).slice(0, 5).join(', ')}]\n${enrichedText}`;
          activeSensors.push('Labor');
        }
      }
      const todayK = new Date().toISOString().split('T')[0];
      const savedMeals = localStorage.getItem(`aura_meals_${todayK}`);
      if (savedMeals) {
        const mList = JSON.parse(savedMeals);
        if (Array.isArray(mList) && mList.length > 0) {
          const totKcal = mList.reduce((s, m) => s + (Number(m.calories) || 0), 0);
          const totProt = Math.round(mList.reduce((s, m) => s + (Number(m.protein) || 0), 0) * 10) / 10;
          const totFat = Math.round(mList.reduce((s, m) => s + (Number(m.fat) || 0), 0) * 10) / 10;
          const totCarbs = Math.round(mList.reduce((s, m) => s + (Number(m.carbs) || 0), 0) * 10) / 10;
          const mealNames = mList.map(m => `${m.name} (${m.amount || '1 Portion'}, ${m.calories} kcal)`).slice(0, 8).join('; ');
          enrichedText = `[HEUTIGES ERNÄHRUNGSTAGEBUCH: ${totKcal} kcal gegessen (${totProt}g Protein, ${totFat}g Fett, ${totCarbs}g KH). Speisen: ${mealNames}]\n${enrichedText}`;
          activeSensors.push('Tagebuch');
        }
      }
      const savedCaff = localStorage.getItem(`aura_caffeine_${todayK}`);
      if (savedCaff) {
        const cList = JSON.parse(savedCaff);
        if (Array.isArray(cList) && cList.length > 0) {
          let activeMg = 0;
          const nowMs = Date.now();
          cList.forEach(c => {
            const hours = Math.max(0, (nowMs - c.timestamp) / (3600 * 1000));
            activeMg += c.mg * Math.pow(0.5, hours / 5.5);
          });
          if (activeMg > 5) {
            enrichedText = `[KOFFEIN-STATUS: Aktuell ca. ${Math.round(activeMg)} mg aktives Restkoffein im Blut]\n${enrichedText}`;
            activeSensors.push('Koffein');
          }
        }
      }
    } catch (e) {}

    if (attachedDocument) {
      enrichedText = `[DOKUMENT ANALYSIEREN: ${attachedDocument.name}]\nInhalt des Dokuments:\n"""\n${attachedDocument.content}\n"""\n\nNutzer-Anweisung: ${textToSend || 'Bitte analysiere und fasse dieses Dokument zusammen.'}`;
      activeSensors.push(`Dokument (${attachedDocument.name})`);
    }

    const imageToSend = attachedImage;
    const currentDoc = attachedDocument;
    setAttachedImage(null);
    setAttachedDocument(null);
    setShowSlashMenu(false);
    setShowMentionMenu(false);

    const userMsg = {
      role: 'user',
      text: textToSend || (currentDoc ? `📄 Dokument: ${currentDoc.name}` : '🖼️ Bild gesendet'),
      image: imageToSend,
      documentName: currentDoc ? currentDoc.name : null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        const cleanTitle = (textToSend || currentDoc?.name || 'Bild-Analyse').replace(/\s+/g, ' ').trim();
        return {
          ...s,
          title: s.messages.length === 0 ? (cleanTitle.length > 30 ? cleanTitle.slice(0, 30) + '…' : cleanTitle) : s.title,
          messages: [...s.messages, userMsg]
        };
      }
      return s;
    }));

    if (customText === undefined) setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setLoading(true);
    const startMs = Date.now();

    try {
      const activeSession = sessions.find(s => s.id === activeSessionId);
      const history = (activeSession?.messages || []).slice(-24).map(m => ({
        role: m.role,
        text: m.text
      }));

      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: enrichedText,
          image: imageToSend,
          history,
          model: selectedModel,
          explanationDepth: explanationDepth || userProfile?.explanationDepth || 'viel',
          userNotionToken: userProfile?.notionToken || localStorage.getItem('aura_custom_notion_token') || '',
          userNotionDbId: userProfile?.notionDbId || localStorage.getItem('aura_custom_notion_db') || ''
        })
      });
      const data = await res.json();

      // Auto-handler for deleting songs from playlist via explicit [ACTION:DELETE_SONG_FROM_PLAYLIST:...]
      if (data.reply && data.reply.includes('[ACTION:DELETE_SONG_FROM_PLAYLIST:')) {
        const match = data.reply.match(/\[ACTION:DELETE_SONG_FROM_PLAYLIST:(.*?)\]/);
        if (match && match[1]) {
          const songNameToDelete = match[1].trim().toLowerCase();
          setMusicPlaylist(prev => prev.filter(s => !s.title.toLowerCase().includes(songNameToDelete) && !s.artist.toLowerCase().includes(songNameToDelete)));
        }
      }

      // Auto-handler for deleting logged meals ONLY when AI emits [ACTION:DELETE_MEAL:...]
      const rawText = data.reply || '';
      if (rawText.includes('[ACTION:DELETE_MEAL:')) {
        try {
          const todayKey = new Date().toISOString().split('T')[0];
          const saved = localStorage.getItem(`aura_meals_${todayKey}`);
          if (saved) {
            const meals = JSON.parse(saved);
            const match = rawText.match(/\[ACTION:DELETE_MEAL:(.*?)\]/);
            const query = match && match[1] ? match[1].trim().toLowerCase() : '';
            const idx = query ? meals.findIndex(m => {
              const nameLower = (m.name || '').toLowerCase();
              return nameLower.includes(query) || query.split(/\s+/).some(w => w.length > 3 && nameLower.includes(w));
            }) : -1;

            if (idx !== -1) {
              meals.splice(idx, 1);
              localStorage.setItem(`aura_meals_${todayKey}`, JSON.stringify(meals));
              window.dispatchEvent(new Event('storage'));
              window.dispatchEvent(new CustomEvent('aura_meals_updated', { detail: { dateKey: todayKey } }));
            }
          }
        } catch (delErr) {
          console.error('Error removing meal from diary:', delErr);
        }
      }

      const cleanReplyText = (data.reply || data.actionStatus || 'Erledigt!')
        .replace(/\[ACTION:.*?\]/g, '')
        .replace(/\[HEUTIGES ERNÄHRUNGSTAGEBUCH:.*?\]/gs, '')
        .replace(/\[KOFFEIN-STATUS:.*?\]/gs, '')
        .replace(/\[PATIENTEN-KONTEXT:.*?\]/gs, '')
        .replace(/\[AKTUELLER LABOR-STATUS:.*?\]/gs, '')
        .trim();

      const elapsedSec = ((Date.now() - startMs) / 1000).toFixed(1);
      const modelLabel = MODELS.find(m => m.id === (data.modelUsed || selectedModel))?.name || 'Aura AI';

      const assistantMsg = {
        role: 'assistant',
        text: cleanReplyText,
        actionStatus: data.actionStatus,
        actionUrl: data.actionUrl || data.openUrl || null,
        imageUrl: data.imageUrl,
        youtubeVideoId: data.youtubeVideoId || null,
        workedTime: `Antwort in ${elapsedSec}s`,
        metaDetails: `${modelLabel} • Tiefe: ${explanationDepth}${activeSensors.length > 0 ? ` • Kontext: ${activeSensors.join(', ')}` : ''}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      // Only open external URL automatically if there is no embedded YouTube player
      if (data.openUrl && !data.youtubeVideoId) {
        openExternalSafe(data.openUrl);
      }

      if (voiceEnabled && assistantMsg.text && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(assistantMsg.text.replace(/[*#`_~[\]]/g, ''));
        utterance.lang = 'de-DE';
        utterance.rate = 1.05;
        window.speechSynthesis.speak(utterance);
      } else {
        playJarvisChime();
      }

      setSessions(prev => prev.map(s =>
        s.id === activeSessionId ? { ...s, messages: [...s.messages, assistantMsg] } : s
      ));

      if (data.actionStatus && (data.actionStatus.includes('Notion') || data.actionStatus.includes('Einkaufsliste'))) {
        setTimeout(() => {
          if (isNotionSidebarOpen) {
            fetchNotionProducts();
            fetchNotionPages();
          }
        }, 1000);
      }

      if (data.playlistSong) {
        addSongToPlaylist(data.playlistSong.title, data.playlistSong.artist, data.playlistSong.url, data.playlistSong.videoId);
      }
    } catch (err) {
      console.error(err);
      playJarvisChime();
      setSessions(prev => prev.map(s =>
        s.id === activeSessionId
          ? {
              ...s,
              messages: [
                ...s.messages,
                {
                  role: 'assistant',
                  text: `⚠️ Aura Backend konnte die Anfrage gerade nicht verarbeiten (${err.message || 'Netzwerkfehler'}).`,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
              ]
            }
          : s
      ));
    } finally {
      setLoading(false);
    }
  };

  // Slash Commands Definition (filtered dynamically as user types!)
  const ALL_SLASH_ACTIONS = [
    { cmd: '/kalorien', desc: 'Kalorien-, Makro- & Vitamin-Tracker öffnen', icon: Flame, color: 'text-amber-400', run: () => { setShowSlashMenu(false); setInput(''); setIsCalorieTrackerOpen(true); } },
    { cmd: '/scanner', desc: 'Barcode & Produkt-Scanner starten', icon: QrCode, color: 'text-cyan-400', run: () => { setShowSlashMenu(false); setInput(''); setIsInChatCameraOpen(true); } },
    { cmd: '/meal', desc: 'Teller-Foto oder Speisekarte analysieren', icon: Camera, color: 'text-orange-400', run: () => { setShowSlashMenu(false); setInput(''); setIsMealVisionOpen(true); } },
    { cmd: '/labor', desc: 'Blutbild & Laborwerte per OCR auswerten', icon: Activity, color: 'text-rose-400', run: () => { setShowSlashMenu(false); setInput(''); setIsBloodWorkOpen(true); } },
    { cmd: '/koffein', desc: 'Circadian- & Koffein-Halbwertszeit-Tracker', icon: Sun, color: 'text-yellow-400', run: () => { setShowSlashMenu(false); setInput(''); setIsCaffeineModalOpen(true); } },
    { cmd: '/hoefe', desc: 'Rohmilch-Höfe, Bio-Märkte & Supermärkte finden', icon: MapPin, color: 'text-emerald-400', run: () => { setShowSlashMenu(false); setInput(''); setIsFarmMapOpen(true); } },
    { cmd: '/play ', desc: 'Song direkt im integrierten Player abspielen', icon: Play, color: 'text-rose-400', fill: '/play ' },
    { cmd: '/addsong ', desc: 'Song in deine Aura Musikliste speichern', icon: Music, color: 'text-rose-400', fill: '/addsong ' },
    { cmd: '/image ', desc: '8K FLUX-Bild generieren', icon: ImageIcon, color: 'text-blue-400', fill: '/image ' },
    { cmd: '/briefing', desc: 'Live Tages-Briefing (Wetter, Fokus & Status)', icon: Sun, color: 'text-amber-400', run: () => { setShowSlashMenu(false); setInput(''); handleSend('/briefing'); } },
    { cmd: '/summary ', desc: 'Website oder YouTube-Video zusammenfassen', icon: FileSearch, color: 'text-emerald-400', fill: '/summary ' },
    { cmd: '/cal ', desc: 'Termin in Google Kalender vorbereiten', icon: Calendar, color: 'text-amber-400', fill: '/cal ' },
    { cmd: '/buy ', desc: 'Produkt online suchen & Qualitäts-Check', icon: ShoppingCart, color: 'text-purple-400', fill: '/buy ' },
    { cmd: '/notion', desc: 'Notion Second-Brain & Einkaufsliste öffnen', icon: BookOpen, color: 'text-emerald-400', run: () => { setShowSlashMenu(false); setInput(''); setIsNotionSidebarOpen(true); fetchNotionPages(); fetchNotionProducts(); } },
    { cmd: '/ghost', desc: 'Ghostwriter Text-Assistent öffnen', icon: Wand2, color: 'text-purple-400', run: () => { setShowSlashMenu(false); setInput(''); setGhostWriterOpen(true); } },
    ...(IS_ELECTRON ? [
      { cmd: '/clean', desc: 'Windows Downloads-Ordner sortieren', icon: FolderOpen, color: 'text-cyan-400', run: () => { setShowSlashMenu(false); setInput(''); handleSend('/clean'); } },
      { cmd: '/mute', desc: 'Windows Audio stummschalten', icon: Volume1, color: 'text-orange-400', run: () => { setShowSlashMenu(false); setInput(''); handleSend('/mute'); } },
      { cmd: '/lock', desc: 'Windows-Bildschirm sperren', icon: Lock, color: 'text-red-400', run: () => { setShowSlashMenu(false); setInput(''); handleSend('/lock'); } }
    ] : [])
  ];

  const slashFilterQuery = input.startsWith('/') ? input.split(/\s+/)[0].toLowerCase() : '';
  const filteredSlashActions = ALL_SLASH_ACTIONS.filter(a =>
    !slashFilterQuery || a.cmd.toLowerCase().startsWith(slashFilterQuery)
  );

  const MENTION_ITEMS = [
    { tag: '@Profil', desc: 'Körperdaten, Kalorienziel & Diagnosen einbeziehen', action: () => setIsAuthModalOpen(true), insert: '@Profil ' },
    { tag: '@Tagebuch', desc: 'Heutige Mahlzeiten & Makros analysieren', action: null, insert: 'Analysiere mein heutiges Ernährungstagebuch: ' },
    { tag: '@Blutbild', desc: 'Gespeicherte Laborwerte berücksichtigen', action: null, insert: 'Beziehe meine aktuellen Laborwerte ein: ' },
    { tag: '@Koffein', desc: 'Aktuellen Koffeinspiegel & Schlafzeitpunkt prüfen', action: null, insert: 'Wie wirkt sich mein aktueller Koffein-Status auf meinen Schlaf aus?' },
    { tag: '@Musikliste', desc: 'Aura Musik-Jukebox öffnen', action: () => setIsMusicSidebarOpen(true), insert: '' },
    { tag: '@Notion', desc: 'Notion Workspace öffnen', action: () => { setIsNotionSidebarOpen(true); fetchNotionPages(); fetchNotionProducts(); }, insert: '' }
  ];

  const executeSlashItem = (item) => {
    if (!item) return;
    if (item.run) {
      item.run();
    } else if (item.fill) {
      setInput(item.fill);
      setShowSlashMenu(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (showSlashMenu && filteredSlashActions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSlashSelectedIdx(prev => (prev + 1) % filteredSlashActions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSlashSelectedIdx(prev => (prev - 1 + filteredSlashActions.length) % filteredSlashActions.length);
        return;
      }
      if (e.key === 'Tab' || (e.key === 'Enter' && !input.includes(' '))) {
        const chosen = filteredSlashActions[slashSelectedIdx] || filteredSlashActions[0];
        if (chosen && input.trim() !== chosen.cmd.trim()) {
          e.preventDefault();
          executeSlashItem(chosen);
          return;
        }
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectedModelData = MODELS.find(m => m.id === selectedModel) || MODELS[0];
  const selectedDepthData = DEPTH_MODES.find(d => d.id === explanationDepth) || DEPTH_MODES[2];
  const canSend = (input.trim().length > 0 || attachedImage !== null || attachedDocument !== null) && !loading;

  return (
    <div className="flex h-screen w-screen bg-[#0d0e11] text-[#e2e8f0] font-sans overflow-hidden">
      {/* Toast Notification */}
      {uiNotice && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-[#181c26] border border-[#2d3448] text-xs text-white shadow-2xl animate-in fade-in duration-150">
          {uiNotice}
        </div>
      )}

      {/* Left Conversation History Sidebar */}
      {isHistorySidebarOpen && (
        <aside className="fixed sm:static inset-y-0 left-0 w-64 border-r border-[#1a1c23] bg-[#090a0d] flex flex-col h-full z-40 shadow-2xl sm:shadow-none">
          <div className="p-3 border-b border-[#1a1c23] flex items-center justify-between">
            <button
              onClick={createNewChat}
              className="flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg bg-[#16181f] hover:bg-[#20232d] border border-[#232733] text-xs font-medium text-white transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              <span>Neuer Chat</span>
            </button>
            <button
              onClick={() => setIsHistorySidebarOpen(false)}
              className="p-1.5 ml-1 rounded-md text-[#717b91] hover:text-white hover:bg-[#16181f] transition-colors"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <span className="text-[10px] font-semibold tracking-wider text-[#4f576b] uppercase px-2 mb-1 block">Unterhaltungen</span>
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => { setActiveSessionId(session.id); if (window.innerWidth < 640) setIsHistorySidebarOpen(false); }}
                className={`group flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-all ${
                  session.id === activeSessionId
                    ? 'bg-[#1a1d26] text-white font-medium border border-[#2b3040]'
                    : 'text-[#8c96ac] hover:bg-[#13151b] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare className="w-3.5 h-3.5 text-[#5e677c] flex-shrink-0" />
                  <span className="truncate">{session.title || 'Chat'}</span>
                </div>
                {sessions.length > 1 && (
                  <button
                    onClick={(e) => deleteChat(session.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[#666] hover:text-red-400 rounded transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-[#1a1c23] flex items-center justify-between text-[11px] text-[#717b91]">
            <div className="flex items-center gap-2 truncate">
              <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              <span className="truncate">{userLocation.city}, {userLocation.region}</span>
            </div>
            {sysStats && (
              <span className="text-[10px] font-mono text-emerald-400 shrink-0">CPU {sysStats.cpu}%</span>
            )}
          </div>
        </aside>
      )}

      {/* Main Chat Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">
        {/* Top Header */}
        <header className="h-14 border-b border-[#171920] px-3 sm:px-4 flex items-center justify-between gap-2 z-20 bg-[#0d0e11]/95 backdrop-blur-md shrink-0">
          {/* Left: Sidebar Toggle & Thread Title */}
          <div className="flex items-center gap-1.5 text-xs min-w-0">
            {!isHistorySidebarOpen && (
              <button
                onClick={() => setIsHistorySidebarOpen(true)}
                className="p-1.5 rounded-lg text-[#717b91] hover:text-white hover:bg-[#171920] shrink-0"
                title="Verlauf öffnen"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            )}
            <span className="text-white font-bold tracking-wider uppercase text-[11px] bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent shrink-0">
              Aura
            </span>
            <span className="text-[#3b4252] hidden md:inline">/</span>
            <span className="text-[#8c96ac] font-medium truncate text-[11px] max-w-[160px] hidden md:inline">
              {currentSession.title || 'Chat'}
            </span>
          </div>

          {/* Right: Clean Responsive Actions */}
          <div className="flex items-center gap-1.5 min-w-0">
            {/* Desktop Feature Bar (Hidden on tiny screens where Bottom Nav handles primary navigation cleanly) */}
            <div className="hidden sm:flex items-center bg-[#13151b] border border-[#232733] rounded-xl p-0.5 gap-0.5 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setIsCalorieTrackerOpen(true)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-amber-300 hover:bg-amber-500/15 transition-all"
                title="Kalorien-, Makro- & Vitamin-Tracker"
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden lg:inline">Kalorien</span>
              </button>
              <button
                onClick={() => setIsInChatCameraOpen(true)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-cyan-300 hover:bg-cyan-500/15 transition-all"
                title="Barcode & Food Scanner"
              >
                <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden lg:inline">Scanner</span>
              </button>
              <button
                onClick={() => setIsMealVisionOpen(true)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-orange-300 hover:bg-orange-500/15 transition-all"
                title="Meal Vision (Foto-Analyse)"
              >
                <Camera className="w-3.5 h-3.5 text-orange-400" />
                <span className="hidden lg:inline">Vision</span>
              </button>
              <button
                onClick={() => setIsFarmMapOpen(true)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/15 transition-all"
                title="Rohmilch & Bio-Höfe"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden lg:inline">Höfe</span>
              </button>
              <button
                onClick={() => setIsBloodWorkOpen(true)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-rose-400 hover:bg-rose-500/15 transition-all"
                title="Blutbild & Laborwert-Scanner (OCR)"
              >
                <Activity className="w-3.5 h-3.5 text-rose-500" />
                <span className="hidden lg:inline">Labor</span>
              </button>
              <button
                onClick={() => setIsCaffeineModalOpen(true)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-yellow-300 hover:bg-yellow-500/15 transition-all"
                title="Circadian & Koffein-Tracker"
              >
                <Sun className="w-3.5 h-3.5 text-yellow-400" />
                <span className="hidden lg:inline">Koffein</span>
              </button>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-indigo-300 hover:bg-indigo-500/15 transition-all"
                title="Profil & Cloud Account"
              >
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span>{userProfile ? 'Profil' : 'Login'}</span>
              </button>
            </div>

            {/* Quick Tools (Mobile shows Höfe & Ghostwriter compactly; Desktop shows Screenshot, Briefing, Ghostwriter) */}
            <div className="flex items-center bg-[#13151b] border border-[#232733] rounded-xl p-0.5 gap-0.5 shrink-0">
              <button
                onClick={() => setIsFarmMapOpen(true)}
                className="sm:hidden p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/15 transition-all"
                title="Höfe & Bio-Märkte"
              >
                <MapPin className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleScreenCapture}
                className="hidden sm:flex p-1.5 rounded-lg text-[#8c96ac] hover:text-cyan-300 hover:bg-[#1c202a] transition-all"
                title="Screenshot aufnehmen"
              >
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
              </button>
              <button
                onClick={() => handleSend('/briefing')}
                className="p-1.5 rounded-lg text-[#8c96ac] hover:text-amber-300 hover:bg-[#1c202a] transition-all"
                title="Daily Briefing (Live Wetter & Status)"
              >
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              </button>
              <button
                onClick={() => {
                  setGhostWriterOpen(true);
                  setGhostResult('');
                }}
                className="p-1.5 rounded-lg text-[#8c96ac] hover:text-purple-300 hover:bg-[#1c202a] transition-all"
                title="Ghostwriter Text-Assistent"
              >
                <Wand2 className="w-3.5 h-3.5 text-purple-400" />
              </button>
            </div>

            {/* Musikliste */}
            <button
              onClick={() => {
                setIsMusicSidebarOpen(!isMusicSidebarOpen);
                if (isNotionSidebarOpen) setIsNotionSidebarOpen(false);
              }}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-xl text-[11px] font-medium border transition-all shrink-0 ${
                isMusicSidebarOpen
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  : 'bg-[#13151b] border-[#232733] text-[#8c96ac] hover:text-white hover:bg-[#1c202a]'
              }`}
              title="Aura Musikliste"
            >
              <Music className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden md:inline">Musik</span>
            </button>

            {/* Neuer Chat (Always visible on all screen sizes!) */}
            <button
              onClick={createNewChat}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-[11px] font-bold text-white transition-all shadow-md shadow-blue-500/20 shrink-0"
              title="Neue Unterhaltung starten"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Neu</span>
            </button>
          </div>
        </header>

        {/* Chat Feed */}
        <main className="flex-1 overflow-y-auto px-4 md:px-12 py-6 flex flex-col items-center select-text">
          <div className="w-full max-w-3xl flex-1 flex flex-col space-y-6 pb-4">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center my-auto pb-6 text-center">
                <div className="w-11 h-11 rounded-2xl bg-[#161820] border border-[#232733] flex items-center justify-center mb-3 shadow-lg">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                </div>
                <h1 className="text-xl font-semibold text-white mb-1.5">
                  Wie kann Aura dir heute helfen?
                </h1>
                <p className="text-xs text-[#717b91] max-w-md mb-5">
                  Tippe <code className="px-1.5 py-0.5 rounded bg-[#181b24] text-blue-400">/</code> für Schnell-Aktionen, <code className="px-1.5 py-0.5 rounded bg-[#181b24] text-purple-400">@</code> für deinen Gesundheits-Kontext oder scanne Barcodes & Mahlzeiten.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg">
                  <button onClick={() => setIsCalorieTrackerOpen(true)} className="px-3 py-1.5 rounded-xl bg-[#141720] hover:bg-[#1c202d] border border-[#232838] text-xs text-amber-300 flex items-center gap-1.5 transition-all">
                    <Flame className="w-3.5 h-3.5" /> Kalorien & Makros tracken
                  </button>
                  <button onClick={() => setIsInChatCameraOpen(true)} className="px-3 py-1.5 rounded-xl bg-[#141720] hover:bg-[#1c202d] border border-[#232838] text-xs text-cyan-300 flex items-center gap-1.5 transition-all">
                    <QrCode className="w-3.5 h-3.5" /> Barcode scannen
                  </button>
                  <button onClick={() => handleSend('/briefing')} className="px-3 py-1.5 rounded-xl bg-[#141720] hover:bg-[#1c202d] border border-[#232838] text-xs text-emerald-300 flex items-center gap-1.5 transition-all">
                    <Sun className="w-3.5 h-3.5" /> Live Daily Briefing
                  </button>
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className="flex flex-col space-y-1.5 w-full">
                  {/* Message Info Header */}
                  <div className={`flex items-center gap-2 text-[11px] text-[#5e677c] select-none ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopyText(msg.text, idx)}
                          className="hover:text-white transition-colors"
                          title="Antwort kopieren"
                        >
                          {copiedIndex === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={() => handleFeedback(idx, 'up')}
                          className={`transition-colors ${msg.feedback === 'up' ? 'text-emerald-400' : 'hover:text-white'}`}
                          title="Hilfreich"
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleFeedback(idx, 'down')}
                          className={`transition-colors ${msg.feedback === 'down' ? 'text-rose-400' : 'hover:text-white'}`}
                          title="Nicht hilfreich"
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </button>
                        <span>{msg.timestamp || 'gerade eben'}</span>
                      </div>
                    )}
                    {msg.role === 'user' && (
                      <div className="flex items-center gap-1.5">
                        <span>{msg.timestamp || 'gerade eben'}</span>
                        <button
                          onClick={() => handleCopyText(msg.text, idx)}
                          className="hover:text-white transition-colors"
                          title="Nachricht kopieren"
                        >
                          {copiedIndex === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Message Body */}
                  {msg.role === 'user' ? (
                    <div className="self-end bg-[#1a1d26] border border-[#2b3040] text-[#f1f5f9] text-sm px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[85%] shadow-sm leading-relaxed flex flex-col gap-2">
                      {msg.image && (
                        <img
                          src={msg.image}
                          alt="User attachment"
                          onClick={() => setPreviewModalImage(msg.image)}
                          className="rounded-lg max-h-60 object-contain cursor-pointer border border-[#2e3447] hover:opacity-90 transition-opacity"
                        />
                      )}
                      {msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}
                    </div>
                  ) : (
                    <div className="self-start w-full text-sm text-[#e2e8f0] flex flex-col space-y-2.5">
                      {/* Expandable Worked Time & Context Info Pill */}
                      {msg.workedTime && (
                        <div>
                          <button
                            type="button"
                            onClick={() => setExpandedMetaIdx(expandedMetaIdx === idx ? null : idx)}
                            className="text-[11px] text-[#717b91] font-mono flex items-center gap-1 hover:text-[#94a3b8] transition-colors select-none"
                          >
                            <span>{msg.workedTime}</span>
                            <ChevronDown className={`w-3 h-3 transition-transform ${expandedMetaIdx === idx ? 'rotate-180' : '-rotate-90'}`} />
                          </button>
                          {expandedMetaIdx === idx && msg.metaDetails && (
                            <div className="mt-1 px-2.5 py-1.5 rounded-lg bg-[#12151e] border border-[#222736] text-[11px] text-slate-400 font-mono inline-block">
                              {msg.metaDetails}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="leading-relaxed break-words">
                        {renderFormattedText(msg.text)}
                      </div>

                      {/* In-Chat Interactive Food & Barcode Card */}
                      {msg.foodData && (
                        <InChatFoodCard
                          foodData={msg.foodData}
                          onLogMeal={handleLogInChatMeal}
                        />
                      )}

                      {/* Embedded In-Browser YouTube Player */}
                      {msg.youtubeVideoId && (
                        <div className="w-full max-w-md rounded-2xl overflow-hidden border border-[#262b3d] bg-black shadow-2xl">
                          <iframe
                            src={`https://www.youtube-nocookie.com/embed/${msg.youtubeVideoId}?autoplay=1`}
                            title="Aura Music Player"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="block w-full h-56 sm:h-60 border-0"
                          />
                        </div>
                      )}

                      {/* Generated AI Image */}
                      {msg.imageUrl && (
                        <div className="relative group max-w-lg mt-2 rounded-xl overflow-hidden border border-[#232734] shadow-2xl bg-[#13151b]">
                          <img
                            src={msg.imageUrl}
                            alt="Generated AI Art"
                            onClick={() => setPreviewModalImage(msg.imageUrl)}
                            className="w-full h-auto object-cover rounded-xl cursor-pointer hover:scale-[1.01] transition-transform"
                            loading="lazy"
                          />
                          <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-md p-1.5 rounded-lg">
                            <a
                              href={msg.imageUrl}
                              target="_blank"
                              rel="noreferrer"
                              download="aura_art.jpg"
                              className="p-1 rounded text-white/80 hover:text-white hover:bg-white/10"
                              title="Vollbild / Download"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Action Pill Badge */}
                      {msg.actionStatus && (
                        <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#13151b] border border-[#232838] text-xs text-[#cbd5e1] mt-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="truncate">{msg.actionStatus}</span>
                          </div>
                          {msg.actionUrl ? (
                            <a
                              href={msg.actionUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 rounded-lg flex items-center gap-1 shrink-0"
                            >
                              <span>Öffnen</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-[10px] text-[#64748b] border border-[#2b3040] px-2 py-0.5 rounded shrink-0">Erledigt</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}

            {loading && (
              <div className="flex flex-col space-y-2 py-2">
                <div className="flex items-center gap-2 text-xs text-[#717b91] font-mono">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  <span>Aura analysiert & denkt nach...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Composer Footer */}
        <footer className="px-3 py-2.5 sm:p-4 md:pb-5 flex flex-col items-center bg-[#0d0e11] shrink-0">
          <div
            ref={composerRef}
            className="relative w-full max-w-3xl rounded-2xl bg-[#13151b] border border-[#222634] p-2 flex flex-col shadow-2xl focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all"
          >
            {/* Slash Command Floating Popover (Anchored cleanly to relative composer!) */}
            {showSlashMenu && filteredSlashActions.length > 0 && (
              <div className="absolute bottom-full left-0 mb-2 z-50 p-1.5 bg-[#141720]/98 backdrop-blur-xl border border-[#2b3144] rounded-2xl shadow-2xl flex flex-col gap-0.5 w-full sm:w-96 max-h-72 overflow-y-auto">
                <div className="flex items-center justify-between px-2.5 py-1 border-b border-[#202534] mb-0.5">
                  <span className="text-[10px] font-bold text-[#7c879e] uppercase tracking-wider">Slash-Aktionen</span>
                  <span className="text-[10px] text-[#555f75]">↑↓ wählen • Enter</span>
                </div>
                {filteredSlashActions.map((item, idx) => {
                  const Icon = item.icon;
                  const active = idx === slashSelectedIdx;
                  return (
                    <button
                      key={item.cmd}
                      type="button"
                      onMouseEnter={() => setSlashSelectedIdx(idx)}
                      onClick={() => executeSlashItem(item)}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-left transition-colors ${
                        active ? 'bg-[#212738] text-white' : 'text-[#cbd5e1] hover:bg-[#1c2130]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${item.color}`} />
                      <span className="font-mono font-semibold text-white shrink-0">{item.cmd.trim()}</span>
                      <span className="text-[11px] text-[#7c879e] truncate">{item.desc}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* @ Mention Context Floating Popover */}
            {showMentionMenu && (
              <div className="absolute bottom-full left-0 mb-2 z-50 p-1.5 bg-[#141720]/98 backdrop-blur-xl border border-[#2b3144] rounded-2xl shadow-2xl flex flex-col gap-0.5 w-full sm:w-80 max-h-64 overflow-y-auto">
                <div className="flex items-center justify-between px-2.5 py-1 border-b border-[#202534] mb-0.5">
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                    <AtSign className="w-3 h-3" /> Kontext & Module erwähnen
                  </span>
                </div>
                {MENTION_ITEMS.map((m) => (
                  <button
                    key={m.tag}
                    type="button"
                    onClick={() => {
                      setShowMentionMenu(false);
                      if (m.action) {
                        setInput(prev => prev.replace(/@\S*$/, '').trim());
                        m.action();
                      } else if (m.insert) {
                        setInput(prev => prev.replace(/@\S*$/, m.insert));
                        textareaRef.current?.focus();
                      }
                    }}
                    className="flex flex-col px-2.5 py-1.5 rounded-xl text-left hover:bg-[#212738] transition-colors"
                  >
                    <span className="text-xs font-semibold text-purple-300">{m.tag}</span>
                    <span className="text-[10px] text-[#7c879e]">{m.desc}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Image Attachment Preview */}
            {attachedImage && (
              <div className="relative mb-2 p-1.5 bg-[#181b24] border border-[#2a2f40] rounded-xl flex items-center justify-between w-fit max-w-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <img
                    src={attachedImage}
                    alt="Attached preview"
                    className="w-12 h-12 object-cover rounded-lg border border-[#384055]"
                  />
                  <div className="flex flex-col text-xs text-[#94a3b8] truncate">
                    <span className="font-medium text-white truncate">Screenshot / Bild</span>
                    <span className="text-[10px] text-[#64748b]">Bereit zur Analyse</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedImage(null)}
                  className="p-1 rounded-full bg-[#202533] text-[#94a3b8] hover:text-white hover:bg-rose-500/80 transition-colors ml-3"
                  title="Bild entfernen"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Document Attachment Preview */}
            {attachedDocument && (
              <div className="relative mb-2 p-2 bg-[#181b24] border border-[#2a2f40] rounded-xl flex items-center justify-between w-fit max-w-sm">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex flex-col text-xs text-[#94a3b8] truncate">
                    <span className="font-medium text-white truncate">{attachedDocument.name}</span>
                    <span className="text-[10px] text-[#64748b]">{attachedDocument.size} • Bereit zur Analyse</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedDocument(null)}
                  className="p-1 rounded-full bg-[#202533] text-[#94a3b8] hover:text-white hover:bg-rose-500/80 transition-colors ml-3"
                  title="Dokument entfernen"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Input Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                const val = e.target.value;
                setInput(val);
                if (val.startsWith('/') && !val.includes(' ')) {
                  setShowSlashMenu(true);
                  setSlashSelectedIdx(0);
                  setShowMentionMenu(false);
                } else if (/(?:^|\s)@[a-zA-ZäöüÄÖÜ]*$/.test(val)) {
                  setShowMentionMenu(true);
                  setShowSlashMenu(false);
                } else {
                  setShowSlashMenu(false);
                  setShowMentionMenu(false);
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder={attachedImage ? 'Frag etwas zu diesem Bild / Screenshot...' : 'Frag alles, @ für Kontext, / für Aktionen...'}
              disabled={loading}
              className="w-full bg-transparent border-none outline-none resize-none text-[#e2e8f0] placeholder-[#555d71] text-sm px-2 pt-1 pb-2 min-h-[38px] max-h-[140px]"
              rows={1}
            />

            {/* Bottom Composer Toolbar */}
            <div className="flex items-center justify-between pt-1 border-t border-[#1a1d26] px-1 text-xs gap-1">
              {/* Left Controls */}
              <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                <input
                  type="file"
                  id="doc-upload-input"
                  className="hidden"
                  accept=".pdf,.txt,.docx,.json,.md,.csv"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleDocumentDrop(e.target.files[0]);
                      e.target.value = null;
                    }
                  }}
                />
                <label
                  htmlFor="doc-upload-input"
                  className="p-1.5 rounded text-[#717b91] hover:text-white hover:bg-[#1c202a] transition-colors cursor-pointer shrink-0"
                  title="PDF / Dokument hochladen"
                >
                  <FileUp className="w-3.5 h-3.5" />
                </label>

                <button
                  type="button"
                  onClick={() => setIsInChatCameraOpen(true)}
                  className="p-1.5 rounded text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors shrink-0"
                  title="Barcode scannen"
                >
                  <QrCode className="w-3.5 h-3.5" />
                </button>

                {/* Model Selector Dropdown */}
                <div className="relative min-w-0" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[#94a3b8] hover:text-white hover:bg-[#1c202a] transition-colors font-medium text-[11px] whitespace-nowrap"
                  >
                    <span className="truncate max-w-[105px] sm:max-w-none">{selectedModelData.name}</span>
                    <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isModelDropdownOpen && (
                    <div className="absolute bottom-full left-0 mb-2 w-56 bg-[#13151b] border border-[#272c3d] rounded-xl shadow-2xl z-50 p-1.5">
                      {MODELS.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setSelectedModel(m.id);
                            setIsModelDropdownOpen(false);
                          }}
                          className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                            m.id === selectedModel ? 'bg-[#1e2330] text-white font-medium' : 'text-[#8c96ac] hover:bg-[#1a1d26] hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span>{m.name}</span>
                            {m.badge && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                                {m.badge}
                              </span>
                            )}
                          </div>
                          {m.id === selectedModel && <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-1 sm:gap-2 text-[#717b91] shrink-0">
                {/* Working Turbo / Explanation Depth Dropdown */}
                <div className="relative" ref={turboDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsTurboOpen(!isTurboOpen)}
                    className="flex items-center gap-1 px-1.5 py-1 rounded text-[11px] hover:text-white hover:bg-[#1c202a] transition-colors whitespace-nowrap"
                    title="KI-Antworttiefe & Detailgrad wählen"
                  >
                    <Gauge className="w-3 h-3 text-blue-400 shrink-0" />
                    <span>{selectedDepthData.short}</span>
                    <ChevronDown className={`w-2.5 h-2.5 transition-transform ${isTurboOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isTurboOpen && (
                    <div className="absolute bottom-full right-0 mb-2 w-56 bg-[#13151b] border border-[#272c3d] rounded-xl shadow-2xl z-50 p-1.5 space-y-0.5">
                      <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider px-2 py-1 block">Antwort-Tiefe</span>
                      {DEPTH_MODES.map((mode) => (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => {
                            setExplanationDepth(mode.id);
                            try { localStorage.setItem('aura_explanation_depth', mode.id); } catch (e) {}
                            setIsTurboOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                            explanationDepth === mode.id ? 'bg-[#1e2330] text-white font-semibold' : 'text-[#8c96ac] hover:bg-[#1a1d26] hover:text-white'
                          }`}
                        >
                          <div>
                            <span className="block">{mode.label}</span>
                            <span className="text-[10px] text-[#64748b] block">{mode.desc}</span>
                          </div>
                          {explanationDepth === mode.id && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className={`p-1.5 rounded transition-colors ${
                    voiceEnabled ? 'text-blue-400 bg-blue-500/10' : 'text-[#717b91] hover:text-white hover:bg-[#1c202a]'
                  }`}
                  title={voiceEnabled ? 'Sprachausgabe An' : 'Sprachausgabe Aus'}
                >
                  {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-1.5 rounded transition-colors ${
                    isListening ? 'text-red-400 bg-red-500/20 animate-pulse' : 'hover:text-white hover:bg-[#1c202a]'
                  }`}
                  title={isListening ? 'Spracherkennung beenden' : 'Sprechen statt Tippen'}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!canSend}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    canSend
                      ? 'bg-white text-black hover:bg-[#e2e8f0]'
                      : 'bg-[#222634] text-[#4f576b] cursor-not-allowed'
                  }`}
                  title="Senden"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </footer>

        {/* Mobile Fixed Bottom Navigation Bar */}
        <nav className="sm:hidden border-t border-[#1a1c24] bg-[#0c0d12]/95 backdrop-blur-lg px-1 py-1.5 flex items-center justify-around z-30 shrink-0">
          <button
            onClick={() => setIsCalorieTrackerOpen(true)}
            className="flex flex-col items-center gap-0.5 text-zinc-400 hover:text-amber-400 transition-colors"
          >
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="text-[9px] font-medium">Kalorien</span>
          </button>

          <button
            onClick={() => setIsInChatCameraOpen(true)}
            className="flex flex-col items-center gap-0.5 text-zinc-400 hover:text-cyan-400 transition-colors"
          >
            <QrCode className="w-4 h-4 text-cyan-400" />
            <span className="text-[9px] font-medium">Scanner</span>
          </button>

          <button
            onClick={() => setIsMealVisionOpen(true)}
            className="flex flex-col items-center gap-0.5 text-zinc-400 hover:text-orange-400 transition-colors"
          >
            <Camera className="w-4 h-4 text-orange-400" />
            <span className="text-[9px] font-medium">Vision</span>
          </button>

          <button
            onClick={() => setIsBloodWorkOpen(true)}
            className="flex flex-col items-center gap-0.5 text-zinc-400 hover:text-rose-400 transition-colors"
          >
            <Activity className="w-4 h-4 text-rose-400" />
            <span className="text-[9px] font-medium">Labor</span>
          </button>

          <button
            onClick={() => setIsCaffeineModalOpen(true)}
            className="flex flex-col items-center gap-0.5 text-zinc-400 hover:text-yellow-400 transition-colors"
          >
            <Sun className="w-4 h-4 text-yellow-400" />
            <span className="text-[9px] font-medium">Koffein</span>
          </button>

          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="flex flex-col items-center gap-0.5 text-zinc-400 hover:text-indigo-400 transition-colors"
          >
            <Shield className="w-4 h-4 text-indigo-400" />
            <span className="text-[9px] font-medium">{userProfile ? 'Profil' : 'Login'}</span>
          </button>
        </nav>
      </div>

      {/* Aura Musikliste / Jukebox Sidebar */}
      {isMusicSidebarOpen && (
        <aside className="fixed sm:static inset-y-0 right-0 w-80 border-l border-[#1a1c23] bg-[#0c0d12] flex flex-col h-full z-40 shadow-2xl">
          <div className="p-3 border-b border-[#1a1c23] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                <Disc3 className={`w-3.5 h-3.5 text-rose-400 ${isPlaying ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white">Aura Musikliste</h3>
                <p className="text-[10px] text-[#64748b]">{musicPlaylist.length} Songs gespeichert</p>
              </div>
            </div>
            <button
              onClick={() => setIsMusicSidebarOpen(false)}
              className="p-1 rounded text-[#717b91] hover:text-white hover:bg-[#16181f]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-2 border-b border-[#1a1c23] bg-[#101218]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target;
                const title = form.songInput.value.trim();
                if (title) {
                  addSongToPlaylist(title, 'Hinzugefügt', `https://www.youtube.com/results?search_query=${encodeURIComponent(title)}`);
                  form.reset();
                }
              }}
              className="flex items-center gap-1.5"
            >
              <input
                name="songInput"
                placeholder="Songname eingeben & Enter..."
                className="flex-1 bg-[#161822] border border-[#232733] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-[#555d71] outline-none focus:border-rose-500/50"
              />
              <button
                type="submit"
                className="px-2.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-medium"
              >
                +
              </button>
            </form>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
            {musicPlaylist.length === 0 ? (
              <div className="text-xs text-[#717b91] text-center py-12">
                Noch keine Songs in der Playlist.<br />
                Nutze <code className="text-rose-400">/addsong Songname</code> im Chat!
              </div>
            ) : (
              musicPlaylist.map((song) => (
                <div
                  key={song.id}
                  onClick={() => playSong(song)}
                  className={`group p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    currentPlayingSong?.id === song.id
                      ? 'bg-rose-500/10 border-rose-500/30 text-white'
                      : 'bg-[#13151c] border-[#1d212d] hover:bg-[#1a1d28] hover:border-[#2b3040] text-[#cbd5e1]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-7 h-7 rounded-lg bg-black/40 flex items-center justify-center flex-shrink-0 group-hover:bg-rose-500/20 transition-colors">
                      <Play className="w-3.5 h-3.5 text-rose-400 fill-rose-400/20" />
                    </div>
                    <div className="flex flex-col truncate">
                      <span className="text-xs font-medium text-white truncate">{song.title}</span>
                      <span className="text-[10px] text-[#717b91] truncate">{song.artist || 'YouTube'}</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => removeSongFromPlaylist(song.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-[#64748b] hover:text-rose-400 hover:bg-rose-500/10 transition-opacity"
                    title="Aus Liste entfernen"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>

          {currentPlayingSong && (
            <div className="border-t border-[#1a1c23] bg-[#090a0d] p-2.5 space-y-2">
              {currentPlayingSong.videoId && (
                <div className="aspect-video w-full rounded-lg overflow-hidden border border-[#232733]">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${currentPlayingSong.videoId}?autoplay=1`}
                    title={currentPlayingSong.title}
                    allow="autoplay; encrypted-media"
                    className="w-full h-full border-0"
                  />
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <Disc3 className="w-4 h-4 text-rose-400 animate-spin flex-shrink-0" />
                  <span className="text-xs text-white truncate font-medium">{currentPlayingSong.title}</span>
                </div>
                <a
                  href={currentPlayingSong.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-rose-400 hover:underline flex items-center gap-1 flex-shrink-0 ml-2"
                >
                  <span>YouTube</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          )}
        </aside>
      )}

      {/* Notion Sidebar */}
      {isNotionSidebarOpen && (
        <aside className="fixed sm:static inset-y-0 right-0 w-80 md:w-96 border-l border-[#1a1c23] bg-[#0d0e11] flex flex-col h-full z-40 shadow-2xl">
          <div className="p-3.5 border-b border-[#1a1c23] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold text-white uppercase tracking-wider">Notion Workspace</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { fetchNotionPages(); fetchNotionProducts(); }}
                disabled={loadingNotion}
                className="p-1 rounded text-[#717b91] hover:text-white hover:bg-[#161820]"
                title="Aktualisieren"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingNotion ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setIsNotionSidebarOpen(false)}
                className="p-1 rounded text-[#717b91] hover:text-white hover:bg-[#161820]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-3 border-b border-[#1a1c23]">
            <div className="relative" ref={pageDropdownRef}>
              <button
                onClick={() => setIsPageDropdownOpen(!isPageDropdownOpen)}
                className="w-full flex items-center justify-between p-2 rounded-lg bg-[#161820] border border-[#232733] text-xs font-medium text-white hover:bg-[#1e222d] transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <FolderOpen className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <span className="truncate">{selectedPage.title}</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-[#717b91] flex-shrink-0 transition-transform ${isPageDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isPageDropdownOpen && notionPages.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-[#13151b] border border-[#272c3d] rounded-xl shadow-2xl z-40 p-1">
                  {notionPages.map((page) => (
                    <button
                      key={page.id}
                      onClick={() => {
                        setSelectedPage(page);
                        setIsPageDropdownOpen(false);
                        fetchNotionProducts(page.id);
                      }}
                      className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        page.id === selectedPage.id ? 'bg-[#1e2330] text-white font-medium' : 'text-[#8c96ac] hover:bg-[#1a1d26] hover:text-white'
                      }`}
                    >
                      <span className="truncate">{page.title}</span>
                      {page.id === selectedPage.id && <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loadingNotion && notionProducts.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-xs text-[#717b91]">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Lade Notion-Einträge...
              </div>
            ) : notionProducts.length === 0 ? (
              <div className="text-xs text-[#717b91] text-center py-8 px-4 space-y-2">
                <p>Keine Einträge geladen.</p>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="text-indigo-400 hover:underline text-[11px]"
                >
                  Notion-Token im Profil prüfen →
                </button>
              </div>
            ) : (
              notionProducts.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-[#14161d] border border-[#1f232f] flex flex-col gap-1.5 hover:border-[#2f3547] transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-medium text-white leading-tight">{item.name}</span>
                    {item.price && (
                      <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded flex-shrink-0">
                        {item.price}
                      </span>
                    )}
                  </div>
                  {item.vorteile && (
                    <p className="text-[11px] text-[#8c96ac] line-clamp-2">{item.vorteile}</p>
                  )}
                  <div className="flex items-center justify-between pt-1 border-t border-[#1a1d26] mt-1 text-[10px]">
                    <span className="text-amber-400 font-medium">⭐ {item.rating || '10 / 10'}</span>
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-400 hover:underline">
                        <span>Shop Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-[#4f576b]">Kein Link</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      )}

      {/* Ghostwriter Modal */}
      {ghostWriterOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setGhostWriterOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-[#13151b] border border-[#272c3d] rounded-2xl shadow-2xl p-5 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#1f232f] pb-3">
              <div className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-purple-400" />
                <h2 className="text-sm font-semibold text-white">Ghostwriter HUD</h2>
              </div>
              <button
                onClick={() => setGhostWriterOpen(false)}
                className="text-[#717b91] hover:text-white p-1 rounded-md hover:bg-[#1f232f]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-[11px] font-medium text-[#8c96ac] mb-1.5 block">Original-Text:</label>
              <textarea
                value={ghostText}
                onChange={(e) => setGhostText(e.target.value)}
                placeholder="Text hier einfügen..."
                className="w-full h-24 bg-[#0a0b0e] border border-[#202431] rounded-xl p-3 text-xs text-white placeholder-[#4f576b] focus:border-purple-500/50 outline-none resize-none"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => runGhostwriter('polish')}
                disabled={ghostLoading || !ghostText.trim()}
                className="px-3 py-1.5 rounded-lg text-xs bg-purple-500/10 hover:bg-purple-500/20 disabled:opacity-40 text-purple-300 border border-purple-500/30 transition-all font-medium"
              >
                ✨ Professionell umschreiben
              </button>
              <button
                onClick={() => runGhostwriter('fix')}
                disabled={ghostLoading || !ghostText.trim()}
                className="px-3 py-1.5 rounded-lg text-xs bg-blue-500/10 hover:bg-blue-500/20 disabled:opacity-40 text-blue-300 border border-blue-500/30 transition-all font-medium"
              >
                📝 Grammatik korrigieren
              </button>
              <button
                onClick={() => runGhostwriter('translate_en')}
                disabled={ghostLoading || !ghostText.trim()}
                className="px-3 py-1.5 rounded-lg text-xs bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-40 text-emerald-300 border border-emerald-500/30 transition-all font-medium"
              >
                🇬🇧 Ins Englische übersetzen
              </button>
              <button
                onClick={() => runGhostwriter('shorten')}
                disabled={ghostLoading || !ghostText.trim()}
                className="px-3 py-1.5 rounded-lg text-xs bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-40 text-amber-300 border border-amber-500/30 transition-all font-medium"
              >
                ⚡ Kurz zusammenfassen
              </button>
            </div>

            {ghostLoading && (
              <div className="flex items-center gap-2 text-xs text-purple-400 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>KI formuliert deinen Text um...</span>
              </div>
            )}

            {ghostResult && (
              <div className="flex flex-col gap-2 mt-1 p-3 rounded-xl bg-[#0a0b0e] border border-purple-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider">Ergebnis:</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(ghostResult);
                      showToast('In Zwischenablage kopiert!');
                    }}
                    className="text-[11px] text-[#94a3b8] hover:text-white flex items-center gap-1 bg-[#161820] px-2 py-0.5 rounded border border-[#282d3c]"
                  >
                    <Copy className="w-3 h-3 text-purple-400" /> Kopieren
                  </button>
                </div>
                <p className="text-xs text-white leading-relaxed select-text whitespace-pre-wrap">{ghostResult}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen Image Preview Modal */}
      {previewModalImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setPreviewModalImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setPreviewModalImage(null)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewModalImage}
              alt="Fullscreen preview"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Aura Nutrition & Primal Modals */}
      <CalorieTrackerModal
        isOpen={isCalorieTrackerOpen}
        onClose={() => setIsCalorieTrackerOpen(false)}
        onOpenBarcodeScanner={() => {
          setIsCalorieTrackerOpen(false);
          setIsBarcodeScannerOpen(true);
        }}
        onOpenMealVision={() => {
          setIsCalorieTrackerOpen(false);
          setIsMealVisionOpen(true);
        }}
        onOpenProfile={() => {
          setIsCalorieTrackerOpen(false);
          setIsAuthModalOpen(true);
        }}
      />

      <InChatCameraScanner
        isOpen={isInChatCameraOpen}
        onClose={() => setIsInChatCameraOpen(false)}
        onDetectedCode={(code) => handleScanInChat(code)}
      />

      <BarcodeScannerModal
        isOpen={isBarcodeScannerOpen}
        onClose={() => setIsBarcodeScannerOpen(false)}
        onOpenMapWithStore={() => {
          setIsBarcodeScannerOpen(false);
          setIsFarmMapOpen(true);
        }}
        onAddToTracker={(item) => {
          handleLogInChatMeal({
            id: Date.now().toString(),
            name: item.name,
            category: item.category || 'Mahlzeit',
            amount: '100g',
            calories: Number(item.calories) || 0,
            protein: Number(item.protein) || 0,
            fat: Number(item.fat) || 0,
            carbs: Number(item.carbs) || 0,
            isClean: item.isClean !== false,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
          setIsBarcodeScannerOpen(false);
        }}
      />

      <MealVisionModal
        isOpen={isMealVisionOpen}
        onClose={() => setIsMealVisionOpen(false)}
        onSaveToNotion={(mealData) => {
          if (mealData?.dishName) {
            handleSend(`Speichere folgende Mahlzeit in Notion: ${mealData.dishName} (${mealData.estimatedMacros?.calories || ''}, Aura Score ${mealData.auraScore}/100)`);
            setIsMealVisionOpen(false);
          }
        }}
        onAddToTracker={(mealData) => {
          const calMatch = (mealData.estimatedMacros?.calories || '').match(/(\d+)/);
          const protMatch = (mealData.estimatedMacros?.protein || '').match(/(\d+(?:\.\d+)?)/);
          const fatMatch = (mealData.estimatedMacros?.fat || '').match(/(\d+(?:\.\d+)?)/);
          const carbMatch = (mealData.estimatedMacros?.carbs || '').match(/(\d+(?:\.\d+)?)/);

          handleLogInChatMeal({
            id: Date.now().toString(),
            name: mealData.dishName || 'Mahlzeit',
            category: 'Mahlzeit',
            amount: '1 Portion',
            calories: calMatch ? parseInt(calMatch[1], 10) : 550,
            protein: protMatch ? parseFloat(protMatch[1]) : 30,
            fat: fatMatch ? parseFloat(fatMatch[1]) : 25,
            carbs: carbMatch ? parseFloat(carbMatch[1]) : 40,
            isClean: (mealData.auraScore || 0) >= 70,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
          setIsMealVisionOpen(false);
        }}
      />

      <FarmMapModal
        isOpen={isFarmMapOpen}
        onClose={() => setIsFarmMapOpen(false)}
      />

      <BloodWorkModal
        isOpen={isBloodWorkOpen}
        onClose={() => setIsBloodWorkOpen(false)}
      />

      <CaffeineCircadianModal
        isOpen={isCaffeineModalOpen}
        onClose={() => setIsCaffeineModalOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogout={() => {
          localStorage.removeItem('aura_user_profile');
          localStorage.removeItem('aura_session_token');
          setUserProfile(null);
          showToast('Erfolgreich abgemeldet.');
        }}
        onAuthSuccess={(profile, meta) => {
          setUserProfile(profile);
          if (profile.explanationDepth) {
            setExplanationDepth(profile.explanationDepth);
          }
          if (meta?.isNewRegistration) {
            const introMsg = `Ich habe mein Profil gerade neu eingerichtet! Gewicht ${profile.weightKg}kg, Größe ${profile.heightCm}cm, Schritte: ${profile.dailySteps}, PAL: ${profile.pal || '1.7'}, Kalorienziel: ${profile.targetCalories || '2400'} kcal/Tag. Vorerkrankungen/Ziele: "${profile.conditions || profile.goal || 'Optimale Zellgesundheit'}". Bitte gib mir eine kompakte zellbiologische Start-Analyse!`;
            handleSend(introMsg);
          } else {
            showToast('Profil gespeichert & aktiv!');
          }
        }}
      />
    </div>
  );
}
