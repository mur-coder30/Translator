import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowRightLeft,
  Copy,
  Check,
  Volume2,
  X,
  Upload,
  Camera,
  Sparkles,
  RotateCcw,
  Languages,
  ChevronDown,
  Search,
  Mic,
  MicOff,
  History as HistoryIcon,
  Trash2,
  ClipboardPaste
} from 'lucide-react';

interface Language {
  code: string;
  name: string;
  flag: string;
  popular?: boolean;
}

const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flag: '🇬🇧', popular: true },
  { code: 'es', name: 'Spanish', flag: '🇪🇸', popular: true },
  { code: 'fr', name: 'French', flag: '🇫🇷', popular: true },
  { code: 'de', name: 'German', flag: '🇩🇪', popular: true },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵', popular: true },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳', popular: true },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦', popular: true },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳', popular: true },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'th', name: 'Thai', flag: '🇹🇭' },
  { code: 'id', name: 'Indonesian', flag: '🇮🇩' },
  { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
  { code: 'el', name: 'Greek', flag: '🇬🇷' },
  { code: 'he', name: 'Hebrew', flag: '🇮🇱' },
  { code: 'uk', name: 'Ukrainian', flag: '🇺🇦' },
  { code: 'cs', name: 'Czech', flag: '🇨🇿' },
  { code: 'da', name: 'Danish', flag: '🇩🇰' },
  { code: 'fi', name: 'Finnish', flag: '🇫🇮' },
  { code: 'no', name: 'Norwegian', flag: '🇳🇴' },
  { code: 'ro', name: 'Romanian', flag: '🇷🇴' },
  { code: 'bn', name: 'Bengali', flag: '🇧🇩' },
  { code: 'ur', name: 'Urdu', flag: '🇵🇰' },
  { code: 'fa', name: 'Persian', flag: '🇮🇷' },
];

const SAMPLE_PHRASES = [
  'Hello! How are you doing today?',
  'Where is the nearest train station?',
  'Could you please recommend a good restaurant?',
  'Thank you very much for your kind help!',
];

interface HistoryItem {
  id: string;
  sourceText: string;
  translatedText: string;
  detectedLang: string;
  targetLang: string;
}

