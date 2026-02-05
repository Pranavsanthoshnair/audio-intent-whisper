/**
 * Threat Detection Service
 * Rule-based threat detection engine for analyzing transcripts
 */

import { getThreatDictionary, getThreatCategories, type ThreatCategory } from '@/data/threatDictionaries';
import type { TranscriptChunk } from '@/services/offlineStorage';

export interface ThreatMatch {
    chunkId: string;
    word: string;
    category: ThreatCategory;
    language: string;
    timestamp: number;
    context?: string; // Surrounding text for context
}

export interface ChunkThreatAnalysis {
    chunkId: string;
    matches: ThreatMatch[];
    threatScore: number;
    hasThreats: boolean;
}

/**
 * Tokenize and normalize text
 */
function tokenizeText(text: string): string[] {
    // Remove punctuation and split on whitespace
    const cleaned = text.replace(/[.,!?;:()[\]{}'"]/g, ' ');
    const tokens = cleaned.split(/\s+/).filter(t => t.length > 0);
    return tokens;
}

/**
 * Normalize text for matching
 */
function normalizeText(text: string): string {
    return text.toLowerCase().trim();
}

/**
 * Get context around a word (5 words before and after)
 */
function getContext(tokens: string[], index: number, contextSize: number = 5): string {
    const start = Math.max(0, index - contextSize);
    const end = Math.min(tokens.length, index + contextSize + 1);
    return tokens.slice(start, end).join(' ');
}

/**
 * Match keywords in text against threat dictionary
 */
export function matchKeywords(
    text: string,
    language: string
): ThreatMatch[] {
    const matches: ThreatMatch[] = [];
    const dictionary = getThreatDictionary(language);
    const tokens = tokenizeText(text);
    const categories = getThreatCategories();

    // Check each token against dictionary
    tokens.forEach((token, index) => {
        const normalizedToken = normalizeText(token);

        // Check each category
        for (const category of categories) {
            const categoryWords = dictionary[category];

            // Check if token matches any word in this category
            const matchedWord = categoryWords.find(
                word => normalizeText(word) === normalizedToken
            );

            if (matchedWord) {
                matches.push({
                    chunkId: '', // Will be set by caller
                    word: matchedWord,
                    category,
                    language,
                    timestamp: 0, // Will be set by caller
                    context: getContext(tokens, index)
                });
            }
        }
    });

    return matches;
}

/**
 * Detect threats in a single transcript chunk
 */
export function detectThreatsInChunk(
    chunk: TranscriptChunk,
    sourceText: string,
    translatedText?: string
): ChunkThreatAnalysis {
    const matches: ThreatMatch[] = [];

    // Match in source language
    const sourceMatches = matchKeywords(sourceText, chunk.language);
    sourceMatches.forEach(match => {
        match.chunkId = chunk.chunkId;
        match.timestamp = chunk.startTime;
    });
    matches.push(...sourceMatches);

    // Match in English translation if available
    if (translatedText && chunk.language !== 'english') {
        const translatedMatches = matchKeywords(translatedText, 'english');
        translatedMatches.forEach(match => {
            match.chunkId = chunk.chunkId;
            match.timestamp = chunk.startTime;
            match.language = 'english (translated)';
        });
        matches.push(...translatedMatches);
    }

    // Calculate chunk-level threat score
    const threatScore = calculateChunkThreatScore(matches);

    return {
        chunkId: chunk.chunkId,
        matches,
        threatScore,
        hasThreats: matches.length > 0
    };
}

/**
 * Calculate threat score for a chunk
 */
function calculateChunkThreatScore(matches: ThreatMatch[]): number {
    if (matches.length === 0) return 0;

    // Category weights
    const weights: Record<ThreatCategory, number> = {
        violent_actions: 2,
        weapons: 3,
        events: 2,
        targets: 2,
        urgency: 1
    };

    let score = 0;
    matches.forEach(match => {
        score += weights[match.category] || 1;
    });

    return score;
}

/**
 * Aggregate matches across all chunks in a session
 */
export function aggregateSessionMatches(
    chunkAnalyses: ChunkThreatAnalysis[]
): {
    totalMatches: number;
    categoryBreakdown: Record<ThreatCategory, number>;
    uniqueWords: Set<string>;
    chunksInvolved: number;
    allMatches: ThreatMatch[];
} {
    const categoryBreakdown: Record<ThreatCategory, number> = {
        violent_actions: 0,
        weapons: 0,
        events: 0,
        targets: 0,
        urgency: 0
    };

    const uniqueWords = new Set<string>();
    const allMatches: ThreatMatch[] = [];
    let chunksInvolved = 0;

    chunkAnalyses.forEach(analysis => {
        if (analysis.hasThreats) {
            chunksInvolved++;
        }

        analysis.matches.forEach(match => {
            categoryBreakdown[match.category]++;
            uniqueWords.add(match.word.toLowerCase());
            allMatches.push(match);
        });
    });

    return {
        totalMatches: allMatches.length,
        categoryBreakdown,
        uniqueWords,
        chunksInvolved,
        allMatches
    };
}

/**
 * Detect threats in multiple chunks
 */
export async function detectThreatsInSession(
    transcriptChunks: TranscriptChunk[],
    translationMap?: Map<string, string> // chunkId -> translated text
): Promise<ChunkThreatAnalysis[]> {
    const analyses: ChunkThreatAnalysis[] = [];

    for (const chunk of transcriptChunks) {
        const translatedText = translationMap?.get(chunk.chunkId);
        const analysis = detectThreatsInChunk(chunk, chunk.text, translatedText);
        analyses.push(analysis);
    }

    return analyses;
}
