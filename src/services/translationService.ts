/**
 * Translation Service
 * Offline translation engine for Hindi/Urdu/Kashmiri → English
 * Checkpoint 4: Mock translation with dictionary-based phrase mapping
 */

import type { Language } from './offlineStorage';
import type { TranscriptChunk } from './sttService';

export interface TranslationChunk {
    chunkId: string;
    sourceLanguage: Language;
    sourceText: string;
    translatedText: string;
    confidence?: number;
    startTime: number;
}

export interface TranslationEngine {
    translate(text: string, sourceLang: Language): Promise<string>;
    translateChunk(chunk: TranscriptChunk): Promise<TranslationChunk>;
}

/**
 * Mock Translation Engine
 * Uses dictionary-based phrase mapping for offline translation
 */
class MockTranslationEngine implements TranslationEngine {
    // Dictionary-based phrase mappings
    private readonly phraseDictionary: Record<Language, Record<string, string>> = {
        hindi: {
            'यह एक परीक्षण ऑडियो है': 'This is a test audio',
            'कृपया ध्यान से सुनें': 'Please listen carefully',
            'धन्यवाद': 'Thank you',
        },
        urdu: {
            'یہ ایک ٹیسٹ آڈیو ہے': 'This is a test audio',
            'براہ کرم غور سے سنیں': 'Please listen carefully',
            'شکریہ': 'Thank you',
        },
        kashmiri: {
            'یہ اکھ ٹیسٹ آڈیو چھُ': 'This is a test audio',
            'مہربأنی کٔرتھ غور سٟتؠ بوزِو': 'Please listen carefully',
            'شُکریہ': 'Thank you',
        },
        english: {
            'This is a test audio recording': 'This is a test audio recording',
            'Please listen carefully': 'Please listen carefully',
            'Thank you': 'Thank you',
        },
    };

    // Common word mappings for fallback
    private readonly wordMappings: Record<Language, Record<string, string>> = {
        hindi: {
            'यह': 'this',
            'एक': 'a',
            'है': 'is',
            'परीक्षण': 'test',
            'ऑडियो': 'audio',
        },
        urdu: {
            'یہ': 'this',
            'ایک': 'a',
            'ہے': 'is',
            'ٹیسٹ': 'test',
            'آڈیو': 'audio',
        },
        kashmiri: {
            'یہ': 'this',
            'اکھ': 'a',
            'چھُ': 'is',
            'ٹیسٹ': 'test',
            'آڈیو': 'audio',
        },
        english: {},
    };

    /**
     * Translate text from source language to English
     */
    async translate(text: string, sourceLang: Language): Promise<string> {
        // Simulate translation delay
        await this.simulateDelay(300, 800);

        // If already English, return as-is
        if (sourceLang === 'english') {
            return text;
        }

        // Try exact phrase match first
        const phraseMatch = this.phraseDictionary[sourceLang][text];
        if (phraseMatch) {
            return phraseMatch;
        }

        // Fallback: word-by-word translation
        const words = text.split(' ');
        const translatedWords = words.map((word) => {
            const wordMatch = this.wordMappings[sourceLang][word];
            return wordMatch || word; // Keep original if no mapping
        });

        return translatedWords.join(' ');
    }

    /**
     * Translate a transcript chunk
     */
    async translateChunk(chunk: TranscriptChunk): Promise<TranslationChunk> {
        const translatedText = await this.translate(chunk.text, chunk.language);

        // Calculate confidence based on translation method
        const confidence = this.calculateConfidence(chunk.text, chunk.language);

        return {
            chunkId: chunk.chunkId,
            sourceLanguage: chunk.language,
            sourceText: chunk.text,
            translatedText,
            confidence,
            startTime: chunk.startTime,
        };
    }

    /**
     * Calculate translation confidence
     */
    private calculateConfidence(text: string, sourceLang: Language): number {
        if (sourceLang === 'english') {
            return 1.0; // Perfect confidence for English
        }

        // Check if exact phrase match exists
        if (this.phraseDictionary[sourceLang][text]) {
            return 0.9 + Math.random() * 0.1; // 0.9-1.0 for exact matches
        }

        // Lower confidence for word-by-word translation
        return 0.6 + Math.random() * 0.2; // 0.6-0.8 for fallback
    }

    /**
     * Simulate processing delay
     */
    private simulateDelay(min: number, max: number): Promise<void> {
        const delay = Math.random() * (max - min) + min;
        return new Promise((resolve) => setTimeout(resolve, delay));
    }
}

/**
 * Placeholder for real translation engine (e.g., transformers.js)
 */
class OfflineTranslationEngine implements TranslationEngine {
    async translate(text: string, sourceLang: Language): Promise<string> {
        // TODO (Future): Integrate transformers.js or similar offline model
        throw new Error('Offline translation model not yet implemented');
    }

    async translateChunk(chunk: TranscriptChunk): Promise<TranslationChunk> {
        throw new Error('Offline translation model not yet implemented');
    }
}

/**
 * Factory function to create translation engine
 */
export function createTranslationEngine(type: 'mock' | 'offline' = 'mock'): TranslationEngine {
    switch (type) {
        case 'mock':
            return new MockTranslationEngine();
        case 'offline':
            return new OfflineTranslationEngine();
        default:
            throw new Error(`Unknown translation engine type: ${type}`);
    }
}

/**
 * Translate multiple chunks with progress callback
 */
export async function translateChunks(
    transcriptChunks: TranscriptChunk[],
    onProgress?: (current: number, total: number) => void
): Promise<TranslationChunk[]> {
    const engine = createTranslationEngine('mock');
    const translations: TranslationChunk[] = [];

    for (let i = 0; i < transcriptChunks.length; i++) {
        const translation = await engine.translateChunk(transcriptChunks[i]);
        translations.push(translation);

        if (onProgress) {
            onProgress(i + 1, transcriptChunks.length);
        }
    }

    return translations;
}
