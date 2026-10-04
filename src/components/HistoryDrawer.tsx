import React, { useState } from 'react';
import { HistoryItem, TranslationMode } from '../types/translation';
import { X, Trash2, ArrowRight, Copy, Check, Clock, Search, ExternalLink, Code2, Globe2 } from 'lucide-react';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
  onDeleteOne: (id: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelect,
  onClear,
  onDeleteOne,
}) => {
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | TranslationMode>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filtered = history.filter((item) => {
    if (filterMode !== 'all' && item.mode !== filterMode) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.sourceTextOrSnippet.toLowerCase().includes(q) ||
      item.translatedTextOrCode.toLowerCase().includes(q) ||
      item.detectedSource.toLowerCase().includes(q) ||
      item.targetLanguage.toLowerCase().includes(q)
    );
  });

  const handleCopy = (e: React.MouseEvent, text: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              <h2 className="font-semibold text-white">Translation History</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                {history.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <button
                  onClick={onClear}
                  className="p-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-1"
                  title="Clear All History"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="p-4 border-b border-slate-800/80 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search past translations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  filterMode === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-800/50'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterMode('natural')}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  filterMode === 'natural'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-800/50'
                }`}
              >
                <Globe2 className="w-3 h-3" />
                Natural
              </button>
              <button
                onClick={() => setFilterMode('code')}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  filterMode === 'code'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-800/50'
                }`}
              >
                <Code2 className="w-3 h-3" />
                Code / Binary
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filtered.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center text-slate-500">
                <Clock className="w-8 h-8 stroke-1 mb-2 opacity-40" />
                <p className="text-sm">No translations found.</p>
                <p className="text-xs text-slate-600 mt-1">
                  Translate text, photos or code snippets to see them here.
                </p>
              </div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelect(item);
                    onClose();
                  }}
                  className="group relative p-3.5 bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800/80 hover:border-slate-700 rounded-xl transition-all cursor-pointer text-left"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className="text-slate-300">{item.detectedSource}</span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span className="text-indigo-400">{item.targetLanguage}</span>
                      {item.hasImage && (
                        <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded">
                          Photo
                        </span>
                      )}
                    </div>
                    <span>{formatDate(item.timestamp)}</span>
                  </div>

                  {/* Snippets */}
                  <div className="space-y-1.5">
                    <p className="text-xs text-slate-400 line-clamp-2 font-mono">
                      {item.sourceTextOrSnippet}
                    </p>
                    <p className="text-xs text-slate-200 line-clamp-2 font-medium">
                      {item.translatedTextOrCode}
                    </p>
                  </div>

                  {/* Actions on hover */}
                  <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-indigo-400 group-hover:underline flex items-center gap-1">
                      Restore <ExternalLink className="w-3 h-3" />
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleCopy(e, item.translatedTextOrCode, item.id)}
                        className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700 transition-colors"
                        title="Copy translation"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteOne(item.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-500/10 transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
