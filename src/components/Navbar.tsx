import React from 'react';
import { TranslationMode } from '../types/translation';
import { Languages, Binary, History, Sparkles, Code2, Globe2 } from 'lucide-react';

interface NavbarProps {
  mode: TranslationMode;
  onModeChange: (mode: TranslationMode) => void;
  historyCount: number;
  onOpenHistory: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  mode,
  onModeChange,
  historyCount,
  onOpenHistory,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              {mode === 'code' ? (
                <Binary className="w-5 h-5 text-indigo-400" />
              ) : (
                <Languages className="w-5 h-5 text-indigo-400" />
              )}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white">LingoCode</span>
              <span className="hidden sm:inline-block text-[11px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Universal AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Multimodal text, photo & computer code translation
            </p>
          </div>
        </div>

        {/* Central Mode Switcher */}
        <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl shadow-inner">
          <button
            onClick={() => onModeChange('natural')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              mode === 'natural'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>Natural Languages</span>
          </button>

          <button
            onClick={() => onModeChange('code')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              mode === 'code'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Code & Binary Mode</span>
            <span className="px-1.5 py-0.2 text-[10px] uppercase font-bold tracking-wider rounded bg-indigo-400/20 text-indigo-200">
              C++ ➔ 0101
            </span>
          </button>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenHistory}
            className="relative flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors"
            title="Translation History"
          >
            <History className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">History</span>
            {historyCount > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {historyCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
