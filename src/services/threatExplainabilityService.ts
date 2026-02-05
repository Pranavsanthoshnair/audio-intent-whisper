/**
 * Threat Explainability Service
 * Generates human-readable explanations for threat detections
 */

import type { ThreatMatch } from './threatDetectionService';
import type { ThreatScore, ThreatSeverity } from './threatScoringService';
import type { ThreatCategory } from '@/data/threatDictionaries';

export interface ThreatExplanation {
    summary: string;
    details: string[];
    triggeredKeywords: Array<{
        word: string;
        category: string;
        count: number;
    }>;
    categoryExplanations: string[];
}

/**
 * Generate human-readable explanation for threat detection
 */
export function generateThreatExplanation(
    severity: ThreatSeverity,
    score: number,
    matches: ThreatMatch[],
    categoryBreakdown: Record<ThreatCategory, number>,
    chunksInvolved: number
): ThreatExplanation {
    const details: string[] = [];
    const categoryExplanations: string[] = [];

    // Generate summary
    const summary = generateSummary(severity, score, matches.length, chunksInvolved);

    // Count keyword occurrences
    const keywordCounts = new Map<string, { category: string; count: number }>();
    matches.forEach(match => {
        const key = match.word.toLowerCase();
        if (keywordCounts.has(key)) {
            keywordCounts.get(key)!.count++;
        } else {
            keywordCounts.set(key, {
                category: formatCategory(match.category),
                count: 1
            });
        }
    });

    // Convert to array and sort by count
    const triggeredKeywords = Array.from(keywordCounts.entries())
        .map(([word, data]) => ({
            word,
            category: data.category,
            count: data.count
        }))
        .sort((a, b) => b.count - a.count);

    // Generate category-specific explanations
    Object.entries(categoryBreakdown).forEach(([category, count]) => {
        if (count > 0) {
            const explanation = generateCategoryExplanation(
                category as ThreatCategory,
                count,
                matches.filter(m => m.category === category)
            );
            categoryExplanations.push(explanation);
            details.push(explanation);
        }
    });

    // Add repetition explanation
    if (chunksInvolved > 1) {
        details.push(`Threats detected across ${chunksInvolved} audio segments`);
    }

    // Add context examples
    const contextExamples = getContextExamples(matches, 3);
    if (contextExamples.length > 0) {
        details.push('Context examples:');
        contextExamples.forEach(example => {
            details.push(`  • "${example}"`);
        });
    }

    return {
        summary,
        details,
        triggeredKeywords,
        categoryExplanations
    };
}

/**
 * Generate summary sentence
 */
function generateSummary(
    severity: ThreatSeverity,
    score: number,
    matchCount: number,
    chunksInvolved: number
): string {
    if (severity === 'SAFE') {
        return 'Session classified as SAFE. No significant threat indicators detected.';
    }

    const severityText = severity === 'HIGH_RISK' ? 'HIGH RISK' : 'SUSPICIOUS';
    const plural = matchCount === 1 ? 'keyword' : 'keywords';
    const chunkText = chunksInvolved === 1 ? 'segment' : 'segments';

    return `Session flagged as ${severityText} (score: ${score}) due to ${matchCount} threat-related ${plural} detected across ${chunksInvolved} audio ${chunkText}.`;
}

/**
 * Generate explanation for a specific category
 */
function generateCategoryExplanation(
    category: ThreatCategory,
    count: number,
    matches: ThreatMatch[]
): string {
    const categoryName = formatCategory(category);
    const uniqueWords = new Set(matches.map(m => m.word));
    const wordList = Array.from(uniqueWords).slice(0, 5).map(w => `"${w}"`).join(', ');

    if (count === 1) {
        return `${categoryName} keyword detected: ${wordList}`;
    } else {
        const more = uniqueWords.size > 5 ? ` and ${uniqueWords.size - 5} more` : '';
        return `${count} ${categoryName} keywords detected: ${wordList}${more}`;
    }
}

/**
 * Format category name for display
 */
function formatCategory(category: ThreatCategory): string {
    const formatted: Record<ThreatCategory, string> = {
        violent_actions: 'Violent action',
        weapons: 'Weapon',
        events: 'Event',
        targets: 'Target',
        urgency: 'Urgency'
    };
    return formatted[category] || category;
}

/**
 * Get context examples from matches
 */
function getContextExamples(matches: ThreatMatch[], maxExamples: number): string[] {
    const examples: string[] = [];
    const seen = new Set<string>();

    for (const match of matches) {
        if (examples.length >= maxExamples) break;
        if (!match.context) continue;

        // Avoid duplicate contexts
        const normalized = match.context.toLowerCase().trim();
        if (seen.has(normalized)) continue;

        seen.add(normalized);
        examples.push(match.context);
    }

    return examples;
}

/**
 * Generate short explanation for UI badge
 */
export function generateShortExplanation(
    severity: ThreatSeverity,
    score: number
): string {
    if (severity === 'SAFE') {
        return 'No threats detected';
    } else if (severity === 'SUSPICIOUS') {
        return `Potential threat indicators (score: ${score})`;
    } else {
        return `High-risk content detected (score: ${score})`;
    }
}

/**
 * Format explanation for export
 */
export function formatExplanationForExport(explanation: ThreatExplanation): string {
    let text = explanation.summary + '\n\n';

    if (explanation.details.length > 0) {
        text += 'Details:\n';
        explanation.details.forEach(detail => {
            text += `- ${detail}\n`;
        });
    }

    return text;
}
