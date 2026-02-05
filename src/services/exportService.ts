/**
 * Export Service
 * Handles JSON and CSV export of session data
 * Updated for Checkpoint 3: Includes transcript data
 */

import { getSession } from './sessionService';
import { getAudioBySession } from './audioStorageService';
import { getTranscriptsBySession } from './transcriptStorage';
import { aggregateTranscripts } from './transcriptService';
import { getTranslationsBySession } from './translationStorage';
import { aggregateTranslations } from './translationAggregationService';

/**
 * Export session data as JSON
 */
export async function exportSessionAsJSON(sessionId: string): Promise<void> {
    try {
        const session = await getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        const audio = await getAudioBySession(sessionId);
        const transcripts = await getTranscriptsBySession(sessionId);

        // Build transcript data
        let transcriptData = null;
        if (transcripts.length > 0) {
            const aggregated = await aggregateTranscripts(sessionId);
            transcriptData = {
                language: aggregated.language,
                confidenceAvg: aggregated.confidenceAvg,
                totalChunks: aggregated.totalChunks,
                chunks: aggregated.fullTranscript.map((chunk) => ({
                    chunkId: chunk.chunkId,
                    startTime: chunk.startTime,
                    text: chunk.text,
                    language: chunk.language,
                    confidence: chunk.confidence,
                })),
                fullText: aggregated.fullTranscript.map((c) => c.text).join(' '),
            };
        }

        // Build translation data
        let translationData = null;
        const translations = await getTranslationsBySession(sessionId);
        if (translations.length > 0) {
            const aggregated = await aggregateTranslations(sessionId);
            translationData = {
                targetLanguage: 'english',
                totalChunks: aggregated.totalChunks,
                bilingualTranscript: aggregated.translatedTranscript.map((chunk) => ({
                    chunkId: chunk.chunkId,
                    startTime: chunk.startTime,
                    sourceLanguage: chunk.sourceLanguage,
                    sourceText: chunk.sourceText,
                    translatedText: chunk.translatedText,
                    confidence: chunk.confidence,
                })),
                fullEnglishText: aggregated.translatedTranscript.map((c) => c.translatedText).join(' '),
            };
        }

        const exportData = {
            sessionId: session.sessionId,
            createdAt: session.createdAt,
            inputMode: session.inputMode,
            status: session.status,
            audio: audio
                ? {
                    audioId: audio.audioId,
                    format: audio.format,
                    duration: audio.duration,
                    size: audio.size,
                }
                : null,
            transcript: transcriptData,
            translation: translationData,
            // Placeholders for future checkpoints
            threatAnalysis: null, // TODO (Checkpoint 5)
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json',
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `session-${sessionId}-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log(`✓ Exported session ${sessionId} as JSON`);
    } catch (error) {
        console.error('JSON export error:', error);
        throw error;
    }
}

/**
 * Export session data as CSV
 */
export async function exportSessionAsCSV(sessionId: string): Promise<void> {
    try {
        const session = await getSession(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        const transcripts = await getTranscriptsBySession(sessionId);
        const translations = await getTranslationsBySession(sessionId);

        // Create a map of translations by chunkId for easy lookup
        const translationMap = new Map(
            translations.map((t) => [t.chunkId, t])
        );

        // CSV Headers (bilingual)
        const headers = [
            'sessionId',
            'chunkId',
            'startTime',
            'sourceLanguage',
            'sourceText',
            'translatedText',
            'confidence',
        ];

        // CSV Rows
        const rows = transcripts.map((t) => {
            const translation = translationMap.get(t.chunkId);
            return [
                sessionId,
                t.chunkId,
                t.startTime.toString(),
                t.language,
                `"${t.text.replace(/"/g, '""')}"`, // Escape quotes
                translation ? `"${translation.translatedText.replace(/"/g, '""')}"` : '',
                translation ? translation.confidence?.toString() || '' : t.confidence.toString(),
            ];
        });

        // Build CSV content
        const csvContent = [
            headers.join(','),
            ...rows.map((row) => row.join(',')),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `session-${sessionId}-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log(`✓ Exported session ${sessionId} as CSV`);
    } catch (error) {
        console.error('CSV export error:', error);
        throw error;
    }
}
