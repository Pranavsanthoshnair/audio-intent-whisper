/**
 * Audio Storage Service
 * Handles storing and retrieving audio from IndexedDB
 */

import { v4 as uuidv4 } from 'uuid';
import {
    AudioRecord,
    saveAudio as saveAudioToDB,
    getAudio as getAudioFromDB,
    deleteAudio as deleteAudioFromDB,
} from './offlineStorage';

// Import getAudioBySession directly from offlineStorage
import { getAudioBySession as getAudioBySessionFromDB } from './offlineStorage';

/**
 * Store audio in IndexedDB
 */
export const storeAudio = async (
    sessionId: string,
    audioBlob: Blob,
    format: 'wav' | 'mp3' | 'webm',
    duration: number
): Promise<string> => {
    const audioId = `audio-${uuidv4().slice(0, 8)}`;

    const audioRecord: AudioRecord = {
        audioId,
        sessionId,
        audioBlob,
        format,
        duration,
        size: audioBlob.size,
        createdAt: new Date(),
    };

    await saveAudioToDB(audioRecord);
    console.log(`✓ Audio stored: ${audioId} (${(audioBlob.size / 1024).toFixed(2)} KB)`);

    return audioId;
};

/**
 * Get audio by ID
 */
export const getAudio = async (audioId: string): Promise<AudioRecord | null> => {
    return await getAudioFromDB(audioId);
};

/**
 * Get audio for a session
 */
export const getAudioBySession = async (sessionId: string): Promise<AudioRecord | null> => {
    return await getAudioBySessionFromDB(sessionId);
};

/**
 * Delete audio
 */
export const deleteAudio = async (audioId: string): Promise<void> => {
    await deleteAudioFromDB(audioId);
    console.log(`✓ Audio deleted: ${audioId}`);
};

/**
 * Get audio blob URL for playback
 */
export const getAudioBlobUrl = async (audioId: string): Promise<string | null> => {
    const audio = await getAudioFromDB(audioId);
    if (!audio) return null;

    return URL.createObjectURL(audio.audioBlob);
};

/**
 * Extract metadata from audio file
 */
export const extractAudioMetadata = async (file: File): Promise<{
    duration: number;
    format: 'wav' | 'mp3' | 'webm';
    size: number;
}> => {
    return new Promise((resolve, reject) => {
        const audio = new Audio();
        const url = URL.createObjectURL(file);

        audio.onloadedmetadata = () => {
            URL.revokeObjectURL(url);

            const format = file.type.includes('wav') ? 'wav' :
                file.type.includes('mp3') ? 'mp3' : 'webm';

            resolve({
                duration: audio.duration,
                format,
                size: file.size,
            });
        };

        audio.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load audio metadata'));
        };

        audio.src = url;
    });
};

/**
 * Validate audio file
 */
export const validateAudioFile = (file: File): { valid: boolean; error?: string } => {
    const validTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/webm'];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!validTypes.includes(file.type)) {
        return {
            valid: false,
            error: 'Invalid file type. Please upload WAV or MP3 files only.',
        };
    }

    if (file.size > maxSize) {
        return {
            valid: false,
            error: 'File too large. Maximum size is 50MB.',
        };
    }

    return { valid: true };
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

/**
 * Format duration for display
 */
export const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};
