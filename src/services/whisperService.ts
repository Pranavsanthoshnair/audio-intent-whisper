/**
 * Whisper Service
 * Real offline speech-to-text using Whisper.js (Transformers.js)
 */

import { WHISPER_CONFIG, WhisperLanguageCode } from '@/config/whisper.config';
import type { Language } from './offlineStorage';

// Global pipeline instance (singleton)
let whisperPipeline: any = null;
let isModelLoading = false;
let modelLoadProgress = 0;
let modelLoadError: string | null = null;

export interface WhisperTranscriptionResult {
    text: string;
    language: Language;
    confidence: number;
    chunks?: Array<{
        text: string;
        timestamp: [number, number];
    }>;
}

/**
 * Initialize Whisper model
 * Downloads and caches model on first use
 */
export async function initializeWhisperModel(
    onProgress?: (progress: number) => void
): Promise<void> {
    if (whisperPipeline) {
        console.log('✓ Whisper model already loaded');
        return;
    }

    if (isModelLoading) {
        console.log('⏳ Whisper model is already loading...');
        return new Promise((resolve, reject) => {
            const checkInterval = setInterval(() => {
                if (!isModelLoading) {
                    clearInterval(checkInterval);
                    if (whisperPipeline) {
                        resolve();
                    } else {
                        reject(new Error(modelLoadError || 'Model loading failed'));
                    }
                }
            }, 500);
        });
    }

    try {
        isModelLoading = true;
        modelLoadError = null;
        console.log(`🔄 Loading Whisper model: ${WHISPER_CONFIG.modelName}...`);

        // Dynamically import transformers
        const { pipeline, env } = await import('@xenova/transformers');

        // Configure environment for better reliability
        env.allowLocalModels = false;
        env.allowRemoteModels = true;
        env.useBrowserCache = true;

        // Use jsdelivr CDN as fallback (more reliable than HuggingFace direct)
        env.backends.onnx.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/';

        console.log('📦 Transformers.js environment configured');
        console.log('🌐 Using CDN:', env.backends.onnx.wasm.wasmPaths);

        // Create pipeline with timeout
        const pipelinePromise = pipeline(
            'automatic-speech-recognition',
            WHISPER_CONFIG.modelName,
            {
                progress_callback: (progress: any) => {
                    console.log('📊 Progress:', progress);

                    if (progress.status === 'progress' && progress.total) {
                        const percent = Math.round((progress.loaded / progress.total) * 100);
                        modelLoadProgress = percent;
                        if (onProgress) {
                            onProgress(percent);
                        }
                        console.log(`📥 ${progress.file}: ${percent}%`);
                    } else if (progress.status === 'done') {
                        console.log(`✓ Downloaded: ${progress.file}`);
                    } else if (progress.status === 'ready') {
                        console.log('✓ Model ready');
                    } else if (progress.status === 'initiate') {
                        console.log(`🔽 Starting download: ${progress.file}`);
                    }
                },
            }
        );

        // 3-minute timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
                reject(new Error('Model loading timeout. Please check your internet connection and try again.'));
            }, 180000);
        });

        whisperPipeline = await Promise.race([pipelinePromise, timeoutPromise]);

        console.log('✅ Whisper model loaded successfully');
        isModelLoading = false;
        modelLoadProgress = 100;

        if (onProgress) {
            onProgress(100);
        }
    } catch (error) {
        isModelLoading = false;
        modelLoadProgress = 0;

        // Better error messages
        let errorMessage = 'Unknown error';
        if (error instanceof Error) {
            errorMessage = error.message;

            // Detect specific error types
            if (errorMessage.includes('<!doctype') || errorMessage.includes('not valid JSON')) {
                errorMessage = 'Network error: Unable to download model files. Please check your internet connection or try a different network.';
            } else if (errorMessage.includes('CORS')) {
                errorMessage = 'CORS error: Model files blocked by browser security. Try using Chrome or Edge.';
            } else if (errorMessage.includes('timeout')) {
                errorMessage = 'Download timeout: Your connection may be too slow. Try using a smaller model or better internet.';
            }
        }

        modelLoadError = errorMessage;
        console.error('❌ Whisper model loading failed:', errorMessage);
        console.error('Full error:', error);

        throw new Error(errorMessage);
    }
}

