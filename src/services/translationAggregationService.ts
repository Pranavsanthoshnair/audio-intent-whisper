/**
 * Translation Aggregation Service
 * Handles session-level translation aggregation and bilingual text formatting
 */

import { v4 as uuidv4 } from 'uuid';
import { getTranslationsBySession, storeTranslation } from './translationStorage';
import type { TranslationRecord, Language } from './offlineStorage';

export interface SessionTranslation {
    sessionId: string;
    targetLanguage: 'english';
    totalChunks: number;
    translatedTranscript: Array<{
        chunkId: string;
        startTime: number;
        sourceLanguage: Language;
        sourceText: string;
        translatedText: string;
        confidence?: number;
    }>;
    createdAt: Date;
}

/**
 * Store translation chunks in IndexedDB
 */
export async function storeTranslationChunks(
    sessionId: string,
    translations: Array<{
        chunkId: string;
        sourceLanguage: Language;
        sourceText: string;
        translatedText: string;
        confidence?: number;
        startTime: number;
    }>
): Promise<void> {
    for (const translation of translations) {
        await storeTranslation({
            translationId: `translation-${uuidv4().slice(0, 8)}`,
            sessionId,
            chunkId: translation.chunkId,
            sourceLanguage: translation.sourceLanguage,
            sourceText: translation.sourceText,
            translatedText: translation.translatedText,
            confidence: translation.confidence,
            startTime: translation.startTime,
        });
    }

    console.log(`✓ Stored ${translations.length} translation chunks for session ${sessionId}`);
}

/**
 * Aggregate translations into session-level object
 */
export async function aggregateTranslations(sessionId: string): Promise<SessionTranslation> {
    const translations = await getTranslationsBySession(sessionId);

    if (translations.length === 0) {
        throw new Error(`No translations found for session ${sessionId}`);
    }

    return {
        sessionId,
        targetLanguage: 'english',
        totalChunks: translations.length,
        translatedTranscript: translations.map((t) => ({
            chunkId: t.chunkId,
            startTime: t.startTime,
            sourceLanguage: t.sourceLanguage,
            sourceText: t.sourceText,
            translatedText: t.translatedText,
            confidence: t.confidence,
        })),
        createdAt: new Date(),
    };
}

/**
 * Get bilingual text (source + English) as formatted string
 */
export async function getBilingualText(sessionId: string): Promise<string> {
    const translation = await aggregateTranslations(sessionId);

    return translation.translatedTranscript
        .map((chunk) => {
            return `[${chunk.sourceLanguage}] ${chunk.sourceText}\n[english] ${chunk.translatedText}`;
        })
        .join('\n\n');
}

/**
 * Get English-only text
 */
export async function getEnglishText(sessionId: string): Promise<string> {
    const translation = await aggregateTranslations(sessionId);

    return translation.translatedTranscript
        .map((chunk) => chunk.translatedText)
        .join(' ');
}

/**
 * Format translation for display
 */
export function formatTranslationChunk(translation: TranslationRecord): string {
    const confidence = translation.confidence
        ? ` (${(translation.confidence * 100).toFixed(0)}% confidence)`
        : '';

    return `[${translation.startTime.toFixed(1)}s] ${translation.translatedText}${confidence}`;
}
