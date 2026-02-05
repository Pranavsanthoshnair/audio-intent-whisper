/**
 * Offline Storage Service - IndexedDB v3
 * Manages local storage for sessions, audio, and transcripts
 * 
 * Version History:
 * - v1: Initial schema
 * - v2: Added sessions and audio tables (Checkpoint 2)
 * - v3: Added transcripts table (Checkpoint 3)
 * - v3: Added transcripts table (Checkpoint 3)
 */

const DB_NAME = 'OfflineAudioIntentDB';
const DB_VERSION = 3; // Updated for transcripts

export type Language = 'hindi' | 'urdu' | 'kashmiri' | 'english';

// Type definitions
export interface Session {
    sessionId: string;
    createdAt: Date;
    inputMode: 'record' | 'upload';
    status: 'created' | 'audio_attached' | 'transcribed' | 'translated' | 'analyzed';
    audioId?: string;
}

export interface AudioRecord {
    audioId: string;
    sessionId: string;
    audioBlob: Blob;
    format: 'wav' | 'mp3' | 'webm';
    duration: number; // seconds
    size: number; // bytes
    createdAt: Date;
}

export interface TranscriptRecord {
    transcriptId: string;
    sessionId: string;
    chunkId: string;
    text: string;
    language: Language;
    confidence: number; // 0-1
    startTime: number; // seconds
    createdAt: Date;
}

// Future table schemas (not implemented yet)
export interface Transcript {
    transcriptId: string;
    sessionId: string;
    text: string;
    language: string;
    confidence: number;
    createdAt: string;
}

export interface Translation {
    translationId: string;
    transcriptId: string;
    targetLanguage: string;
    translatedText: string;
    createdAt: string;
}

export interface ThreatAnalysis {
    analysisId: string;
    sessionId: string;
    threatScore: number;
    threatLevel: 'low' | 'medium' | 'high' | 'critical';
    indicators: string[];
    createdAt: string;
}

/**
 * Initialize IndexedDB with updated schema
 */
export const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            reject(new Error('Failed to open IndexedDB'));
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            const oldVersion = event.oldVersion;

            console.log(`Upgrading IndexedDB from v${oldVersion} to v${DB_VERSION}`);

            // v1 -> v2: Create sessions and audio tables
            if (oldVersion < 2) {
                if (!db.objectStoreNames.contains('sessions')) {
                    const sessionsStore = db.createObjectStore('sessions', { keyPath: 'sessionId' });
                    sessionsStore.createIndex('createdAt', 'createdAt', { unique: false });
                    sessionsStore.createIndex('status', 'status', { unique: false });
                    console.log('✓ Created sessions table');
                }

                if (!db.objectStoreNames.contains('audio')) {
                    const audioStore = db.createObjectStore('audio', { keyPath: 'audioId' });
                    audioStore.createIndex('sessionId', 'sessionId', { unique: false });
                    audioStore.createIndex('createdAt', 'createdAt', { unique: false });
                    console.log('✓ Created audio table');
                }
            }

            // v2 -> v3: Create transcripts table
            if (oldVersion < 3) {
                if (!db.objectStoreNames.contains('transcripts')) {
                    const transcriptsStore = db.createObjectStore('transcripts', { keyPath: 'transcriptId' });
                    transcriptsStore.createIndex('sessionId', 'sessionId', { unique: false });
                    transcriptsStore.createIndex('chunkId', 'chunkId', { unique: false });
                    transcriptsStore.createIndex('createdAt', 'createdAt', { unique: false });
                    console.log('✓ Created transcripts table');
                }
            }

            console.log('✓ IndexedDB schema updated to version', DB_VERSION);
        };
    });
};

// ============================================
// SESSION OPERATIONS
// ============================================

export const saveSession = async (session: Session): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['sessions'], 'readwrite');
        const store = transaction.objectStore('sessions');
        const request = store.put(session);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Failed to save session'));
    });
};

export const getSession = async (sessionId: string): Promise<Session | null> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['sessions'], 'readonly');
        const store = transaction.objectStore('sessions');
        const request = store.get(sessionId);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(new Error('Failed to get session'));
    });
};

export const getAllSessions = async (): Promise<Session[]> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['sessions'], 'readonly');
        const store = transaction.objectStore('sessions');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new Error('Failed to get sessions'));
    });
};

export const updateSessionStatus = async (
    sessionId: string,
    status: Session['status'],
    audioId?: string
): Promise<void> => {
    const session = await getSession(sessionId);
    if (!session) {
        throw new Error('Session not found');
    }

    session.status = status;
    if (audioId) {
        session.audioId = audioId;
    }

    await saveSession(session);
};

export const deleteSession = async (sessionId: string): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['sessions'], 'readwrite');
        const store = transaction.objectStore('sessions');
        const request = store.delete(sessionId);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Failed to delete session'));
    });
};

// ============================================
// AUDIO OPERATIONS
// ============================================

export const saveAudio = async (audio: AudioRecord): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['audio'], 'readwrite');
        const store = transaction.objectStore('audio');
        const request = store.put(audio);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Failed to save audio'));
    });
};

export const getAudio = async (audioId: string): Promise<AudioRecord | null> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['audio'], 'readonly');
        const store = transaction.objectStore('audio');
        const request = store.get(audioId);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(new Error('Failed to get audio'));
    });
};

export const getAudioBySession = async (sessionId: string): Promise<AudioRecord | null> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['audio'], 'readonly');
        const store = transaction.objectStore('audio');
        const index = store.index('sessionId');
        const request = index.get(sessionId);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(new Error('Failed to get audio by session'));
    });
};

export const deleteAudio = async (audioId: string): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['audio'], 'readwrite');
        const store = transaction.objectStore('audio');
        const request = store.delete(audioId);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Failed to delete audio'));
    });
};

// ============================================
// UTILITY OPERATIONS
// ============================================

export const clearAllSessions = async (): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['sessions'], 'readwrite');
        const store = transaction.objectStore('sessions');
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Failed to clear sessions'));
    });
};

export const clearAllAudio = async (): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['audio'], 'readwrite');
        const store = transaction.objectStore('audio');
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Failed to clear audio'));
    });
};

export const clearAllData = async (): Promise<void> => {
    await clearAllSessions();
    await clearAllAudio();
    console.log('✓ All offline data cleared');
};

// ============================================
// SESSION + AUDIO COMBINED OPERATIONS
// ============================================

export const getSessionWithAudio = async (sessionId: string) => {
    const session = await getSession(sessionId);
    if (!session) return null;

    const audio = session.audioId ? await getAudio(session.audioId) : null;

    return {
        session,
        audio,
    };
};

export const deleteSessionWithAudio = async (sessionId: string): Promise<void> => {
    const session = await getSession(sessionId);
    if (!session) return;

    // Delete audio if exists
    if (session.audioId) {
        await deleteAudio(session.audioId);
    }

    // Delete session
    await deleteSession(sessionId);
};