/**
 * Preprocess audio for Whisper
 */
export async function preprocessAudio(audioBlob: Blob): Promise<Float32Array> {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const targetSampleRate = 16000;
        let resampledBuffer = audioBuffer;

        if (audioBuffer.sampleRate !== targetSampleRate) {
            const offlineContext = new OfflineAudioContext(
                1,
                Math.ceil(audioBuffer.duration * targetSampleRate),
                targetSampleRate
            );

            const source = offlineContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(offlineContext.destination);
            source.start(0);

            resampledBuffer = await offlineContext.startRendering();
        }

        const monoData = resampledBuffer.getChannelData(0);
        console.log(`✓ Audio preprocessed: ${monoData.length} samples at 16kHz`);
        return monoData;
    } catch (error) {
        console.error('Audio preprocessing error:', error);
        throw new Error('Failed to preprocess audio');
    }
}

/**
 * Detect language from audio
 */
export async function detectLanguage(audioBlob: Blob): Promise<Language> {
    try {
        if (!whisperPipeline) {
            throw new Error('Whisper model not loaded');
        }

        const audioData = await preprocessAudio(audioBlob);
        const sampleChunk = audioData.slice(0, 16000 * 10);

        console.log('🔍 Detecting language...');

        const result = await whisperPipeline(sampleChunk, {
            language: null,
            task: 'transcribe',
            return_timestamps: false,
        });

        const detectedLang = result.language || 'en';
        const langCode = detectedLang.substring(0, 2) as WhisperLanguageCode;

        const languageMap: Record<WhisperLanguageCode, Language> = {
            'hi': 'hindi',
            'ur': 'urdu',
            'ks': 'kashmiri',
            'en': 'english',
        };

        const language = languageMap[langCode] || 'english';
        console.log(`✓ Detected: ${language}`);

        return language;
    } catch (error) {
        console.error('Language detection error:', error);
        return 'english';
    }
}

/**
 * Transcribe audio using Whisper
 */
export async function transcribeAudio(
    audioBlob: Blob,
    language?: Language
): Promise<WhisperTranscriptionResult> {
    try {
        if (!whisperPipeline) {
            throw new Error('Whisper model not loaded');
        }

        console.log('🎤 Transcribing...');

        const audioData = await preprocessAudio(audioBlob);

        const langMap: Record<Language, WhisperLanguageCode> = {
            'hindi': 'hi',
            'urdu': 'ur',
            'kashmiri': 'ks',
            'english': 'en',
        };

        const whisperLang = language ? langMap[language] : null;

        const result = await whisperPipeline(audioData, {
            language: whisperLang,
            task: WHISPER_CONFIG.task,
            return_timestamps: WHISPER_CONFIG.return_timestamps,
            chunk_length_s: WHISPER_CONFIG.chunk_length_s,
            stride_length_s: WHISPER_CONFIG.stride_length_s,
        });

        const text = result.text || '';
        const detectedLang = result.language || whisperLang || 'en';
        const chunks = result.chunks || [];
        const confidence = 0.85;

        const langCode = detectedLang.substring(0, 2) as WhisperLanguageCode;
        const finalLanguage = WHISPER_CONFIG.languageMap[langCode] || 'english';

        console.log(`✓ Transcribed: "${text.substring(0, 50)}..."`);

        return {
            text,
            language: finalLanguage,
            confidence,
            chunks: chunks.map((chunk: any) => ({
                text: chunk.text,
                timestamp: chunk.timestamp,
            })),
        };
    } catch (error) {
        console.error('Transcription error:', error);
        throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Get model status
 */
export function getModelStatus(): {
    isLoaded: boolean;
    isLoading: boolean;
    progress: number;
    error: string | null;
} {
    return {
        isLoaded: whisperPipeline !== null,
        isLoading: isModelLoading,
        progress: modelLoadProgress,
        error: modelLoadError,
    };
}

/**
 * Unload model
 */
export function unloadModel(): void {
    whisperPipeline = null;
    modelLoadProgress = 0;
    modelLoadError = null;
    console.log('✓ Model unloaded');
}

/**
 * Reset state for retry
 */
export function resetModelState(): void {
    isModelLoading = false;
    modelLoadProgress = 0;
    modelLoadError = null;
    whisperPipeline = null;
    console.log('✓ State reset');
}
