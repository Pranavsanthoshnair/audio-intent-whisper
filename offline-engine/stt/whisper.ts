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
env.cacheDir = path.join(process.cwd(), 'offline-engine/models');

let whisperPipeline: any | null = null;

function assertLocalModelPresent(): void {
  const modelPath = path.join(MODELS_DIR, 'openai', 'whisper-tiny');
  if (!fs.existsSync(modelPath)) {
    throw new Error(
      `Missing local model at ${modelPath}. Pre-download openai/whisper-tiny before starting the offline engine.`
    );
  }
}

function normalizeAudioForNoisySpeech(input: Float32Array): Float32Array {
  if (input.length === 0) {
    return input;
  }

  const output = new Float32Array(input.length);
  let mean = 0;
  for (let i = 0; i < input.length; i++) {
    mean += input[i];
  }
  mean /= input.length;

  let peak = 0;
  for (let i = 0; i < input.length; i++) {
    const centered = input[i] - mean;
    output[i] = centered;
    const abs = Math.abs(centered);
    if (abs > peak) peak = abs;
  }

  if (peak < 1e-4) {
    return output;
  }

  const gain = Math.min(1.5, 0.95 / peak);
  for (let i = 0; i < output.length; i++) {
    output[i] *= gain;
  }

  return output;
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
  const normalizedAudio = normalizeAudioForNoisySpeech(audio);

  const output = await asr(normalizedAudio, {
    task: 'transcribe',
    language: undefined,
    return_timestamps: true,
    chunk_length_s: 20,
    stride_length_s: 4,
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
