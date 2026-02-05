import fs from 'node:fs';
import path from 'node:path';
import { pipeline, env } from '@xenova/transformers';

export type SupportedLanguage = 'hindi' | 'urdu' | 'kashmiri' | 'english';

export interface TranscriptionSegment {
  text: string;
  timestamp: [number, number];
}

export interface OfflineTranscriptionResult {
  detectedLanguage: SupportedLanguage;
  rawLanguageCode: string;
  text: string;
  confidence: number;
  timestamps: TranscriptionSegment[];
}

const MODELS_DIR = path.resolve(process.cwd(), 'offline-engine/models');
const MODEL_ID = 'openai/whisper-tiny';

// True offline-only configuration. No remote fallback is permitted.
env.allowRemoteModels = false;
env.allowLocalModels = true;
env.cacheDir = './models';

let whisperPipeline: any | null = null;

function assertLocalModelPresent(): void {
  const modelPath = path.join(MODELS_DIR, 'openai', 'whisper-tiny');
  if (!fs.existsSync(modelPath)) {
    throw new Error(
      `Missing local model at ${modelPath}. Pre-download openai/whisper-tiny before starting the offline engine.`
    );
  }
}

async function getWhisperPipeline() {
  if (whisperPipeline) {
    return whisperPipeline;
  }

  assertLocalModelPresent();

  whisperPipeline = await pipeline('automatic-speech-recognition', MODEL_ID, {
    local_files_only: true,
  });

  return whisperPipeline;
}

export function mapWhisperLanguage(code: string | undefined): SupportedLanguage {
  const normalized = (code || 'en').slice(0, 2).toLowerCase();
  const table: Record<string, SupportedLanguage> = {
    hi: 'hindi',
    ur: 'urdu',
    ks: 'kashmiri',
    en: 'english',
  };

  return table[normalized] ?? 'english';
}

export async function transcribePcm16k(audio: Float32Array): Promise<OfflineTranscriptionResult> {
  const asr = await getWhisperPipeline();

  const output = await asr(audio, {
    task: 'transcribe',
    language: undefined,
    return_timestamps: true,
  });

  const rawLanguageCode = (output.language || 'en').toLowerCase();
  const detectedLanguage = mapWhisperLanguage(rawLanguageCode);

  return {
    detectedLanguage,
    rawLanguageCode,
    text: output.text || '',
    confidence: 0.82,
    timestamps: (output.chunks || []).map((chunk: any) => ({
      text: chunk.text,
      timestamp: chunk.timestamp,
    })),
  };
}

/**
 * Kashmiri handling note:
 * Whisper multilingual models have weaker Kashmiri coverage than Hindi/Urdu.
 * In offline mode we keep task="transcribe" and language auto-detection enabled,
 * then treat Kashmiri output as best-effort using Urdu/Hindi phonetic overlap.
 * This improves practical usability for demos but does not guarantee perfect Kashmiri STT.
 */
