import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Resilient wrapper with retry and model fallback for high demand spikes
async function generateContentWithRetry(params: {
  contents: any;
  config?: any;
}) {
  const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
  let lastErr: any = null;

  for (const model of candidateModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await ai.models.generateContent({
          ...params,
          model,
        });
      } catch (err: any) {
        lastErr = err;
        const errStr = String(err?.message || '');
        if (errStr.includes('503') || errStr.includes('high demand') || errStr.includes('UNAVAILABLE')) {
          await new Promise((r) => setTimeout(r, 700 * (attempt + 1)));
          continue;
        }
        throw err;
      }
    }
  }
  throw lastErr;
}

// Translation API: handles natural languages and computer languages (code & binary)
app.post('/api/translate', async (req, res) => {
  try {
    const { mode, text, image, targetLanguage, options } = req.body;

    if (!targetLanguage) {
      return res.status(400).json({ error: 'Target language is required.' });
    }

    if (!text && !image) {
      return res.status(400).json({ error: 'Please provide either text or an image to translate.' });
    }

    const parts: any[] = [];

    // Multimodal support: if image is provided (photo of document, sign, code screenshot, whiteboard)
    if (image?.data) {
      let cleanBase64 = image.data;
      if (cleanBase64.includes('base64,')) {
        cleanBase64 = cleanBase64.split('base64,')[1];
      }
      parts.push({
        inlineData: {
          mimeType: image.mimeType || 'image/jpeg',
          data: cleanBase64,
        },
      });
    }

    if (mode === 'code') {
      const prompt = `You are an expert polyglot software engineer, compiler designer, and systems architect.
Translate the provided computer code into the requested target language: "${targetLanguage}".
You must also automatically detect the source computer language (e.g. C++, C, Python, JavaScript, TypeScript, Rust, Go, Java, x86_64 Assembly, ARM Assembly, WebAssembly, Binary, Hex, Bytecode, etc.).

${text ? `Source Code:\n\`\`\`\n${text}\n\`\`\`` : 'Extract and translate the code shown in the attached image.'}

Rules for code translation:
1. Detect the source language accurately.
2. If the target language is "Binary":
   - Provide the clean binary bitstream representation (8-bit or 32-bit grouped zeros and ones e.g. 01001000 01100101...).
   - Also provide formatted machine opcode or character-level binary mapping with helpful inline comments explaining the byte breakdown.
   - Include a hex dump breakdown if applicable.
3. If the target language is low-level (Assembly, WAT, LLVM IR):
   - Provide syntactically valid, runnable assembly instructions with registers and stack management properly explained.
4. If the target language is high-level (C++, Python, Rust, Go, etc.):
   - Write idiomatic, modern, production-grade code adhering to best practices and standard libraries.
5. Provide a clear technical explanation of the translation, detailing how memory management, pointers, types, loops, and control flow were translated.
6. Provide an execution guide explaining how to compile, assemble, or run the target code.

Return ONLY a valid JSON object matching this schema:
{
  "detectedLanguage": "string (name of detected computer language)",
  "confidence": number (between 0.8 and 1.0),
  "originalCode": "string (the clean source code extracted or provided)",
  "translatedCode": "string (the full translated code or binary output)",
  "binaryDetails": {
    "formattedBinary": "string (optional bitstream grouped by bytes)",
    "hexDump": "string (optional hex representation)",
    "byteCount": number
  },
  "explanation": "string (detailed explanation of architectural & syntactic translation)",
  "keyChanges": [
    { "aspect": "string (e.g. Pointers, Memory Model, Syntax, Concurrency)", "detail": "string" }
  ],
  "executionGuide": "string (e.g. g++ -O3 main.cpp -o main or python3 main.py)",
  "sampleOutput": "string (expected console output or behavior when executed)"
}`;

      parts.push({ text: prompt });

      const response = await generateContentWithRetry({
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const rawText = response.text || '{}';
      try {
        const json = JSON.parse(rawText);
        return res.json({ success: true, mode: 'code', data: json });
      } catch (err) {
        console.error('Failed to parse JSON response:', rawText);
        return res.json({
          success: true,
          mode: 'code',
          data: {
            detectedLanguage: 'Auto-detected Code',
            originalCode: text || '',
            translatedCode: rawText,
            explanation: 'Translation generated directly.',
            keyChanges: [],
            executionGuide: '',
            sampleOutput: '',
          },
        });
      }
    } else {
      // Natural Language Translation
      const prompt = `You are an elite, highly culturally fluent polyglot translator.
Translate the given text or text extracted from the image into the target language: "${targetLanguage}".
Automatically detect the source language with high precision (e.g. "Spanish", "Japanese", "French", "German", "Arabic", "Mandarin Chinese", "Hindi", "Russian", etc.).

${text ? `Input Text:\n"""\n${text}\n"""` : 'Extract all readable text from the attached image and translate it.'}

Rules for natural language translation:
1. Translate faithfully, capturing the exact tone, nuance, idioms, and natural fluency of a native speaker.
2. If text was extracted from an image, preserve paragraph structure and formatting where appropriate.
3. Provide accurate pronunciation / romanization (e.g., Pinyin, Romaji, or phonetic transcription) if the target or source language uses a non-Latin script (or if helpful).
4. Provide 2-3 natural alternative translations (e.g., formal, colloquial, or literal variations).
5. Add any cultural or grammatical context if an idiom or cultural reference is present.

Return ONLY a valid JSON object matching this schema:
{
  "detectedLanguage": "string (full name of detected language)",
  "detectedLanguageCode": "string (e.g. es, ja, fr, de, ar, zh, hi, ru)",
  "originalText": "string (the clean original text extracted or submitted)",
  "translatedText": "string (the primary high-quality translation)",
  "pronunciation": "string (romanization/phonetics if applicable or blank)",
  "alternativeTranslations": [
    { "text": "string", "context": "string (e.g. Formal, Casual, Literary, Direct)" }
  ],
  "notes": "string (cultural or grammatical insight, or empty string)",
  "detectedScript": "string (e.g. Latin, Cyrillic, Kanji/Kana, Devanagari, Arabic)"
}`;

      parts.push({ text: prompt });

      const response = await generateContentWithRetry({
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const rawText = response.text || '{}';
      try {
        const json = JSON.parse(rawText);
        return res.json({ success: true, mode: 'natural', data: json });
      } catch (err) {
        console.error('Failed to parse natural translation JSON:', rawText);
        return res.json({
          success: true,
          mode: 'natural',
          data: {
            detectedLanguage: 'Auto-detected',
            detectedLanguageCode: 'auto',
            originalText: text || '',
            translatedText: rawText,
            pronunciation: '',
            alternativeTranslations: [],
            notes: '',
            detectedScript: 'Standard',
          },
        });
      }
    }
  } catch (error: any) {
    console.error('Translation error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to complete translation. Please try again.',
    });
  }
});

// Text-to-Speech audio synthesis using Gemini TTS model
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voiceName = 'Kore' } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required for audio playback.' });
    }

    const cleanText = text.slice(0, 300);

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [{ text: cleanText }],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(502).json({ error: 'Audio generation produced no output.' });
    }

    res.json({
      success: true,
      audioData: `data:audio/wav;base64,${base64Audio}`,
    });
  } catch (error: any) {
    console.error('TTS error:', error);
    res.status(500).json({ error: error?.message || 'Speech generation failed' });
  }
});

// Mount Vite or serve static files
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LingoCode server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
