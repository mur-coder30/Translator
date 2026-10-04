import React, { useState, useEffect, useRef } from 'react';
import { COMPUTER_LANGUAGES } from '../data/languages';
import { CODE_PRESETS, CodePreset } from '../data/samplePresets';
import { CodeTranslationResult, ComputerLanguageItem } from '../types/translation';
import { CameraCaptureModal } from './CameraCaptureModal';
import {
  Binary,
  Code2,
  Sparkles,
  Camera,
  Upload,
  Copy,
  Check,
  Download,
  Terminal,
  Cpu,
  Layers,
  CheckCheck,
  Info,
  X,
  BookOpen,
  ArrowRight,
  Eye,
  FileCode,
  Flame
} from 'lucide-react';

interface CodeTranslatorProps {
  onSaveHistory: (
    sourceCode: string,
    detectedLang: string,
    targetLang: string,
    translatedCode: string,
    imageUrl?: string
  ) => void;
  initialState?: {
    sourceText: string;
    targetLang: string;
    translatedText?: string;
  } | null;
}

export const CodeTranslator: React.FC<CodeTranslatorProps> = ({
  onSaveHistory,
  initialState,
}) => {
  const [sourceCode, setSourceCode] = useState('');
  const [targetLang, setTargetLang] = useState('Binary (Machine 0s & 1s)');
  const [detectedLang, setDetectedLang] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<{
    data: string;
    mimeType: string;
    previewUrl: string;
    name?: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CodeTranslationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [binaryViewMode, setBinaryViewMode] = useState<'annotated' | 'raw_bits' | 'hex'>('annotated');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Restore from history if triggered
  useEffect(() => {
    if (initialState) {
      setSourceCode(initialState.sourceText);
      setTargetLang(initialState.targetLang);
      if (initialState.translatedText) {
        setResult({
          detectedLanguage: 'Auto-detected Code',
          originalCode: initialState.sourceText,
          translatedCode: initialState.translatedText,
        });
      }
    } else if (!sourceCode) {
      // Default to the first classic preset: C++ to Binary
      setSourceCode(CODE_PRESETS[0].code);
      setTargetLang(CODE_PRESETS[0].targetLang);
    }
  }, [initialState]);

  // Support Tab indentation inside the code editor
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleTranslateCode();
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const val = e.currentTarget.value;
      const newVal = val.substring(0, start) + '    ' + val.substring(end);
      setSourceCode(newVal);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file of code (PNG, JPG, WEBP).');
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
      name: 'whiteboard_code.jpg',
    });
    setError(null);
  };

  const handleTranslateCode = async () => {
    if (!sourceCode.trim() && !selectedImage) {
      setError('Please provide code in the editor or upload a photo of code.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'code',
          text: sourceCode.trim() || undefined,
          image: selectedImage
            ? { data: selectedImage.data, mimeType: selectedImage.mimeType }
            : undefined,
          targetLanguage: targetLang,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Code translation failed.');
      }

      const resData = await response.json();
      const codeResult: CodeTranslationResult = resData.data;

      setResult(codeResult);
      setDetectedLang(codeResult.detectedLanguage);

      onSaveHistory(
        sourceCode.trim() || codeResult.originalCode || 'Photo code translation',
        codeResult.detectedLanguage,
        targetLang,
        codeResult.translatedCode,
        selectedImage?.previewUrl
      );
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to translate code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!result?.translatedCode) return;
    navigator.clipboard.writeText(result.translatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    if (!result?.translatedCode) return;
    const currentLangObj = COMPUTER_LANGUAGES.find((l) => l.name === targetLang);
    const ext = currentLangObj?.extension || 'txt';
    const blob = new Blob([result.translatedCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translated_output.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSelectPreset = (preset: CodePreset) => {
    setSourceCode(preset.code);
    setTargetLang(preset.targetLang);
    setSelectedImage(null);
    setResult(null);
  };

  const isBinaryTarget =
    targetLang.toLowerCase().includes('binary') || targetLang.toLowerCase().includes('0s & 1s');
  const isHexTarget = targetLang.toLowerCase().includes('hex');

  // Compute line numbers for editor
  const lineCount = Math.max(1, sourceCode.split('\n').length);
  const resultLineCount = result ? result.translatedCode.split('\n').length : 0;

  return (
    <div className="space-y-6">
      {/* Sample Presets Quick Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs text-slate-400">
        <span className="flex items-center gap-1.5 font-medium text-slate-300 shrink-0">
          <BookOpen className="w-3.5 h-3.5 text-purple-400" />
          Code Presets:
        </span>
        {CODE_PRESETS.map((preset, idx) => (
          <button
            key={idx}
            onClick={() => handleSelectPreset(preset)}
            className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800/80 transition-all shrink-0 flex items-center gap-1.5"
          >
            <span className="font-semibold text-slate-200">{preset.title}</span>
            <span className="text-[10px] text-purple-400">➔ {preset.targetLang.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Target Computer Language Selector Bar */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Source Language Auto Detection */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-300 w-full md:w-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>Source Code:</span>
            {detectedLang ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                Detected {detectedLang}
              </span>
            ) : (
              <span className="text-slate-400">Auto-Detecting Language</span>
            )}
          </div>
        </div>

        {/* Target Computer Language Selector */}
        <div className="flex items-center flex-wrap gap-1.5 w-full md:w-auto justify-end">
          <span className="text-xs text-slate-400 mr-1 hidden sm:inline">Translate into:</span>

          {COMPUTER_LANGUAGES.map((lang) => {
            const isSelected = targetLang === lang.name;
            const isBinary = lang.id === 'binary';
            return (
              <button
                key={lang.id}
                onClick={() => setTargetLang(lang.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? isBinary
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/25 border border-emerald-500/40'
                      : 'bg-purple-600 text-white shadow-md shadow-purple-600/25 border border-purple-500/30'
                    : 'bg-slate-950/60 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-black/40 text-slate-300">
                  {lang.badge}
                </span>
                <span>{lang.name.split(' (')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Editor & Translated Result Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Source Code Box */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col min-h-[460px] shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 mb-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-purple-400" />
              <span className="font-semibold text-slate-300">Source Code / Whiteboard</span>
            </div>
            <div className="flex items-center gap-3">
              {sourceCode && (
                <button
                  onClick={() => {
                    setSourceCode('');
                    setSelectedImage(null);
                    setResult(null);
                    setDetectedLang(null);
                  }}
                  className="hover:text-white transition-colors"
                >
                  Clear
                </button>
              )}
              <span className="font-mono text-[11px]">{lineCount} lines</span>
            </div>
          </div>

          {/* Photo attached preview */}
          {selectedImage && (
            <div className="mb-3 relative rounded-xl overflow-hidden border border-slate-700 bg-black/40 max-h-40 flex items-center justify-center">
              <img
                src={selectedImage.previewUrl}
                alt="Code snapshot"
                className="max-h-40 w-auto object-contain rounded-lg"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-2 right-2 p-1 bg-slate-950/80 hover:bg-rose-900 text-slate-300 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-2 text-[10px] bg-slate-950/90 text-purple-300 px-2 py-0.5 rounded backdrop-blur-sm flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" /> Code photo attached for OCR
              </div>
            </div>
          )}

          {/* Monaco-style Monospace Editor with Line Numbers */}
          <div className="flex-1 flex overflow-hidden rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs">
            {/* Line number gutter */}
            <div className="py-3 px-2 text-right text-slate-600 select-none bg-slate-950/80 border-r border-slate-900 shrink-0 min-w-8">
              {Array.from({ length: Math.min(lineCount, 150) }).map((_, i) => (
                <div key={i} className="leading-5">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={sourceCode}
              onChange={(e) => setSourceCode(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                selectedImage
                  ? "Code photo attached! Press 'Translate Code' to parse and convert into machine bits or another language..."
                  : "Type, paste, or photograph C++, Python, Rust, Assembly, or any code snippet...\n\nExample:\nint main() {\n    printf(\"Hello, Machine!\\n\");\n    return 0;\n}"
              }
              className="flex-1 p-3 bg-transparent resize-none focus:outline-none text-slate-200 placeholder-slate-600 leading-5 whitespace-pre font-mono"
              spellCheck={false}
            />
          </div>

          {/* Bottom Bar: Photo OCR & Submit */}
          <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between flex-wrap gap-2 mt-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition-colors"
                title="Photograph code from whiteboard/book"
              >
                <Camera className="w-3.5 h-3.5 text-purple-400" />
                <span>Snap Whiteboard</span>
              </button>

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
                title="Upload screenshot of code"
              >
                <Upload className="w-3.5 h-3.5 text-purple-400" />
                <span>Upload Screenshot</span>
              </button>
            </div>

            <button
              onClick={handleTranslateCode}
              disabled={isLoading || (!sourceCode.trim() && !selectedImage)}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Translating Code...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Translate to {targetLang.split(' ')[0]}</span>
                  <span className="text-[10px] opacity-70 ml-1 hidden sm:inline">Ctrl+↵</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Translated Code & Machine View Box */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col min-h-[460px] shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 mb-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-purple-300">{targetLang}</span>
              {isBinaryTarget && (
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px]">
                  0101 Machine Stream
                </span>
              )}
            </div>

            {result && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleDownloadFile}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
                  title="Download file"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-[11px] hidden sm:inline">Export</span>
                </button>

                <button
                  onClick={handleCopyCode}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
                  title="Copy code"
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

          {/* Special Toggle for Binary targets */}
          {result && (isBinaryTarget || isHexTarget) && (
            <div className="mb-3 flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
              <button
                onClick={() => setBinaryViewMode('annotated')}
                className={`flex-1 py-1 text-center rounded-lg font-medium transition-colors ${
                  binaryViewMode === 'annotated'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Annotated Code & Comments
              </button>
              <button
                onClick={() => setBinaryViewMode('raw_bits')}
                className={`flex-1 py-1 text-center rounded-lg font-medium transition-colors ${
                  binaryViewMode === 'raw_bits'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Binary Bitstream (0s & 1s)
              </button>
              <button
                onClick={() => setBinaryViewMode('hex')}
                className={`flex-1 py-1 text-center rounded-lg font-medium transition-colors ${
                  binaryViewMode === 'hex'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Hex Memory Dump
              </button>
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 flex flex-col overflow-y-auto space-y-4">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3 py-20">
                <div className="w-8 h-8 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                <p className="text-xs font-medium text-slate-300">
                  Parsing abstract syntax tree and synthesizing {targetLang}...
                </p>
                <p className="text-[11px] text-slate-500">
                  Translating memory allocation, pointer structures and control flow
                </p>
              </div>
            ) : error ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center text-rose-400">
                <Info className="w-8 h-8 mb-2 opacity-80" />
                <p className="text-sm font-medium">{error}</p>
                <button
                  onClick={handleTranslateCode}
                  className="mt-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-lg"
                >
                  Try Again
                </button>
              </div>
            ) : result ? (
              <div className="space-y-4 flex-1 flex flex-col">
                {/* Code Window */}
                <div className="rounded-xl bg-slate-950 border border-slate-800/80 overflow-hidden flex flex-col">
                  {/* Binary Bitstream Mode Viewer */}
                  {binaryViewMode === 'raw_bits' && (isBinaryTarget || isHexTarget) ? (
                    <div className="p-4 font-mono text-xs text-emerald-400 leading-relaxed bg-black/60 overflow-x-auto space-y-2 max-h-72">
                      <div className="text-[10px] text-slate-400 border-b border-slate-800 pb-1 flex justify-between">
                        <span>8-bit Grouped Byte Sequence</span>
                        <span>
                          {result.binaryDetails?.byteCount
                            ? `${result.binaryDetails.byteCount} Bytes · ${result.binaryDetails.byteCount * 8} Bits`
                            : 'Raw Machine Stream'}
                        </span>
                      </div>
                      <div className="font-mono tracking-wider break-all text-emerald-300">
                        {result.binaryDetails?.formattedBinary ||
                          result.translatedCode
                            .split('\n')
                            .filter((line) => line.trim().match(/^[01 ]+$/))
                            .join(' ') ||
                          result.translatedCode}
                      </div>
                    </div>
                  ) : binaryViewMode === 'hex' && (isBinaryTarget || isHexTarget) ? (
                    <div className="p-4 font-mono text-xs text-indigo-300 leading-relaxed bg-black/60 overflow-x-auto space-y-2 max-h-72">
                      <div className="text-[10px] text-slate-400 border-b border-slate-800 pb-1 flex justify-between">
                        <span>Hexadecimal Opcode Dump</span>
                        <span>0x0000 Offset</span>
                      </div>
                      <div className="font-mono tracking-widest break-all">
                        {result.binaryDetails?.hexDump ||
                          result.translatedCode
                            .split('\n')
                            .map((line, i) => `${(i * 16).toString(16).padStart(4, '0')}: ${line}`)
                            .slice(0, 15)
                            .join('\n')}
                      </div>
                    </div>
                  ) : (
                    /* Standard Annotated Code View */
                    <div className="flex font-mono text-xs max-h-80 overflow-y-auto">
                      <div className="py-3 px-2 text-right text-slate-600 select-none bg-slate-950 border-r border-slate-900 shrink-0 min-w-8">
                        {Array.from({ length: resultLineCount }).map((_, i) => (
                          <div key={i} className="leading-5">
                            {i + 1}
                          </div>
                        ))}
                      </div>
                      <pre className="p-3 text-slate-200 overflow-x-auto flex-1 font-mono leading-5 whitespace-pre selection:bg-purple-500/30">
                        {result.translatedCode}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Technical Compiler & Architecture Breakdown */}
                {result.explanation && (
                  <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 text-purple-400 font-semibold text-[11px] uppercase tracking-wider">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Architectural & Memory Translation</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{result.explanation}</p>

                    {/* Key Changes Pills */}
                    {result.keyChanges && result.keyChanges.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/50 space-y-1.5">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                          Key Paradigm Transitions:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {result.keyChanges.map((change, idx) => (
                            <div
                              key={idx}
                              className="p-2 bg-slate-900/60 border border-slate-800/60 rounded-lg text-[11px]"
                            >
                              <span className="font-semibold text-purple-300">
                                {change.aspect}:{' '}
                              </span>
                              <span className="text-slate-400">{change.detail}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Execution & Build Guide */}
                {result.executionGuide && (
                  <div className="p-3 bg-slate-950/90 border border-slate-800/80 rounded-xl text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Terminal className="w-3 h-3 text-emerald-400" />
                        Compile / Execution Command:
                      </span>
                    </div>
                    <div className="p-2 bg-black/60 rounded-lg font-mono text-emerald-400 text-xs border border-slate-800 flex items-center justify-between">
                      <code>{result.executionGuide}</code>
                      <button
                        onClick={() => {
                          if (result.executionGuide) {
                            navigator.clipboard.writeText(result.executionGuide);
                          }
                        }}
                        className="text-slate-500 hover:text-white p-1"
                        title="Copy command"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Expected Sample Output */}
                {result.sampleOutput && (
                  <div className="p-3 bg-slate-950/50 border border-slate-800/60 rounded-xl text-xs space-y-1">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      Expected Output / Behavior:
                    </span>
                    <pre className="p-2 bg-black/40 rounded-lg font-mono text-slate-300 text-xs overflow-x-auto">
                      {result.sampleOutput}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 py-20 text-center">
                <Binary className="w-8 h-8 stroke-1 mb-2 opacity-40 text-purple-400" />
                <p className="text-sm text-slate-400">Translated code or binary will appear here</p>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Supports C++, Python, Rust, Assembly, Binary 0s & 1s, and more from text or whiteboard photo.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraSnapshot}
      />
    </div>
  );
};
