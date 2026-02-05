/**
 * Speech-to-Text Service (frontend client)
 *
 * Frontend rule: never run Whisper locally in browser.
 * This service only forwards audio chunks to the local offline Node engine.
 */

import { Language } from './offlineStorage';

const OFFLINE_ENGINE_URL = 'http://localhost:3040';

export interface TranscriptChunk {
  chunkId: string;
  text: string;
  language: Language;
  confidence: number;
  startTime: number;
  duration: number;
  timestamps?: Array<{
    text: string;
    timestamp: [number, number];
  }>;
}

interface EngineTranscribeResponse {
  chunkId: string;
  detectedLanguage: Language;
  text: string;
  confidence: number;
  startTime: number;
  timestamps: Array<{
    text: string;
    timestamp: [number, number];
  }>;
}

async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(arrayBuffer);
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...slice);
  }

  return btoa(binary);
}

async function transcribeChunkViaOfflineEngine(
  sessionId: string,
  chunk: { chunkId: string; audioBlob: Blob; startTime: number; duration: number }
): Promise<TranscriptChunk> {
  const audioBase64 = await blobToBase64(chunk.audioBlob);

  const response = await fetch(`${OFFLINE_ENGINE_URL}/transcribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionId,
      chunkId: chunk.chunkId,
      startTime: chunk.startTime,
      audioBase64,
      mimeType: chunk.audioBlob.type || 'audio/wav',
    }),
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(errorPayload.error || 'Offline engine transcription failed');
  }

  const payload = (await response.json()) as EngineTranscribeResponse;

  return {
    chunkId: payload.chunkId,
    text: payload.text,
    language: payload.detectedLanguage,
    confidence: payload.confidence,
    startTime: payload.startTime,
    duration: chunk.duration,
    timestamps: payload.timestamps,
  };
}

export async function transcribeChunks(
  sessionId: string,
  chunks: Array<{ chunkId: string; audioBlob: Blob; startTime: number; duration: number }>,
  onProgress?: (current: number, total: number, latest: TranscriptChunk) => void
): Promise<TranscriptChunk[]> {
  const transcripts: TranscriptChunk[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const transcript = await transcribeChunkViaOfflineEngine(sessionId, chunks[i]);
    transcripts.push(transcript);

    if (onProgress) {
      onProgress(i + 1, chunks.length, transcript);
    }
  }

  return transcripts;
}
