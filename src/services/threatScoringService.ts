/**
 * Threat Scoring Service
 * Calculates threat scores and severity levels
 */

import type { ThreatCategory } from '@/data/threatDictionaries';
import type { ThreatMatch, ChunkThreatAnalysis } from './threatDetectionService';

export type ThreatSeverity = 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK';

export interface ThreatScore {
    score: number;
    severity: ThreatSeverity;
    breakdown: {
        violent_actions: number;
        weapons: number;
        events: number;
        targets: number;
        urgency: number;
        repetition_bonus: number;
    };
}

/**
 * Category weights for scoring
 */
const CATEGORY_WEIGHTS: Record<ThreatCategory, number> = {
    violent_actions: 2,
    weapons: 3,
    events: 2,
    targets: 2,
    urgency: 1
};

/**
 * Severity thresholds
 */
const SEVERITY_THRESHOLDS = {
    SAFE: { min: 0, max: 2 },
    SUSPICIOUS: { min: 3, max: 5 },
    HIGH_RISK: { min: 6, max: Infinity }
};

/**
 * Calculate threat score for a session
 */
export function calculateThreatScore(
    chunkAnalyses: ChunkThreatAnalysis[],
    categoryBreakdown: Record<ThreatCategory, number>,
    uniqueWords: Set<string>,
    chunksInvolved: number
): ThreatScore {
    // Base score from category weights
    let baseScore = 0;
    const breakdown = {
        violent_actions: 0,
        weapons: 0,
        events: 0,
        targets: 0,
        urgency: 0,
        repetition_bonus: 0
    };

    // Calculate weighted score for each category
    Object.entries(categoryBreakdown).forEach(([category, count]) => {
        const weight = CATEGORY_WEIGHTS[category as ThreatCategory] || 1;
        const categoryScore = count * weight;
        baseScore += categoryScore;
        breakdown[category as ThreatCategory] = categoryScore;
    });

    // Repetition bonus: if same words appear multiple times
    const totalMatches = Object.values(categoryBreakdown).reduce((sum, count) => sum + count, 0);
    const uniqueWordCount = uniqueWords.size;

    if (uniqueWordCount > 0 && totalMatches > uniqueWordCount) {
        const repetitionFactor = Math.floor((totalMatches - uniqueWordCount) / 2);
        breakdown.repetition_bonus = repetitionFactor;
        baseScore += repetitionFactor;
    }

    // Spread bonus: if threats are spread across multiple chunks
    if (chunksInvolved > 2) {
        const spreadBonus = Math.floor(chunksInvolved / 2);
        breakdown.repetition_bonus += spreadBonus;
        baseScore += spreadBonus;
    }

    // Determine severity
    const severity = getSeverity(baseScore);

    return {
        score: baseScore,
        severity,
        breakdown
    };
}

/**
 * Map score to severity level
 */
function getSeverity(score: number): ThreatSeverity {
    if (score >= SEVERITY_THRESHOLDS.HIGH_RISK.min) {
        return 'HIGH_RISK';
    } else if (score >= SEVERITY_THRESHOLDS.SUSPICIOUS.min) {
        return 'SUSPICIOUS';
    } else {
        return 'SAFE';
    }
}

/**
 * Get severity color for UI
 */
export function getSeverityColor(severity: ThreatSeverity): string {
    switch (severity) {
        case 'SAFE':
            return 'green';
        case 'SUSPICIOUS':
            return 'yellow';
        case 'HIGH_RISK':
            return 'red';
    }
}

/**
 * Get severity badge variant
 */
export function getSeverityVariant(severity: ThreatSeverity): 'default' | 'secondary' | 'destructive' {
    switch (severity) {
        case 'SAFE':
            return 'default';
        case 'SUSPICIOUS':
            return 'secondary';
        case 'HIGH_RISK':
            return 'destructive';
    }
}

/**
 * Get severity icon
 */
export function getSeverityIcon(severity: ThreatSeverity): string {
    switch (severity) {
        case 'SAFE':
            return '✅';
        case 'SUSPICIOUS':
            return '⚠️';
        case 'HIGH_RISK':
            return '🔴';
    }
}
