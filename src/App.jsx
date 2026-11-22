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
  Undo2,
  Mic,
  Volume2,
  VolumeX,
  Gauge,
  MoreVertical,
  Image as ImageIcon,
  Play,
  ShoppingCart,
  MicOff,
  Cpu,
  FileText,
  FileUp,
  Wand2,
  Minimize2,
  Lock,
  Volume1,
  Camera,
  Sun,
  FileSearch,
  Bell,
  Music,
  ListMusic,
  Disc3,
  Pause,
  QrCode,
  Apple,
  Shield,
  Flame,
  Activity
} from 'lucide-react';

import BarcodeScannerModal from './components/primal/BarcodeScannerModal';
import MealVisionModal from './components/primal/MealVisionModal';
import FarmMapModal from './components/primal/FarmMapModal';
import AuthModal from './components/primal/AuthModal';
import CalorieTrackerModal from './components/primal/CalorieTrackerModal';

import { getApiBaseUrl } from './services/apiConfig';
const API_BASE = getApiBaseUrl();
const MODELS = [
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash', badge: 'Active' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', badge: 'Smart' },
  { id: 'claude-3.7-sonnet', name: 'Claude 3.7 Sonnet', badge: 'Thinking' }
];

export default function App() {
  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_chat_sessions');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return [{ id: 'default', title: 'Interactive AI Session', messages: [], createdAt: Date.now() }];
  });

  const [activeSessionId, setActiveSessionId] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_active_session');
      if (saved) return saved;
    } catch(e) {}
    return 'default';
  });

  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState(false);
  const [userLocation, setUserLocation] = useState({ city: 'Jübek', region: 'Schleswig-Holstein' });

  const [input, setInput] = useState('');
  const [attachedImage, setAttachedImage] = useState(null);
  const [attachedDocument, setAttachedDocument] = useState(null);
  const [previewModalImage, setPreviewModalImage] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash-lite');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isTurboOpen, setIsTurboOpen] = useState(false);

  // Aura Nutrition & Primal Modals
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [isMealVisionOpen, setIsMealVisionOpen] = useState(false);
  const [isFarmMapOpen, setIsFarmMapOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCalorieTrackerOpen, setIsCalorieTrackerOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_user_profile');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return null;
  });

  // System Monitor State
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
    } catch(e) {}
    return [
      { id: '1', title: 'Dernière Danse', artist: 'Indila', url: 'https://www.youtube.com/watch?v=K5KAc5CoCuk', addedAt: 'Heute' },
      { id: '2', title: 'Paro', artist: 'NEJ', url: 'https://www.youtube.com/watch?v=F3_6b8jZ1s4', addedAt: 'Heute' }
    ];
  });
  const [currentPlayingSong, setCurrentPlayingSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('aura_music_playlist', JSON.stringify(musicPlaylist));
    } catch(e) {}
  }, [musicPlaylist]);

  const addSongToPlaylist = (title, artist, url) => {
    setMusicPlaylist(prev => {
      // Duplikate verhindern (anhand von Titel & Interpret)
      const cleanTitle = (title || '').trim().toLowerCase();
      const cleanArtist = (artist || '').trim().toLowerCase();
      const alreadyExists = prev.some(s => 
        s.title.toLowerCase().includes(cleanTitle) || 
        cleanTitle.includes(s.title.toLowerCase())
      );
      if (alreadyExists) return prev;

      const newSong = {
        id: 'song_' + Date.now(),
        title: title || 'Song',
        artist: artist || 'YouTube',
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
    if (window.require) {
      try {
        const { ipcRenderer } = window.require('electron');
        ipcRenderer.send('open-external-url', song.url);
      } catch (e) {
        window.open(song.url, '_blank');
      }
    } else {
      window.open(song.url, '_blank');
    }
  };

  const removeSongFromPlaylist = (id, e) => {
    e.stopPropagation();
    setMusicPlaylist(prev => prev.filter(s => s.id !== id));
  };

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
  const pageDropdownRef = useRef(null);

  const recognitionRef = useRef(null);

  // System Stats Polling (alle 3 Sekunden)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/system-stats`);
        if (res.ok) {
          const data = await res.json();
          setSysStats(data);
        }
      } catch(e) {}
    };
    fetchStats();
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, []);

  // Web Speech Recognition (Spracheingabe / Diktat)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechRecognitionSupported(true);
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

      rec.onerror = (e) => {
        console.warn("Speech recognition error:", e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch(e) {
        setIsListening(false);
      }
    }
  };

  // Audio Sound-FX Generator (Futuristischer Jarvis Chime via Web Audio API)
  const playJarvisChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch(e) {}
  };

  // Electron IPC Listener für Ghost-Writer (Ctrl+Alt+G) & Screen-Snipping (Ctrl+Shift+S)
  useEffect(() => {
    if (window.require) {
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
      } catch(e) {}
    }
  }, []);

  const runGhostwriter = async (mode) => {
    if (!ghostText.trim()) return;
    setGhostLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/ghostwrite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: ghostText, mode })
      });
      const data = await res.json();
      if (data.result) {
        setGhostResult(data.result);
      }
    } catch(e) {
      console.error(e);
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
        const res = await fetch(`${API_BASE}/api/parse-document`, {
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
        }
      } catch(err) {
        console.error("Fehler beim Dokument-Upload:", err);
      }
    };
    reader.readAsDataURL(file);
  };

  const currentSession = sessions.find(s => s.id === activeSessionId) || sessions[0] || { id: 'default', title: 'Session', messages: [] };
  const messages = currentSession.messages || [];

  useEffect(() => {
    try {
      localStorage.setItem('aura_chat_sessions', JSON.stringify(sessions));
      localStorage.setItem('aura_active_session', activeSessionId);
    } catch(e) {}
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
            reader.onload = (event) => {
              setAttachedImage(event.target.result);
            };
            reader.readAsDataURL(file);
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleCopyText = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1800);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsModelDropdownOpen(false);
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
        ? [{ id: 'default', title: 'Session', messages: [], createdAt: Date.now() }]
        : filtered;
    });
    if (activeSessionId === id) {
      const rem = sessions.filter(s => s.id !== id);
      setActiveSessionId(rem[0]?.id || 'default');
    }
  };

  const fetchNotionPages = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/notion/pages`);
      const data = await res.json();
      if (data.pages) setNotionPages(data.pages);
    } catch(e) {}
  };

  const fetchNotionProducts = async (dbId) => {
    setLoadingNotion(true);
    const targetId = dbId || selectedPage.id;
    try {
      const res = await fetch(`${API_BASE}/api/notion/products?dbId=${targetId}`);
      const data = await res.json();
      if (data.products) setNotionProducts(data.products);
    } catch(e) {} finally {
      setLoadingNotion(false);
    }
  };

  useEffect(() => {
    fetchNotionPages();
    fetchNotionProducts('41c6c80d-4897-80be-9350-f279e5b77f98');
  }, []);

  const handleSend = async (customText) => {
    const textToSend = customText || input;

    // Check for Slash Command /notion
    if (textToSend.trim().toLowerCase() === '/auth' || textToSend.trim().toLowerCase() === '/login' || textToSend.trim().toLowerCase() === '/profil') {
      setIsAuthModalOpen(true);
      return;
    }

    if (textToSend.trim().toLowerCase() === '/notion') {
      setIsNotionSidebarOpen(true);
      fetchNotionPages();
      fetchNotionProducts();
      setInput('');
      return;
    }

    if ((!textToSend.trim() && !attachedImage && !attachedDocument) || loading) return;

    let enrichedText = textToSend;
    if (userProfile && userProfile.conditions) {
      enrichedText = `[PATIENTEN-KONTEXT: Gewicht: ${userProfile.weightKg}kg, Größe: ${userProfile.heightCm}cm, Schritte: ${userProfile.dailySteps}, Sport: ${userProfile.sportsHours}h/Woche, Bekannte Vorerkrankungen/Diagnosen: "${userProfile.conditions}"]\n${enrichedText}`;
    }
    if (attachedDocument) {
      enrichedText = `[DOKUMENT ANALYSIEREN: ${attachedDocument.name}]\nInhalt des Dokuments:\n"""\n${attachedDocument.content}\n"""\n\nNutzer-Anweisung: ${textToSend || 'Bitte analysiere und fasse dieses Dokument zusammen.'}`;
    }

    const imageToSend = attachedImage;
    const currentDoc = attachedDocument;
    setAttachedImage(null);
    setAttachedDocument(null);

    const userMsg = {
      role: 'user',
      text: textToSend || (currentDoc ? `📄 Dokument: ${currentDoc.name}` : 'Bild gesendet'),
      image: imageToSend,
      documentName: currentDoc ? currentDoc.name : null,
      timestamp: 'just now'
    };

    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          title: s.messages.length === 0 ? (textToSend.slice(0, 24) || 'Bild-Analyse') : s.title,
          messages: [...s.messages, userMsg]
        };
      }
      return s;
    }));

    if (!customText) setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setLoading(true);

    try {
      const activeSession = sessions.find(s => s.id === activeSessionId);
      // Volles Gedächtnis des aktuellen Chats (bis zu 40 Nachrichten für lückenlosen Kontext)
      const history = (activeSession?.messages || []).slice(-40).map(m => ({
        role: m.role,
        text: m.text
      }));

      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: enrichedText, image: imageToSend, history: history })
      });
      const data = await res.json();

      // Auto-handler for deleting songs from playlist via chat command
      if (data.reply && data.reply.includes('[ACTION:DELETE_SONG_FROM_PLAYLIST:')) {
        const match = data.reply.match(/\[ACTION:DELETE_SONG_FROM_PLAYLIST:(.*?)\]/);
        if (match && match[1]) {
          const songNameToDelete = match[1].trim().toLowerCase();
          setMusicPlaylist(prev => prev.filter(s => !s.title.toLowerCase().includes(songNameToDelete) && !s.artist.toLowerCase().includes(songNameToDelete)));
        }
      }

      let cleanReplyText = (data.reply || data.actionStatus || "Erledigt!").replace(/\[ACTION:.*?\]/g, '').trim();

      const assistantMsg = {
        role: 'assistant',
        text: cleanReplyText,
        actionStatus: data.actionStatus,
        imageUrl: data.imageUrl,
        workedTime: 'Worked for a moment',
        timestamp: 'just now'
      };

      if (data.openUrl) {
        if (window.require) {
          try {
            const { ipcRenderer } = window.require('electron');
            ipcRenderer.send('open-external-url', data.openUrl);
          } catch (e) {
            window.open(data.openUrl, '_blank');
          }
        } else {
          window.open(data.openUrl, '_blank');
        }
      }

      if (voiceEnabled && assistantMsg.text && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(assistantMsg.text.replace(/\[.*?\]/g, ''));
        utterance.lang = 'de-DE';
        utterance.rate = 1.05;
        window.speechSynthesis.speak(utterance);
      } else {
        // Sci-Fi Jarvis Chime bei fertiger Antwort
        playJarvisChime();
      }

      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: [...s.messages, assistantMsg]
          };
        }
        return s;
      }));

      if (data.actionStatus && (data.actionStatus.includes('Notion') || data.actionStatus.includes('erstellt'))) {
        setTimeout(() => {
          fetchNotionProducts();
          fetchNotionPages();
        }, 1200);
      }

      // Falls ein Song in die Musikliste aufgenommen wurde
      if (data.playlistSong) {
        addSongToPlaylist(data.playlistSong.title, data.playlistSong.artist, data.playlistSong.url);
      }
    } catch (err) {
      console.error(err);
      if (voiceEnabled && assistantMsg.text && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(assistantMsg.text.replace(/\[.*?\]/g, ''));
        utterance.lang = 'de-DE';
        utterance.rate = 1.05;
        window.speechSynthesis.speak(utterance);
      } else {
        // Sci-Fi Jarvis Chime bei fertiger Antwort
        playJarvisChime();
      }

      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: [...s.messages, {
              role: 'assistant',
              text: 'Aura Backend ist kurz nicht erreichbar.',
              timestamp: 'just now'
            }]
          };
        }
        return s;
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectedModelData = MODELS.find(m => m.id === selectedModel) || MODELS[0];
  const canSend = (input.trim().length > 0 || attachedImage !== null) && !loading;

  return (
    <div className="flex h-screen w-screen bg-[#0d0e11] text-[#e2e8f0] font-sans overflow-hidden select-none">
      {/* Linke Verlaufsleiste (wie bei Antigravity ausklappbar) */}
      {isHistorySidebarOpen && (
        <aside className="w-64 border-r border-[#1a1c23] bg-[#090a0d] flex flex-col h-full z-30 animate-in slide-in-from-left duration-150">
          <div className="p-3 border-b border-[#1a1c23] flex items-center justify-between">
            <button
              onClick={createNewChat}
              className="flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg bg-[#16181f] hover:bg-[#20232d] border border-[#232733] text-xs font-medium text-white transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              <span>New Thread</span>
            </button>
            <button
              onClick={() => setIsHistorySidebarOpen(false)}
              className="p-1.5 ml-1 rounded-md text-[#717b91] hover:text-white hover:bg-[#16181f] transition-colors"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            <span className="text-[10px] font-semibold tracking-wider text-[#4f576b] uppercase px-2 mb-1 block">Conversations</span>
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => setActiveSessionId(session.id)}
                className={`group flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-all ${
                  session.id === activeSessionId
                    ? 'bg-[#1a1d26] text-white font-medium border border-[#2b3040]'
                    : 'text-[#8c96ac] hover:bg-[#13151b] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare className="w-3.5 h-3.5 text-[#5e677c] flex-shrink-0" />
                  <span className="truncate">{session.title || 'Untitled'}</span>
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

          <div className="p-3 border-t border-[#1a1c23] flex items-center gap-2 text-[11px] text-[#717b91]">
            <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <span className="truncate">{userLocation.city}, {userLocation.region}</span>
          </div>
        </aside>
      )}

      {/* Haupt-Chat Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Header - Clean High-End Aura Look */}
        <header className="h-14 border-b border-[#171920] px-4 flex items-center justify-between z-20 bg-[#0d0e11]/95 backdrop-blur-md">
          {/* Left: App Title & Session Name */}
          <div className="flex items-center gap-2 text-xs min-w-0 shrink-0">
            {!isHistorySidebarOpen && (
              <button
                onClick={() => setIsHistorySidebarOpen(true)}
                className="p-1.5 rounded-lg text-[#717b91] hover:text-white hover:bg-[#171920] mr-1 shrink-0"
                title="Sidebar öffnen"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            )}
            <span className="text-white font-bold tracking-wider uppercase text-[11px] bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent shrink-0">
              Aura AI
            </span>
            <span className="text-[#3b4252]">/</span>
            <span className="text-[#8c96ac] font-medium truncate text-[11px] max-w-[140px]">
              {currentSession.title || 'Chat'}
            </span>
          </div>

          {/* Right: Clean, Organized Header Actions (NO HORIZONTAL SCROLLBAR) */}
          <div className="flex items-center gap-2">
            {/* 1. Nutrition & Primal Action Group */}
            <div className="flex items-center bg-[#13151b] border border-[#232733] rounded-xl p-1 gap-1 shrink-0">
              <button
                onClick={() => setIsCalorieTrackerOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-300 hover:bg-rose-500/15 transition-all"
                title="Yazio-Style Kcal & Makro Tracker"
              >
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                <span>Tracker</span>
              </button>
              <button
                onClick={() => setIsBarcodeScannerOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-300 hover:bg-amber-500/15 transition-all"
                title="Barcode & Toxicity Scanner"
              >
                <QrCode className="w-3.5 h-3.5 text-amber-400" />
                <span>Scanner</span>
              </button>
              <button
                onClick={() => setIsMealVisionOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-orange-300 hover:bg-orange-500/15 transition-all"
                title="Meal Vision (Nährstoffe & Bioverfügbarkeit)"
              >
                <Camera className="w-3.5 h-3.5 text-orange-400" />
                <span>Meal Vision</span>
              </button>
              <button
                onClick={() => setIsFarmMapOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-300 hover:bg-emerald-500/15 transition-all"
                title="Rohmilch & Bio-Läden in der Nähe"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Hof & Bio</span>
              </button>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold text-indigo-300 hover:bg-indigo-500/15 transition-all"
                title="Klinisches Profil & E-Mail-PIN"
              >
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span>{userProfile ? 'Profil' : 'Anmelden'}</span>
              </button>
            </div>

            {/* 2. System Tools (Capture / Briefing / Ghostwriter) */}
            <div className="flex items-center bg-[#13151b] border border-[#232733] rounded-xl p-1 gap-1 shrink-0">
              <button
                onClick={async () => {
                  if (window.require) {
                    try {
                      const { desktopCapturer } = window.require('electron');
                      const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 1920, height: 1080 } });
                      if (sources && sources[0]) {
                        setAttachedImage(sources[0].thumbnail.toDataURL());
                        playJarvisChime();
                      }
                    } catch(e) {}
                  }
                }}
                className="p-1.5 rounded-lg text-[#8c96ac] hover:text-cyan-300 hover:bg-[#1c202a] transition-all"
                title="Capture Screenshot (Ctrl+Shift+S)"
              >
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
              </button>
              <button
                onClick={() => handleSend('/briefing')}
                className="p-1.5 rounded-lg text-[#8c96ac] hover:text-amber-300 hover:bg-[#1c202a] transition-all"
                title="Daily Briefing (Wetter & Termine)"
              >
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              </button>
              <button
                onClick={() => {
                  setGhostWriterOpen(true);
                  setGhostResult('');
                }}
                className="p-1.5 rounded-lg text-[#8c96ac] hover:text-purple-300 hover:bg-[#1c202a] transition-all"
                title="Ghostwriter (Ctrl+Alt+G)"
              >
                <Wand2 className="w-3.5 h-3.5 text-purple-400" />
              </button>
            </div>

            {/* 3. Musikliste */}
            <button
              onClick={() => {
                setIsMusicSidebarOpen(!isMusicSidebarOpen);
                if (isNotionSidebarOpen) setIsNotionSidebarOpen(false);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all shrink-0 ${
                isMusicSidebarOpen
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  : 'bg-[#13151b] border-[#232733] text-[#8c96ac] hover:text-white hover:bg-[#1c202a]'
              }`}
              title="Musikliste / Jukebox"
            >
              <Music className="w-3.5 h-3.5 text-rose-400" />
              <span>Musik ({musicPlaylist.length})</span>
            </button>

            {/* 4. Neuer Chat */}
            <button
              onClick={createNewChat}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all shadow-md shadow-blue-500/20 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Neu</span>
            </button>
          </div>
        </header>

        {/* Chat Feed */}
        <main className="flex-1 overflow-y-auto px-4 md:px-12 py-6 flex flex-col items-center custom-scrollbar">
          <div className="w-full max-w-3xl flex-1 flex flex-col space-y-7 pb-4">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center my-auto pb-8 text-center select-none">
                <div className="w-10 h-10 rounded-full bg-[#161820] border border-[#232733] flex items-center justify-center mb-3">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                </div>
                <h1 className="text-xl font-medium text-white mb-1">
                  How can Aura assist you today?
                </h1>
                <p className="text-xs text-[#717b91] max-w-sm">
                  Ask anything, request web research, control Spotify or manage your Notion databases.
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className="flex flex-col space-y-1.5 w-full">
                  {/* Message Info Header */}
                  <div className={`flex items-center gap-2 text-[11px] text-[#5e677c] ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopyText(msg.text, idx)}
                          className="hover:text-white transition-colors"
                          title="Copy message"
                        >
                          {copiedIndex === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                        <button className="hover:text-white transition-colors"><ThumbsUp className="w-3 h-3" /></button>
                        <button className="hover:text-white transition-colors"><ThumbsDown className="w-3 h-3" /></button>
                        <span>{msg.timestamp || 'just now'}</span>
                      </div>
                    )}
                    {msg.role === 'user' && (
                      <div className="flex items-center gap-1.5">
                        <span>{msg.timestamp || 'just now'}</span>
                        <button
                          onClick={() => handleCopyText(msg.text, idx)}
                          className="hover:text-white transition-colors"
                          title="Copy message"
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
                      {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                    </div>
                  ) : (
                    <div className="self-start w-full text-sm text-[#e2e8f0] flex flex-col space-y-2.5">
                      {/* Worked for time pill */}
                      {msg.workedTime && (
                        <div className="text-[11px] text-[#717b91] font-mono flex items-center gap-1 cursor-pointer hover:text-[#94a3b8]">
                          <span>{msg.workedTime}</span>
                          <span>›</span>
                        </div>
                      )}

                      <div className="leading-relaxed whitespace-pre-wrap">
                        {msg.text}
                      </div>

                      {/* Generiertes KI Bild */}
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
                              title="Full size / Download"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Action Pill Badge (z. B. Notion / Spotify Erfolg) */}
                      {msg.actionStatus && (
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#13151b] border border-[#20232c] text-xs text-[#cbd5e1] mt-1">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                            <span>{msg.actionStatus}</span>
                          </div>
                          <span className="text-[10px] text-[#64748b] border border-[#2b3040] px-2 py-0.5 rounded">Action Done</span>
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
                  <span>Thinking & searching...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Input Bar - Exakter Antigravity Stil */}
        <footer className="p-4 md:pb-6 flex flex-col items-center bg-[#0d0e11]">
          <div className="w-full max-w-3xl rounded-2xl bg-[#13151b] border border-[#222634] p-2 flex flex-col shadow-2xl focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all">
            {/* Attachment Preview (Ctrl + V) */}
            {attachedImage && (
              <div className="relative mb-2 p-1.5 bg-[#181b24] border border-[#2a2f40] rounded-xl flex items-center justify-between w-fit max-w-xs group">
                <div className="flex items-center gap-2 overflow-hidden">
                  <img
                    src={attachedImage}
                    alt="Attached preview"
                    className="w-12 h-12 object-cover rounded-lg border border-[#384055]"
                  />
                  <div className="flex flex-col text-xs text-[#94a3b8] truncate">
                    <span className="font-medium text-white truncate">Screenshot / Bild</span>
                    <span className="text-[10px] text-[#64748b]">Aus Zwischenablage</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedImage(null)}
                  className="p-1 rounded-full bg-[#202533] text-[#94a3b8] hover:text-white hover:bg-rose-500/80 transition-colors ml-3"
                  title="Remove image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Document Attachment Preview */}
            {attachedDocument && (
              <div className="relative mb-2 p-2 bg-[#181b24] border border-[#2a2f40] rounded-xl flex items-center justify-between w-fit max-w-sm group">
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
                  title="Remove document"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Slash Command Quick Popup */}
            {showSlashMenu && (
              <div className="mb-2 p-1.5 bg-[#161922] border border-[#2b3040] rounded-xl shadow-2xl flex flex-col gap-1 w-full max-w-sm">
                <span className="text-[10px] font-semibold text-[#64748b] px-2 py-0.5 uppercase tracking-wider">Slash Actions</span>
                <button
                  type="button"
                  onClick={() => { setShowSlashMenu(false); setInput(''); setIsCalorieTrackerOpen(true); }}
                  className="flex items-center gap-2 p-1.5 rounded-lg text-xs text-[#cbd5e1] hover:bg-[#202533] hover:text-white transition-colors"
                >
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  <span className="font-medium text-white">/tracker</span>
                  <span className="text-[10px] text-[#64748b]">Yazio Kcal & Makro Tracker öffnen</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setShowSlashMenu(false); setInput(''); setIsBarcodeScannerOpen(true); }}
                  className="flex items-center gap-2 p-1.5 rounded-lg text-xs text-[#cbd5e1] hover:bg-[#202533] hover:text-white transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-medium text-white">/scanner</span>
                  <span className="text-[10px] text-[#64748b]">Barcode & Toxizitäts-Scanner</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setShowSlashMenu(false); setInput(''); setIsMealVisionOpen(true); }}
                  className="flex items-center gap-2 p-1.5 rounded-lg text-xs text-[#cbd5e1] hover:bg-[#202533] hover:text-white transition-colors"
                >
                  <Camera className="w-3.5 h-3.5 text-orange-400" />
                  <span className="font-medium text-white">/meal</span>
                  <span className="text-[10px] text-[#64748b]">Teller-Foto oder Speisekarte scannen</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setInput('/image '); setShowSlashMenu(false); textareaRef.current?.focus(); }}
                  className="flex items-center gap-2 p-1.5 rounded-lg text-xs text-[#cbd5e1] hover:bg-[#202533] hover:text-white transition-colors"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                  <span className="font-medium text-white">/image</span>
                  <span className="text-[10px] text-[#64748b]">Generiere 8K FLUX-Bilder</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setInput('/notion '); setShowSlashMenu(false); textareaRef.current?.focus(); }}
                  className="flex items-center gap-2 p-1.5 rounded-lg text-xs text-[#cbd5e1] hover:bg-[#202533] hover:text-white transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-medium text-white">/notion</span>
                  <span className="text-[10px] text-[#64748b]">Produkt in Einkaufsliste speichern</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setInput('/cal '); setShowSlashMenu(false); textareaRef.current?.focus(); }}
                  className="flex items-center gap-2 p-1.5 rounded-lg text-xs text-[#cbd5e1] hover:bg-[#202533] hover:text-white transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-medium text-white">/cal</span>
                  <span className="text-[10px] text-[#64748b]">Termin in Google Kalender eintragen</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setInput('/addsong '); setShowSlashMenu(false); textareaRef.current?.focus(); }}
                  className="flex items-center gap-2 p-1.5 rounded-lg text-xs text-[#cbd5e1] hover:bg-[#202533] hover:text-white transition-colors"
                >
                  <Music className="w-3.5 h-3.5 text-rose-400" />
                  <span className="font-medium text-white">/addsong</span>
                  <span className="text-[10px] text-[#64748b]">Song in deine Aura Musikliste speichern</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setInput('/play '); setShowSlashMenu(false); textareaRef.current?.focus(); }}
                  className="flex items-center gap-2 p-1.5 rounded-lg text-xs text-[#cbd5e1] hover:bg-[#202533] hover:text-white transition-colors"
                >
                  <Play className="w-3.5 h-3.5 text-rose-400" />
                  <span className="font-medium text-white">/play</span>
                  <span className="text-[10px] text-[#64748b]">Musik direkt im Browser abspielen</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setInput('/buy '); setShowSlashMenu(false); textareaRef.current?.focus(); }}
                  className="flex items-center gap-2 p-1.5 rounded-lg text-xs text-[#cbd5e1] hover:bg-[#202533] hover:text-white transition-colors"
                >
                  <ShoppingCart className="w-3.5 h-3.5 text-purple-400" />
                  <span className="font-medium text-white">/buy</span>
                  <span className="text-[10px] text-[#64748b]">Autonomer Web-Kauf-Agent</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setInput('/clean '); setShowSlashMenu(false); textareaRef.current?.focus(); }}
                  className="flex items-center gap-2 p-1.5 rounded-lg text-xs text-[#cbd5e1] hover:bg-[#202533] hover:text-white transition-colors"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-medium text-white">/clean</span>
                  <span className="text-[10px] text-[#64748b]">Downloads-Ordner sortieren</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setInput('/briefing'); setShowSlashMenu(false); textareaRef.current?.focus(); }}
                  className="flex items-center gap-2 p-1.5 rounded-lg text-xs text-[#cbd5e1] hover:bg-[#202533] hover:text-white transition-colors"
                >
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-medium text-white">/briefing</span>
                  <span className="text-[10px] text-[#64748b]">Tagesüberblick (Wetter & Termine)</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setInput('/summary '); setShowSlashMenu(false); textareaRef.current?.focus(); }}
                  className="flex items-center gap-2 p-1.5 rounded-lg text-xs text-[#cbd5e1] hover:bg-[#202533] hover:text-white transition-colors"
                >
                  <FileSearch className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-medium text-white">/summary</span>
                  <span className="text-[10px] text-[#64748b]">Website oder YouTube-Video zusammenfassen</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setInput('/mute '); setShowSlashMenu(false); textareaRef.current?.focus(); }}
                  className="flex items-center gap-2 p-1.5 rounded-lg text-xs text-[#cbd5e1] hover:bg-[#202533] hover:text-white transition-colors"
                >
                  <Volume1 className="w-3.5 h-3.5 text-orange-400" />
                  <span className="font-medium text-white">/mute</span>
                  <span className="text-[10px] text-[#64748b]">Windows Audio stummschalten</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setInput('/lock '); setShowSlashMenu(false); textareaRef.current?.focus(); }}
                  className="flex items-center gap-2 p-1.5 rounded-lg text-xs text-[#cbd5e1] hover:bg-[#202533] hover:text-white transition-colors"
                >
                  <Lock className="w-3.5 h-3.5 text-red-400" />
                  <span className="font-medium text-white">/lock</span>
                  <span className="text-[10px] text-[#64748b]">Windows-Bildschirm sperren</span>
                </button>
              </div>
            )}

            {/* Input Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (e.target.value.startsWith('/')) {
                  setShowSlashMenu(true);
                } else {
                  setShowSlashMenu(false);
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder={attachedImage ? "Frag etwas zu diesem Bild / Screenshot..." : "Ask anything, @ to mention, / for actions"}
              disabled={loading}
              className="w-full bg-transparent border-none outline-none resize-none text-[#e2e8f0] placeholder-[#555d71] text-sm px-2 pt-1 pb-2 custom-scrollbar min-h-[38px] max-h-[140px]"
              rows={1}
            />

            {/* Bottom Actions Row */}
            <div className="flex items-center justify-between pt-1 border-t border-[#1a1d26] px-1 text-xs">
              {/* Linke Buttons */}
              <div className="flex items-center gap-2">
                {/* Datei-Upload Input für PDF/Dokumente */}
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
                  className="p-1 rounded text-[#717b91] hover:text-white hover:bg-[#1c202a] transition-colors cursor-pointer"
                  title="PDF / Dokument hochladen"
                >
                  <FileUp className="w-3.5 h-3.5" />
                </label>

                {/* Model Selector Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded text-[#94a3b8] hover:text-white hover:bg-[#1c202a] transition-colors font-medium text-[11px]"
                  >
                    <span>{selectedModelData.name}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isModelDropdownOpen && (
                    <div className="absolute bottom-full left-0 mb-2 w-56 bg-[#13151b] border border-[#272c3d] rounded-xl shadow-2xl z-40 p-1.5 custom-scrollbar">
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
                              <span className="text-[9px] px-1.5 py-0.2 bg-blue-500/20 text-blue-400 rounded">
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

              {/* Rechte Buttons */}
              <div className="flex items-center gap-2 text-[#717b91]">
                <button className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] hover:text-white hover:bg-[#1c202a]">
                  <Gauge className="w-3 h-3 text-blue-400" />
                  <span>Turbo</span>
                  <ChevronDown className="w-2.5 h-2.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className={`p-1 rounded transition-colors ${
                    voiceEnabled ? 'text-blue-400 bg-blue-500/10' : 'text-[#717b91] hover:text-white hover:bg-[#1c202a]'
                  }`}
                  title={voiceEnabled ? "Sprachausgabe An" : "Sprachausgabe Aus"}
                >
                  {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-1 rounded transition-colors ${
                    isListening ? 'text-red-400 bg-red-500/20 animate-pulse' : 'hover:text-white hover:bg-[#1c202a]'
                  }`}
                  title={isListening ? "Spracherkennung aktiv (Klicken zum Beenden)" : "Sprechen statt Tippen (Web Speech)"}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!canSend}
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    canSend
                      ? 'bg-white text-black hover:bg-[#e2e8f0]'
                      : 'bg-[#222634] text-[#4f576b] cursor-not-allowed'
                  }`}
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Aura Musikliste / Jukebox Sidebar */}
      {isMusicSidebarOpen && (
        <aside className="w-80 border-l border-[#1a1c23] bg-[#0c0d12] flex flex-col h-full z-30 animate-in slide-in-from-right duration-150">
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

          {/* Quick Add Song Bar */}
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

          {/* Songs List */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar">
            {musicPlaylist.length === 0 ? (
              <div className="text-xs text-[#717b91] text-center py-12">
                Noch keine Songs in der Playlist.<br />
                Sag im Chat: <em>"Füge Dernière Danse in die Musikliste ein"</em>!
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

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => removeSongFromPlaylist(song.id, e)}
                      className="p-1 rounded text-[#64748b] hover:text-rose-400 hover:bg-rose-500/10"
                      title="Aus Liste entfernen"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bottom Player Status */}
          {currentPlayingSong && (
            <div className="p-3 border-t border-[#1a1c23] bg-[#090a0d] flex items-center justify-between">
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
          )}
        </aside>
      )}

      {/* Notion Sidebar (Ausklappbar rechts) */}
      {isNotionSidebarOpen && (
        <aside className="w-80 md:w-96 border-l border-[#1a1c23] bg-[#0d0e11] flex flex-col h-full z-30 animate-in slide-in-from-right duration-150">
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
                title="Refresh"
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

          {/* Page Dropdown */}
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

              {isPageDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-[#13151b] border border-[#272c3d] rounded-xl shadow-2xl z-40 p-1 custom-scrollbar">
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

          {/* Products List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {loadingNotion && notionProducts.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-xs text-[#717b91]">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading Notion items...
              </div>
            ) : notionProducts.length === 0 ? (
              <div className="text-xs text-[#717b91] text-center py-8">
                No entries found.
              </div>
            ) : (
              notionProducts.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-[#14161d] border border-[#1f232f] flex flex-col gap-1.5 hover:border-[#2f3547] transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-medium text-white leading-tight">
                      {item.name}
                    </span>
                    {item.price && (
                      <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded flex-shrink-0">
                        {item.price}
                      </span>
                    )}
                  </div>

                  {item.vorteile && (
                    <p className="text-[11px] text-[#8c96ac] line-clamp-2">
                      {item.vorteile}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-[#1a1d26] mt-1 text-[10px]">
                    <span className="text-amber-400 font-medium">
                      ⭐ {item.rating || '10 / 10'}
                    </span>
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-blue-400 hover:underline"
                      >
                        <span>Shop Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-[#4f576b]">No link</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      )}

      {/* Ghost-Writer Modal (Ctrl + Alt + G) */}
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
                <span className="text-[10px] text-[#64748b] bg-[#1a1d26] px-2 py-0.5 rounded border border-[#2b3040]">Ctrl + Alt + G</span>
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
                placeholder="Füge hier Text ein oder markiere ihn und drücke Ctrl+Alt+G..."
                className="w-full h-24 bg-[#0a0b0e] border border-[#202431] rounded-xl p-3 text-xs text-white placeholder-[#4f576b] focus:border-purple-500/50 outline-none resize-none custom-scrollbar"
              />
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => runGhostwriter('polish')}
                disabled={ghostLoading}
                className="px-3 py-1.5 rounded-lg text-xs bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition-all font-medium"
              >
                ✨ Professionell umschreiben
              </button>
              <button
                onClick={() => runGhostwriter('fix')}
                disabled={ghostLoading}
                className="px-3 py-1.5 rounded-lg text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 transition-all font-medium"
              >
                📝 Grammatik & Fehler korrigieren
              </button>
              <button
                onClick={() => runGhostwriter('translate_en')}
                disabled={ghostLoading}
                className="px-3 py-1.5 rounded-lg text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all font-medium"
              >
                🇬🇧 Ins Englische übersetzen
              </button>
              <button
                onClick={() => runGhostwriter('shorten')}
                disabled={ghostLoading}
                className="px-3 py-1.5 rounded-lg text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all font-medium"
              >
                ⚡ Kurz zusammenfassen
              </button>
            </div>

            {/* Ghostwriter Result */}
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
                    }}
                    className="text-[11px] text-[#94a3b8] hover:text-white flex items-center gap-1 bg-[#161820] px-2 py-0.5 rounded border border-[#282d3c]"
                  >
                    <Copy className="w-3 h-3 text-purple-400" /> Kopieren
                  </button>
                </div>
                <p className="text-xs text-white leading-relaxed select-text">{ghostResult}</p>
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
      />

      <BarcodeScannerModal
        isOpen={isBarcodeScannerOpen}
        onClose={() => setIsBarcodeScannerOpen(false)}
        onOpenMapWithStore={(storeName) => {
          setIsBarcodeScannerOpen(false);
          setIsFarmMapOpen(true);
        }}
        onAddToTracker={(item) => {
          try {
            const todayKey = new Date().toISOString().split('T')[0];
            const saved = localStorage.getItem(`aura_meals_${todayKey}`);
            const list = saved ? JSON.parse(saved) : [];
            list.push({
              id: Date.now().toString(),
              name: item.name,
              calories: item.calories,
              protein: item.protein,
              fat: item.fat,
              carbs: item.carbs,
              isClean: item.isClean !== false,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
            localStorage.setItem(`aura_meals_${todayKey}`, JSON.stringify(list));
            setIsBarcodeScannerOpen(false);
            setIsCalorieTrackerOpen(true);
          } catch(e) {}
        }}
      />

      <MealVisionModal
        isOpen={isMealVisionOpen}
        onClose={() => setIsMealVisionOpen(false)}
        onSaveToNotion={(mealData) => {
          // Log meal directly into Notion or Aura DB
          if (addToNotion) {
            addToNotion(`${mealData.dishName} (${mealData.estimatedMacros?.calories || ''})`, `Aura Score: ${mealData.auraScore}/100 - ${mealData.tier}`);
          }
        }}
        onAddToTracker={(mealData) => {
          try {
            const calMatch = (mealData.estimatedMacros?.calories || '').match(/(\d+)/);
            const protMatch = (mealData.estimatedMacros?.protein || '').match(/(\d+(?:\.\d+)?)/);
            const fatMatch = (mealData.estimatedMacros?.fat || '').match(/(\d+(?:\.\d+)?)/);
            const carbMatch = (mealData.estimatedMacros?.carbs || '').match(/(\d+(?:\.\d+)?)/);
            
            const todayKey = new Date().toISOString().split('T')[0];
            const saved = localStorage.getItem(`aura_meals_${todayKey}`);
            const list = saved ? JSON.parse(saved) : [];
            list.push({
              id: Date.now().toString(),
              name: mealData.dishName || 'Mahlzeit',
              calories: calMatch ? parseInt(calMatch[1], 10) : 550,
              protein: protMatch ? parseFloat(protMatch[1]) : 30,
              fat: fatMatch ? parseFloat(fatMatch[1]) : 25,
              carbs: carbMatch ? parseFloat(carbMatch[1]) : 40,
              isClean: (mealData.auraScore || 0) >= 70,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
            localStorage.setItem(`aura_meals_${todayKey}`, JSON.stringify(list));
            setIsMealVisionOpen(false);
            setIsCalorieTrackerOpen(true);
          } catch(e) {}
        }}
      />

      <FarmMapModal
        isOpen={isFarmMapOpen}
        onClose={() => setIsFarmMapOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(profile) => {
          setUserProfile(profile);
          // Trigger proactive Clinical Welcome & Metabolic Analysis directly into chat
          const introMsg = `Ich habe mich gerade registriert! Mein Profil: Gewicht ${profile.weightKg}kg, Größe ${profile.heightCm}cm, Tägliche Schritte: ${profile.dailySteps}, PAL: ${profile.pal || '1.7'}, Kalorienziel: ${profile.targetCalories || '2400'} kcal/Tag. Bekannte Vorerkrankungen/Diagnosen: "${profile.conditions || 'Keine spezifischen'}". Bitte erstelle mir sofort eine zelluläre Analyse, wie meine Ernährung und mein Alltag darauf abgestimmt werden müssen und welche präventiven Schritte ich ab heute tun muss!`;
          handleSend(introMsg);
        }}
      />
    </div>
  );
}
