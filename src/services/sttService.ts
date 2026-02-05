/**
 * Speech-to-Text Service
 * Handles offline transcription with pluggable engine architecture
 * 
 * Checkpoint 3: Mock STT Engine
 * TODO (Future): Replace with Whisper.js for real transcription
 */

import { Language } from './offlineStorage';

export interface TranscriptChunk {
    chunkId: string;
    text: string;
    language: Language;
    confidence: number; // 0-1
    startTime: number; // seconds
    duration: number; // seconds
}

export interface STTEngine {
    transcribe(audioBlob: Blob, chunkId: string, startTime: number): Promise<TranscriptChunk>;
    detectLanguage(audioBlob: Blob): Promise<Language>;
}

/**
 * Mock STT Engine for Development
 * Provides deterministic transcription for testing
 */
class MockSTTEngine implements STTEngine {
    private mockTexts: Record<Language, string[]> = {
        hindi: [
            'यह एक परीक्षण ऑडियो है',
            'हम ऑफ़लाइन ट्रांसक्रिप्शन का परीक्षण कर रहे हैं',
            'यह सिस्टम बहुत अच्छा काम कर रहा है',
        ],
        urdu: [
            'یہ ایک ٹیسٹ آڈیو ہے',
            'ہم آف لائن ٹرانسکرپشن کی جانچ کر رہے ہیں',
            'یہ نظام بہت اچھا کام کر رہا ہے',
        ],
        kashmiri: [
            'یہ اکھ ٹیسٹ آڈیو چھُ',
            'اسہ چھِ آف لائن ٹرانسکرپشن ٹیسٹ کران',
            'یہ سسٹم بہت اچھا کم کر رہا چھُ',
        ],
        english: [
            'This is a test audio recording',
            'We are testing offline transcription',
            'The system is working very well',
        ],
    };

    async transcribe(audioBlob: Blob, chunkId: string, startTime: number): Promise<TranscriptChunk> {
        // Simulate processing delay
        await this.simulateDelay(500, 1500);

        // Detect language based on chunk ID (deterministic)
        const language = await this.detectLanguage(audioBlob);

        // Get mock text for this chunk
        const chunkIndex = parseInt(chunkId.split('-').pop() || '0') % 3;
        const text = this.mockTexts[language][chunkIndex];

        // Generate confidence score (0.7-0.95)
        const confidence = 0.7 + Math.random() * 0.25;

        // Estimate duration from blob size (rough approximation)
        const duration = Math.min(audioBlob.size / 16000, 10); // ~1 second per 16KB

        return {
            chunkId,
            text,
            language,
            confidence: parseFloat(confidence.toFixed(2)),
            startTime,
            duration: parseFloat(duration.toFixed(2)),
        };
    }

    async detectLanguage(audioBlob: Blob): Promise<Language> {
        // Simulate language detection delay
        await this.simulateDelay(200, 500);

        // Mock language detection based on blob size (deterministic)
        const sizeHash = audioBlob.size % 4;
        const languages: Language[] = ['hindi', 'urdu', 'kashmiri', 'english'];

        return languages[sizeHash];
    }

    private simulateDelay(min: number, max: number): Promise<void> {
        const delay = min + Math.random() * (max - min);
        return new Promise((resolve) => setTimeout(resolve, delay));
    }
}

/**
 * Whisper.js STT Engine (Future Implementation)
 * TODO (Future): Implement real Whisper.js integration
 */
class WhisperSTTEngine implements STTEngine {
    async transcribe(audioBlob: Blob, chunkId: string, startTime: number): Promise<TranscriptChunk> {
        throw new Error('Whisper.js engine not implemented yet');
        // TODO: Implement Whisper.js transcription
        // 1. Load Whisper model
        // 2. Convert audio to required format
        // 3. Run inference
        // 4. Extract text, language, and confidence
    }

    async detectLanguage(audioBlob: Blob): Promise<Language> {
        throw new Error('Whisper.js language detection not implemented yet');
        // TODO: Implement Whisper.js language detection
    }
}

/**
 * STT Service Factory
 * Returns the configured STT engine
 */
export function createSTTEngine(type: 'mock' | 'whisper' = 'mock'): STTEngine {
    switch (type) {
        case 'mock':
            return new MockSTTEngine();
        case 'whisper':
            return new WhisperSTTEngine();
        default:
            throw new Error(`Unknown STT engine type: ${type}`);
    }
}

/**
 * Default STT Engine Instance
 */
export const sttEngine = createSTTEngine('mock');

/**
 * Transcribe multiple audio chunks
 */
export async function transcribeChunks(
    chunks: Array<{ chunkId: string; audioBlob: Blob; startTime: number }>,
    onProgress?: (current: number, total: number) => void
): Promise<TranscriptChunk[]> {
    const transcripts: TranscriptChunk[] = [];

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const transcript = await sttEngine.transcribe(chunk.audioBlob, chunk.chunkId, chunk.startTime);
        transcripts.push(transcript);

        if (onProgress) {
            onProgress(i + 1, chunks.length);
        }
    }

    return transcripts;
}
