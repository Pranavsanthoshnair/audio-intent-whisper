/**
 * Orchestrator Service
 * Coordinates threat detection workflow
 */

import { detectThreatsInSession, aggregateSessionMatches } from './threatDetectionService';
import { calculateThreatScore } from './threatScoringService';
import { generateThreatExplanation } from './threatExplainabilityService';
import { storeThreatAnalysis } from './threatAnalysisStorage';
import { initDB, type TranscriptChunk } from './offlineStorage';
import type { ThreatAnalysisRecord } from './offlineStorage';

/**
 * Get transcripts from IndexedDB
 */
async function getTranscriptsFromDB(sessionId: string): Promise<TranscriptChunk[]> {
    const db = await initDB();
    const transaction = db.transaction(['transcripts'], 'readonly');
    const store = transaction.objectStore('transcripts');
    const index = store.index('sessionId');

    return new Promise((resolve, reject) => {
        const request = index.getAll(sessionId);

        request.onsuccess = () => {
            const records = request.result || [];
            const chunks: TranscriptChunk[] = records.map(r => ({
                chunkId: r.chunkId,
                text: r.text,
                language: r.language,
                confidence: r.confidence,
                startTime: r.startTime,
                duration: 0 // Not stored in TranscriptRecord
            }));
            resolve(chunks);
        };

        request.onerror = () => {
            reject(new Error('Failed to get transcripts'));
        };
    });
}

/**
 * Get translations from IndexedDB
 */
async function getTranslationsFromDB(sessionId: string): Promise<Array<{ chunkId: string; translatedText: string }>> {
    const db = await initDB();
    const transaction = db.transaction(['translations'], 'readonly');
    const store = transaction.objectStore('translations');
    const index = store.index('sessionId');

    return new Promise((resolve, reject) => {
        const request = index.getAll(sessionId);

        request.onsuccess = () => {
            const records = request.result || [];
            resolve(records.map(r => ({
                chunkId: r.chunkId,
                translatedText: r.translatedText
            })));
        };

        request.onerror = () => {
            reject(new Error('Failed to get translations'));
        };
    });
}

/**
 * Analyze threats for a session
 */
export async function analyzeSessionThreats(sessionId: string): Promise<ThreatAnalysisRecord> {
    console.log(`🔍 Analyzing threats for session: ${sessionId}`);

    // Get transcripts
    const transcripts = await getTranscriptsFromDB(sessionId);
    if (transcripts.length === 0) {
        throw new Error('No transcripts found for this session');
    }

    // Get translations (if available)
    const translations = await getTranslationsFromDB(sessionId);
    const translationMap = new Map<string, string>();
    translations.forEach(t => {
        translationMap.set(t.chunkId, t.translatedText);
    });

    // Detect threats in each chunk
    const chunkAnalyses = await detectThreatsInSession(transcripts, translationMap);

    // Aggregate matches
    const aggregated = aggregateSessionMatches(chunkAnalyses);

    // Calculate threat score
    const threatScore = calculateThreatScore(
        chunkAnalyses,
        aggregated.categoryBreakdown,
        aggregated.uniqueWords,
        aggregated.chunksInvolved
    );

    // Generate explanation
    const explanation = generateThreatExplanation(
        threatScore.severity,
        threatScore.score,
        aggregated.allMatches,
        aggregated.categoryBreakdown,
        aggregated.chunksInvolved
    );

    // Create analysis record
    const analysisRecord: ThreatAnalysisRecord = {
        analysisId: `analysis-${sessionId}-${Date.now()}`,
        sessionId,
        threatScore: threatScore.score,
        severity: threatScore.severity,
        triggeredKeywords: explanation.triggeredKeywords,
        categoryBreakdown: aggregated.categoryBreakdown,
        explanationText: explanation.summary,
        chunksInvolved: aggregated.chunksInvolved,
        createdAt: new Date()
    };

    // Store in IndexedDB
    await storeThreatAnalysis(analysisRecord);

    console.log(`✅ Threat analysis complete: ${threatScore.severity} (score: ${threatScore.score})`);

    return analysisRecord;
}
