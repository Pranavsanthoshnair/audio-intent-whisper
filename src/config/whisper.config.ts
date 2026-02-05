/**
 * Whisper Configuration
 * Settings for Whisper.js transcription engine
 */

export const WHISPER_CONFIG = {
    // Using Xenova models which are tested and verified to work
    // Xenova/whisper-tiny.en is English-only but most stable
    // For multilingual, we'll use a workaround
    modelName: 'Xenova/whisper-tiny.en',

    // Language settings
    language: 'en', // English only for this model

    // Task type
    task: 'transcribe' as const,

    // Audio chunking
    chunk_length_s: 30,
    stride_length_s: 5,

    // Processing settings
    return_timestamps: true,

    // Language mapping (even though model is English-only)
    languageMap: {
        'hi': 'hindi',
        'ur': 'urdu',
        'ks': 'kashmiri',
        'en': 'english',
    } as const,
};

export type WhisperLanguageCode = 'hi' | 'ur' | 'ks' | 'en';

// Note: whisper-tiny.en is English-only
// For multilingual support, we need to use translation service
// or implement a different approach
