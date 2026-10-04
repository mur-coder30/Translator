import React, { useState, useEffect, useRef } from 'react';
import { NATURAL_LANGUAGES } from '../data/languages';
import { NATURAL_PRESETS, NaturalPreset } from '../data/samplePresets';
import { NaturalTranslationResult, LanguageItem } from '../types/translation';
import { CameraCaptureModal } from './CameraCaptureModal';
import {
  Sparkles,
  Camera,
  Upload,
  Volume2,
  Copy,
  Check,
  RotateCcw,
  ArrowRightLeft,
  X,
  Languages,
  Mic,
  MicOff,
  Image as ImageIcon,
  ChevronDown,
  Search,
  BookOpen,
  Info,
  CheckCheck
} from 'lucide-react';

interface NaturalTranslatorProps {
  onSaveHistory: (
    sourceText: string,
    detectedLang: string,
    targetLang: string,
    translatedText: string,
    imageUrl?: string
  ) => void;
  initialState?: {
    sourceText: string;
    targetLang: string;
    translatedText?: string;
  } | null;
}

export const NaturalTranslator: React.FC<NaturalTranslatorProps> = ({
  onSaveHistory,
  initialState,
}) => {
  const [inputText, setInputText] = useState('');
  const [targetLang, setTargetLang] = useState('English');
  const [detectedLang, setDetectedLang] = useState<string | null>(null);
  const [detectedCode, setDetectedCode] = useState<string | null>(null);
  const [detectedScript, setDetectedScript] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<{
    data: string;
    mimeType: string;
    previewUrl: string;
    name?: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NaturalTranslationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Modals & Panels
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [langSearch, setLangSearch] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Restore from history if triggered
  useEffect(() => {
    if (initialState) {
      setInputText(initialState.sourceText);
      setTargetLang(initialState.targetLang);
      if (initialState.translatedText) {
        setResult({
          detectedLanguage: 'Auto-detected',
          detectedLanguageCode: 'auto',
          originalText: initialState.sourceText,
          translatedText: initialState.translatedText,
        });
      }
    }
  }, [initialState]);

  // Handle Clipboard Image Paste
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          processImageFile(file);
          e.preventDefault();
          break;
        }
      }
    }
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, WEBP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setSelectedImage({
        data: base64,
        mimeType: file.type,
        previewUrl: base64,
        name: file.name,
      });
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleCameraSnapshot = (base64: string) => {
    setSelectedImage({
      data: base64,
      mimeType: 'image/jpeg',
      previewUrl: base64,
      name: 'camera_capture.jpg',
    });
    setError(null);
  };

  // Web Speech recognition for voice input
  const toggleSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition is not supported in this browser. You can type or upload a photo.');
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('');
        setInputText(transcript);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch (err) {
      setIsRecording(false);
    }
  };

  // Perform translation
  const handleTranslate = async () => {
    if (!inputText.trim() && !selectedImage) {
      setError('Please enter text or upload/capture a photo to translate.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAudioError(null);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'natural',
          text: inputText.trim() || undefined,
          image: selectedImage
            ? { data: selectedImage.data, mimeType: selectedImage.mimeType }
            : undefined,
          targetLanguage: targetLang,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Translation request failed.');
      }

      const resData = await response.json();
      const translationData: NaturalTranslationResult = resData.data;

      setResult(translationData);
      setDetectedLang(translationData.detectedLanguage);
      setDetectedCode(translationData.detectedLanguageCode);
      setDetectedScript(translationData.detectedScript || null);

      // Save to history
      onSaveHistory(
        inputText.trim() || translationData.originalText || 'Photo translation',
        translationData.detectedLanguage,
        targetLang,
        translationData.translatedText,
        selectedImage?.previewUrl
      );
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to complete translation.');
    } finally {
      setIsLoading(false);
    }
  };

  // Copy translated text
  const handleCopy = () => {
    if (!result?.translatedText) return;
    navigator.clipboard.writeText(result.translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Audio Pronunciation using Gemini TTS with SpeechSynthesis fallback
  const handlePlayAudio = async (textToPlay: string) => {
    if (!textToPlay) return;

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    setIsPlayingAudio(true);
    setAudioError(null);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToPlay }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.audioData) {
          const audio = new Audio(data.audioData);
          currentAudioRef.current = audio;
          audio.onended = () => setIsPlayingAudio(false);
          audio.onerror = () => fallbackBrowserSpeech(textToPlay);
          await audio.play();
          return;
        }
      }
      fallbackBrowserSpeech(textToPlay);
    } catch (err) {
      fallbackBrowserSpeech(textToPlay);
    }
  };

  const fallbackBrowserSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => {
        setIsPlayingAudio(false);
        setAudioError('Audio playback unavailable.');
      };
      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlayingAudio(false);
      setAudioError('Text-to-speech not supported on this device.');
    }
  };

  // Swap target and source if detected language is known
  const handleSwap = () => {
    if (detectedLang && result?.translatedText) {
      const newTarget = detectedLang;
      setInputText(result.translatedText);
      setTargetLang(newTarget);
      setResult(null);
      setDetectedLang(null);
    }
  };

  const handleSelectPreset = (preset: NaturalPreset) => {
    setInputText(preset.text);
    setTargetLang(preset.targetLanguage);
    setSelectedImage(null);
    setResult(null);
  };

  const popularLanguages = NATURAL_LANGUAGES.filter((l) => l.popular);

  const filteredLanguages = NATURAL_LANGUAGES.filter((l) =>
    l.name.toLowerCase().includes(langSearch.toLowerCase()) ||
    (l.nativeName && l.nativeName.toLowerCase().includes(langSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Sample Presets Quick Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs text-slate-400">
        <span className="flex items-center gap-1.5 font-medium text-slate-300 shrink-0">
          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          Try Samples:
        </span>
        {NATURAL_PRESETS.map((preset, idx) => (
          <button
            key={idx}
            onClick={() => handleSelectPreset(preset)}
            className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800/80 transition-all shrink-0 flex items-center gap-1.5"
          >
            <span>{preset.title}</span>
            <span className="text-[10px] text-indigo-400">➔ {preset.targetLanguage}</span>
          </button>
        ))}
      </div>

      {/* Target Language Selection Header Bar */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Auto Detect Label on Source Side */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-300 w-full md:w-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>Source:</span>
            {detectedLang ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                Detected {detectedLang}
                {detectedCode && <span className="text-[10px] text-emerald-500 uppercase">({detectedCode})</span>}
              </span>
            ) : (
              <span className="text-slate-400">Auto-Detect Language</span>
            )}
          </div>

          {detectedLang && result?.translatedText && (
            <button
              onClick={handleSwap}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Swap languages"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Target Language Selector */}
        <div className="flex items-center flex-wrap gap-1.5 w-full md:w-auto justify-end">
          <span className="text-xs text-slate-400 mr-1 hidden sm:inline">Translate into:</span>
          {popularLanguages.slice(0, 5).map((lang) => (
            <button
              key={lang.code}
              onClick={() => setTargetLang(lang.name)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                targetLang.toLowerCase() === lang.name.toLowerCase()
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 border border-indigo-500/30'
                  : 'bg-slate-950/60 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          ))}

          {/* More Languages Dropdown Button */}
          <button
            onClick={() => setIsLangModalOpen(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-950 hover:bg-slate-800 text-indigo-300 hover:text-white border border-slate-800 flex items-center gap-1.5 transition-all"
          >
            <span>More ({targetLang})</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Translation Grid: Source & Target */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Source Box */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col min-h-[380px] shadow-xl">
          {/* Top Bar inside Source */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 mb-3 text-xs text-slate-400">
            <span className="font-medium text-slate-300">Input Text or Photo</span>
            <div className="flex items-center gap-2">
              {inputText && (
                <button
                  onClick={() => {
                    setInputText('');
                    setSelectedImage(null);
                    setResult(null);
                    setDetectedLang(null);
                  }}
                  className="hover:text-white transition-colors"
                >
                  Clear
                </button>
              )}
              <span>{inputText.length} characters</span>
            </div>
          </div>

          {/* Image Preview if uploaded/captured */}
          {selectedImage && (
            <div className="mb-3 relative rounded-xl overflow-hidden border border-slate-700/80 bg-black/40 group max-h-48 flex items-center justify-center">
              <img
                src={selectedImage.previewUrl}
                alt="Uploaded"
                className="max-h-48 w-auto object-contain rounded-lg"
              />
              <div className="absolute top-2 right-2 flex items-center gap-1">
                <button
                  onClick={() => setSelectedImage(null)}
                  className="p-1 bg-slate-950/80 hover:bg-rose-900/80 text-slate-300 hover:text-rose-200 rounded-lg transition-colors backdrop-blur-sm"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="absolute bottom-2 left-2 text-[10px] bg-slate-950/80 text-emerald-400 px-2 py-0.5 rounded backdrop-blur-sm flex items-center gap-1">
                <Check className="w-3 h-3" /> Photo attached for OCR translation
              </div>
            </div>
          )}

          {/* Text Area */}
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                handleTranslate();
              }
            }}
            placeholder={
              selectedImage
                ? "Image attached! You can optionally type extra context or notes here, or press 'Translate' to extract & translate text..."
                : "Type or paste text to translate... Or drop/paste a photo here (signs, menus, documents, screenshots)..."
            }
            className="flex-1 w-full bg-transparent resize-none focus:outline-none text-slate-100 placeholder-slate-500 text-sm leading-relaxed"
          />

          {/* Source Bottom Tools */}
          <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              {/* Camera Button */}
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition-colors"
                title="Take photo with camera"
              >
                <Camera className="w-3.5 h-3.5 text-indigo-400" />
                <span>Take Photo</span>
              </button>

              {/* Upload Image Button */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition-colors"
                title="Upload image file"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-400" />
                <span>Upload Photo</span>
              </button>

              {/* Voice Speech Dictation */}
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`p-2 rounded-xl border text-xs transition-colors ${
                  isRecording
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-800'
                }`}
                title={isRecording ? 'Listening...' : 'Voice dictation'}
              >
                {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>
            </div>

            <button
              onClick={handleTranslate}
              disabled={isLoading || (!inputText.trim() && !selectedImage)}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Translating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Translate</span>
                  <span className="text-[10px] opacity-70 ml-1 hidden sm:inline">Ctrl+↵</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Target Translation Output Box */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col min-h-[380px] shadow-xl relative">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 mb-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-indigo-300">{targetLang}</span>
              {detectedScript && (
                <span className="text-[10px] text-slate-500">· {detectedScript} script</span>
              )}
            </div>

            {result && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePlayAudio(result.translatedText)}
                  disabled={isPlayingAudio}
                  className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
                  title="Pronounce translation"
                >
                  <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'text-indigo-400 animate-bounce' : ''}`} />
                  <span className="text-[11px] hidden sm:inline">
                    {isPlayingAudio ? 'Playing...' : 'Listen'}
                  </span>
                </button>

                <button
                  onClick={handleCopy}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <CheckCheck className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span className="text-[11px] hidden sm:inline">
                    {copied ? 'Copied' : 'Copy'}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Translation Content */}
          <div className="flex-1 overflow-y-auto space-y-4">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3 py-16">
                <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-xs font-medium text-slate-300">
                  Detecting language and translating into {targetLang}...
                </p>
                <p className="text-[11px] text-slate-500">Analyzing nuances and native phrasing</p>
              </div>
            ) : error ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center text-rose-400">
                <Info className="w-8 h-8 mb-2 opacity-80" />
                <p className="text-sm font-medium">{error}</p>
                <button
                  onClick={handleTranslate}
                  className="mt-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-lg"
                >
                  Try Again
                </button>
              </div>
            ) : result ? (
              <div className="space-y-4">
                {/* Main Translated Text */}
                <div className="text-slate-100 text-base leading-relaxed whitespace-pre-wrap font-medium">
                  {result.translatedText}
                </div>

                {/* Pronunciation / Romanization if provided */}
                {result.pronunciation && (
                  <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1">
                    <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">
                      Phonetics / Romanization
                    </span>
                    <p className="text-xs text-slate-300 italic font-mono">
                      {result.pronunciation}
                    </p>
                  </div>
                )}

                {/* Alternative Translations */}
                {result.alternativeTranslations && result.alternativeTranslations.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/50 space-y-2">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Alternative Variations:
                    </span>
                    <div className="space-y-1.5">
                      {result.alternativeTranslations.map((alt, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setResult({
                              ...result,
                              translatedText: alt.text,
                            });
                          }}
                          className="p-2 bg-slate-950/50 hover:bg-slate-800/60 border border-slate-800/60 rounded-lg text-xs text-slate-300 cursor-pointer flex items-center justify-between group transition-colors"
                        >
                          <span>{alt.text}</span>
                          <span className="text-[10px] text-slate-500 group-hover:text-indigo-400">
                            {alt.context}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cultural / Grammatical Notes */}
                {result.notes && (
                  <div className="p-3 bg-indigo-950/20 border border-indigo-900/30 rounded-xl text-xs text-indigo-200/90 flex items-start gap-2">
                    <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span>{result.notes}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 py-16 text-center">
                <Languages className="w-8 h-8 stroke-1 mb-2 opacity-40 text-slate-400" />
                <p className="text-sm text-slate-400">Translation will appear here</p>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Language is automatically detected from your text or photo input.
                </p>
              </div>
            )}
          </div>

          {/* Audio error toast if needed */}
          {audioError && (
            <div className="text-[11px] text-amber-400 mt-2 text-right">
              {audioError}
            </div>
          )}
        </div>
      </div>

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraSnapshot}
      />

      {/* All Languages Search Modal */}
      {isLangModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Languages className="w-5 h-5 text-indigo-400" />
                <h3 className="font-semibold text-white">Choose Target Language</h3>
              </div>
              <button
                onClick={() => setIsLangModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 border-b border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search 40+ world languages..."
                  value={langSearch}
                  onChange={(e) => setLangSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {filteredLanguages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setTargetLang(l.name);
                    setIsLangModalOpen(false);
                    setLangSearch('');
                  }}
                  className={`p-2.5 rounded-xl text-left text-xs font-medium flex items-center justify-between transition-colors ${
                    targetLang.toLowerCase() === l.name.toLowerCase()
                      ? 'bg-indigo-600 text-white'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{l.flag || '🌐'}</span>
                    <div>
                      <p className="font-semibold">{l.name}</p>
                      {l.nativeName && (
                        <p className="text-[10px] text-slate-400 opacity-80">{l.nativeName}</p>
                      )}
                    </div>
                  </div>
                  {targetLang.toLowerCase() === l.name.toLowerCase() && (
                    <Check className="w-4 h-4" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
