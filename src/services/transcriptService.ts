/**
 * Transcript Service
 * Handles transcript aggregation and session-level operations
 */

import { Language, TranscriptRecord } from './offlineStorage';
import { getTranscriptsBySession, storeTranscript } from './transcriptStorage';
import { TranscriptChunk } from './sttService';

export interface SessionTranscript {
    sessionId: string;
    language: Language;
    confidenceAvg: number;
    totalChunks: number;
    fullTranscript: Array<{
        chunkId: string;
        startTime: number;
        duration: number;
        text: string;
        language: Language;
        confidence: number;
    }>;
    createdAt: Date;
}

/**
 * Calculate dominant language from chunk transcripts
 */
export function calculateDominantLanguage(chunks: TranscriptChunk[]): Language {
    if (chunks.length === 0) return 'english';

    const languageCounts: Record<Language, number> = {
        hindi: 0,
        urdu: 0,
        kashmiri: 0,
        english: 0,
    };

    chunks.forEach((chunk) => {
        languageCounts[chunk.language]++;
    });

    // Find language with highest count
    let dominantLanguage: Language = 'english';
    let maxCount = 0;

    (Object.keys(languageCounts) as Language[]).forEach((lang) => {
        if (languageCounts[lang] > maxCount) {
            maxCount = languageCounts[lang];
            dominantLanguage = lang;
        }
    });

    return dominantLanguage;
}

/**
 * Calculate average confidence from chunk transcripts
 */
export function calculateAverageConfidence(chunks: TranscriptChunk[]): number {
    if (chunks.length === 0) return 0;

    const sum = chunks.reduce((acc, chunk) => acc + chunk.confidence, 0);
    const avg = sum / chunks.length;

    return parseFloat(avg.toFixed(2));
}

/**
 * Store transcript chunks for a session
 */
export async function storeTranscriptChunks(
    sessionId: string,
    chunks: TranscriptChunk[]
): Promise<void> {
    for (const chunk of chunks) {
        const transcriptId = `transcript-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        await storeTranscript({
            transcriptId,
            sessionId,
            chunkId: chunk.chunkId,
            text: chunk.text,
            language: chunk.language,
            confidence: chunk.confidence,
            startTime: chunk.startTime,
        });
    }

    console.log(`✓ Stored ${chunks.length} transcript chunks for session ${sessionId}`);
}

/**
 * Aggregate chunk transcripts into session-level transcript
 */
export async function aggregateTranscripts(sessionId: string): Promise<SessionTranscript> {
    const transcripts = await getTranscriptsBySession(sessionId);

    if (transcripts.length === 0) {
        throw new Error(`No transcripts found for session ${sessionId}`);
    }

    // Convert to TranscriptChunk format for calculations
    const chunks: TranscriptChunk[] = transcripts.map((t) => ({
        chunkId: t.chunkId,
        text: t.text,
        language: t.language,
        confidence: t.confidence,
        startTime: t.startTime,
        duration: 0, // Not stored in DB
    }));

    const dominantLanguage = calculateDominantLanguage(chunks);
    const confidenceAvg = calculateAverageConfidence(chunks);

    return {
        sessionId,
        language: dominantLanguage,
        confidenceAvg,
        totalChunks: transcripts.length,
        fullTranscript: transcripts.map((t) => ({
            chunkId: t.chunkId,
            startTime: t.startTime,
            duration: 0, // Not stored
            text: t.text,
            language: t.language,
            confidence: t.confidence,
        })),
        createdAt: new Date(),
    };
}

/**
 * Get full transcript text (concatenated)
 */
export async function getFullTranscriptText(sessionId: string): Promise<string> {
    const transcripts = await getTranscriptsBySession(sessionId);
    return transcripts.map((t) => t.text).join(' ');
}

/**
 * Format transcript for display
 */
export function formatTranscriptForDisplay(transcript: SessionTranscript): string {
    const header = `Session: ${transcript.sessionId}\nLanguage: ${transcript.language}\nConfidence: ${(transcript.confidenceAvg * 100).toFixed(0)}%\n\n`;

    const chunks = transcript.fullTranscript
        .map((chunk, index) => {
            const time = chunk.startTime.toFixed(1);
            const conf = (chunk.confidence * 100).toFixed(0);
            return `[${time}s] (${conf}%) ${chunk.text}`;
        })
        .join('\n');

    return header + chunks;
}
