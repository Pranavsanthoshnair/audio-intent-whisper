import fs from 'node:fs';
import path from 'node:path';
import { pipeline, env } from '@xenova/transformers';
import type { SupportedLanguage } from './whisper.js';

export interface TranslationResult {
  translatedText: string;
  confidence: number;
}

const MODELS_DIR = path.resolve(process.cwd(), 'offline-engine/models');
const TRANSLATION_MODEL = 'Xenova/m2m100_418M';

// Offline-only model policy.
env.allowRemoteModels = false;
env.allowLocalModels = true;
env.cacheDir = path.join(process.cwd(), 'offline-engine/models');

let translator: any | null = null;

function assertTranslationModelPresent(): void {
  const modelPath = path.join(MODELS_DIR, 'Xenova', 'm2m100_418M');
  if (!fs.existsSync(modelPath)) {
    throw new Error(
      `Missing local translation model at ${modelPath}. Pre-download Xenova/m2m100_418M before runtime.`
    );
  }
}

async function getTranslator() {
  if (translator) {
    return translator;
  }

  assertTranslationModelPresent();
  translator = await pipeline('translation', TRANSLATION_MODEL, {
    local_files_only: true,
  });

  return translator;
}

function mapLanguageToM2M100Code(language: SupportedLanguage): string {
  const languageCodeTable: Record<SupportedLanguage, string> = {
    english: 'en',
    hindi: 'hi',
    urdu: 'ur',
    // Kashmiri support in small offline models is limited.
    // For best-effort we route through Urdu, which captures a substantial phonetic overlap
    // in practical noisy/crowd speech scenarios.
    kashmiri: 'ur',
  };

  return languageCodeTable[language];
}

export async function translateToEnglish(text: string, sourceLanguage: SupportedLanguage): Promise<TranslationResult> {
  if (!text.trim()) {
    return {
      translatedText: '',
      confidence: 0,
    };
  }

  if (sourceLanguage === 'english') {
    return {
      translatedText: text,
      confidence: 1,
    };
  }

  const translationPipeline = await getTranslator();
  const srcLang = mapLanguageToM2M100Code(sourceLanguage);

  const output = await translationPipeline(text, {
    src_lang: srcLang,
    tgt_lang: 'en',
  });

  const translatedText = Array.isArray(output)
    ? output[0]?.translation_text || text
    : output?.translation_text || text;

  return {
    translatedText,
    confidence: 0.8,
  };
}
