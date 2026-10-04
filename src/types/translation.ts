export type TranslationMode = 'natural' | 'code';

export interface LanguageItem {
  code: string;
  name: string;
  nativeName?: string;
  flag?: string;
  popular?: boolean;
}

export interface ComputerLanguageItem {
  id: string;
  name: string;
  category: 'low-level' | 'high-level' | 'machine' | 'esoteric';
  extension: string;
  description: string;
  badge: string;
}

export interface NaturalTranslationResult {
  detectedLanguage: string;
  detectedLanguageCode: string;
  originalText: string;
  translatedText: string;
  pronunciation?: string;
  alternativeTranslations?: Array<{ text: string; context: string }>;
  notes?: string;
  detectedScript?: string;
}

export interface CodeTranslationResult {
  detectedLanguage: string;
  confidence?: number;
  originalCode: string;
  translatedCode: string;
  binaryDetails?: {
    formattedBinary?: string;
    hexDump?: string;
    byteCount?: number;
  };
  explanation?: string;
  keyChanges?: Array<{ aspect: string; detail: string }>;
  executionGuide?: string;
  sampleOutput?: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  mode: TranslationMode;
  sourceTextOrSnippet: string;
  detectedSource: string;
  targetLanguage: string;
  translatedTextOrCode: string;
  hasImage?: boolean;
  imageUrl?: string;
}
