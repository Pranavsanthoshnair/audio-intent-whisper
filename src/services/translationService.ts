/**
 * Translation Service
 * Frontend client that delegates translation to the local offline engine.
 * No mock translations are used.
 */

import type { Language } from './offlineStorage';
import type { TranscriptChunk } from './sttService';

const OFFLINE_ENGINE_URL = 'http://localhost:3040';

export interface TranslationChunk {
  chunkId: string;
  sourceLanguage: Language;
  sourceText: string;
  translatedText: string;
  confidence?: number;
  startTime: number;
}

async function translateChunkViaOfflineEngine(chunk: TranscriptChunk): Promise<TranslationChunk> {
  const response = await fetch(`${OFFLINE_ENGINE_URL}/translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chunkId: chunk.chunkId,
      sourceLanguage: chunk.language,
      sourceText: chunk.text,
      startTime: chunk.startTime,
    }),
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(errorPayload.error || 'Offline translation engine failed');
  }

  return (await response.json()) as TranslationChunk;
}

export async function translateChunks(
  transcriptChunks: TranscriptChunk[],
  onProgress?: (current: number, total: number) => void
): Promise<TranslationChunk[]> {
  const translations: TranslationChunk[] = [];

  for (let i = 0; i < transcriptChunks.length; i++) {
    const translation = await translateChunkViaOfflineEngine(transcriptChunks[i]);
    translations.push(translation);

    if (onProgress) {
      onProgress(i + 1, transcriptChunks.length);
    }
  }

  return translations;
}