export default function App() {
  const [sourceText, setSourceText] = useState('');
  const [targetLang, setTargetLang] = useState('Spanish');
  const [translatedText, setTranslatedText] = useState('');
  const [detectedLang, setDetectedLang] = useState<string | null>(null);
  const [pronunciation, setPronunciation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [langSearch, setLangSearch] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Load history
  useEffect(() => {
    try {
      const saved = localStorage.getItem('simple_trans_hist');
      if (saved) setHistory(JSON.parse(saved));
    } catch {}
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Translate function
  const handleTranslate = useCallback(async (textToTranslate?: string, imgData?: string) => {
    const text = textToTranslate !== undefined ? textToTranslate : sourceText;
    const img = imgData !== undefined ? imgData : imagePreview;

    if (!text.trim() && !img) {
      setTranslatedText('');
      setDetectedLang(null);
      setPronunciation(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'natural',
          text: text.trim() || undefined,
          image: img ? { data: img, mimeType: 'image/jpeg' } : undefined,
          targetLanguage: targetLang,
        }),
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const res = await response.json();
      const data = res.data;

      setTranslatedText(data.translatedText || '');
      setDetectedLang(data.detectedLanguage || 'Auto-detected');
      setPronunciation(data.pronunciation || null);

      if (data.translatedText && (text.trim() || img)) {
        const item: HistoryItem = {
          id: Date.now().toString(),
          sourceText: text.trim() || 'Photo translation',
          translatedText: data.translatedText,
          detectedLang: data.detectedLanguage || 'Detected',
          targetLang,
        };
        setHistory((prev) => {
          const next = [item, ...prev.slice(0, 19)];
          try {
            localStorage.setItem('simple_trans_hist', JSON.stringify(next));
          } catch {}
          return next;
        });
      }
    } catch (err: any) {
      setError('Unable to translate. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [sourceText, imagePreview, targetLang]);

  // Swap source and target
  const handleSwap = () => {
    if (detectedLang && translatedText) {
      const newSource = translatedText;
      const newTarget = detectedLang;
      setSourceText(newSource);
      setTargetLang(newTarget);
      setTranslatedText(sourceText);
      setDetectedLang(targetLang);
      setPronunciation(null);
    }
  };

  // Copy to clipboard
  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Paste from clipboard
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setSourceText(text);
      }
    } catch {}
  };

  // Text-To-Speech Pronunciation
  const handlePlayAudio = async (text: string) => {
    if (!text) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setIsPlayingAudio(true);

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.slice(0, 200) }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.audioData) {
          const audio = new Audio(json.audioData);
          audioRef.current = audio;
          audio.onended = () => setIsPlayingAudio(false);
          audio.onerror = () => fallbackSpeech(text);
          await audio.play();
          return;
        }
      }
      fallbackSpeech(text);
    } catch {
      fallbackSpeech(text);
    }
  };

  const fallbackSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.onend = () => setIsPlayingAudio(false);
      u.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(u);
    } else {
      setIsPlayingAudio(false);
    }
  };

  // Voice speech input
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Voice input is not supported in this browser.');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const r = new SpeechRecognition();
      r.continuous = false;
      r.interimResults = true;
      r.onstart = () => setIsRecording(true);
      r.onresult = (e: any) => {
        const transcript = Array.from(e.results)
          .map((res: any) => res[0].transcript)
          .join('');
        setSourceText(transcript);
      };
      r.onerror = () => setIsRecording(false);
      r.onend = () => setIsRecording(false);
      r.start();
    } catch {
      setIsRecording(false);
    }
  };

  // File / Image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setImagePreview(base64);
        handleTranslate(sourceText, base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredLanguages = LANGUAGES.filter((l) =>
    l.name.toLowerCase().includes(langSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Languages className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base text-white tracking-tight flex items-center gap-2">
                Simple Translator
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory((p) => !p)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                showHistory
                  ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
              }`}
            >
              <HistoryIcon className="w-3.5 h-3.5" />
              <span>History</span>
              {history.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                  {history.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 sm:py-8 space-y-4">
        {/* Language Selection Header Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2 shadow-lg">
          {/* Source Side Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 text-xs font-medium text-slate-300 border border-slate-800/80">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>
              {detectedLang ? (
                <span className="text-emerald-400 font-semibold">Detected {detectedLang}</span>
              ) : (
                <span className="text-slate-400">Auto-Detect Language</span>
              )}
            </span>
          </div>

          {/* Swap Button */}
          <button
            onClick={handleSwap}
            disabled={!translatedText || !detectedLang}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Swap Languages"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>

          {/* Target Language Selector */}
          <div className="flex items-center gap-1.5 relative" ref={langDropdownRef}>
            {/* Quick Chips for Top Languages */}
            <div className="hidden md:flex items-center gap-1">
              {LANGUAGES.filter((l) => l.popular).slice(0, 4).map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setTargetLang(l.name);
                    if (sourceText || imagePreview) handleTranslate(sourceText);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    targetLang === l.name
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {l.name}
                </button>
              ))}
            </div>

            {/* Dropdown Button */}
            <button
              onClick={() => setIsLangDropdownOpen((p) => !p)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-indigo-300 hover:text-white transition-colors"
            >
              <span>{targetLang}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {/* Dropdown Menu */}
            {isLangDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-2xl z-50 flex flex-col max-h-72">
                <div className="p-1 mb-1.5">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search language..."
                      value={langSearch}
                      onChange={(e) => setLangSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="overflow-y-auto space-y-0.5 flex-1 pr-1">
                  {filteredLanguages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setTargetLang(l.name);
                        setIsLangDropdownOpen(false);
                        setLangSearch('');
                        if (sourceText || imagePreview) handleTranslate(sourceText);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-medium flex items-center justify-between transition-colors ${
                        targetLang === l.name
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{l.flag}</span>
                        <span>{l.name}</span>
                      </div>
                      {targetLang === l.name && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Translation Panels: Left (Source) & Right (Target) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Source Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col min-h-[300px] shadow-xl">
            {/* Image Preview if uploaded */}
            {imagePreview && (
              <div className="relative mb-3 rounded-xl overflow-hidden border border-slate-800 max-h-40 bg-black flex items-center justify-center">
                <img src={imagePreview} alt="Attached" className="max-h-40 object-contain" />
                <button
                  onClick={() => setImagePreview(null)}
                  className="absolute top-2 right-2 p-1 rounded-lg bg-slate-950/80 hover:bg-rose-900 text-slate-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Input Textarea */}
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  handleTranslate();
                }
              }}
              placeholder="Type, paste, or upload text to translate..."
              className="flex-1 w-full bg-transparent resize-none focus:outline-none text-slate-100 placeholder-slate-500 text-sm sm:text-base leading-relaxed"
            />

            {/* Source Tools Bar */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePaste}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  title="Paste from clipboard"
                >
                  <ClipboardPaste className="w-4 h-4" />
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
                  title="Upload photo / sign / document"
                >
                  <Upload className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isRecording
                      ? 'text-rose-400 bg-rose-500/20 animate-pulse'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title={isRecording ? 'Listening...' : 'Voice Dictation'}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {sourceText && (
                  <button
                    onClick={() => {
                      setSourceText('');
                      setImagePreview(null);
                      setTranslatedText('');
                      setDetectedLang(null);
                    }}
                    className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    title="Clear"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">{sourceText.length} chars</span>
                <button
                  onClick={() => handleTranslate()}
                  disabled={isLoading || (!sourceText.trim() && !imagePreview)}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Translate</span>
                </button>
              </div>
            </div>
          </div>

          {/* Target Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col min-h-[300px] shadow-xl relative">
            {/* Output Display */}
            <div className="flex-1 overflow-y-auto space-y-3">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 py-16 space-y-2">
                  <div className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                  <p className="text-xs">Translating into {targetLang}...</p>
                </div>
              ) : error ? (
                <div className="h-full flex flex-col items-center justify-center text-rose-400 py-16 text-center text-xs">
                  <p>{error}</p>
                </div>
              ) : translatedText ? (
                <div className="space-y-3">
                  <p className="text-slate-100 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-medium">
                    {translatedText}
                  </p>

                  {pronunciation && (
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-400 italic">
                      <span className="text-[10px] uppercase font-semibold text-indigo-400 not-italic block mb-0.5">
                        Phonetics
                      </span>
                      {pronunciation}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 py-16 text-center text-xs">
                  <Languages className="w-6 h-6 mb-2 opacity-30" />
                  <p>Translation will appear here</p>
                </div>
              )}
            </div>

            {/* Target Tools Bar */}
            {translatedText && (
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handlePlayAudio(translatedText)}
                    disabled={isPlayingAudio}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
                    title="Listen to pronunciation"
                  >
                    <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'text-indigo-400 animate-pulse' : ''}`} />
                    <span className="text-[11px] hidden sm:inline">Listen</span>
                  </button>

                  <button
                    onClick={() => handleCopy(translatedText)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
                    title="Copy translation"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span className="text-[11px] hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <span className="text-[11px] text-slate-500">{targetLang}</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Sample Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs text-slate-400">
          <span className="shrink-0 text-slate-500 font-medium">Try:</span>
          {SAMPLE_PHRASES.map((phrase, i) => (
            <button
              key={i}
              onClick={() => {
                setSourceText(phrase);
                handleTranslate(phrase);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors shrink-0"
            >
              {phrase}
            </button>
          ))}
        </div>
      </main>

      {/* History Drawer */}
      {showHistory && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-sm h-full bg-slate-900 border-l border-slate-800 p-5 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <HistoryIcon className="w-4 h-4 text-indigo-400" />
                <span className="font-semibold text-white text-sm">Recent Translations</span>
              </div>
              <div className="flex items-center gap-1">
                {history.length > 0 && (
                  <button
                    onClick={() => {
                      setHistory([]);
                      localStorage.removeItem('simple_trans_hist');
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                    title="Clear history"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {history.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-center text-slate-500 text-xs">
                  <HistoryIcon className="w-7 h-7 mb-2 opacity-30" />
                  <p>No recent translations.</p>
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSourceText(item.sourceText);
                      setTranslatedText(item.translatedText);
                      setTargetLang(item.targetLang);
                      setDetectedLang(item.detectedLang);
                      setShowHistory(false);
                    }}
                    className="p-3 bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 rounded-xl cursor-pointer text-left group transition-all"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span>{item.detectedLang}</span>
                      <span className="text-indigo-400">➔ {item.targetLang}</span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium line-clamp-1">{item.sourceText}</p>
                    <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{item.translatedText}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
