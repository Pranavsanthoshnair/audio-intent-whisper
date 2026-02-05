/**
 * Transcript CRUD Operations
 */

import { TranscriptRecord, initDB } from './offlineStorage';

// Store transcript
export async function storeTranscript(transcript: Omit<TranscriptRecord, 'createdAt'>): Promise<string> {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['transcripts'], 'readwrite');
        const store = transaction.objectStore('transcripts');

        const record: TranscriptRecord = {
            ...transcript,
            createdAt: new Date(),
        };

        const request = store.put(record);

        request.onsuccess = () => {
            console.log(`✓ Stored transcript: ${record.transcriptId}`);
            resolve(record.transcriptId);
        };

        request.onerror = () => {
            reject(new Error('Failed to store transcript'));
        };
    });
}

// Get transcripts by session
export async function getTranscriptsBySession(sessionId: string): Promise<TranscriptRecord[]> {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['transcripts'], 'readonly');
        const store = transaction.objectStore('transcripts');
        const index = store.index('sessionId');

        const request = index.getAll(sessionId);

        request.onsuccess = () => {
            const transcripts = request.result || [];
            // Sort by startTime
            transcripts.sort((a, b) => a.startTime - b.startTime);
            resolve(transcripts);
        };

        request.onerror = () => {
            reject(new Error('Failed to get transcripts'));
        };
    });
}

// Get transcript by chunk
export async function getTranscriptByChunk(chunkId: string): Promise<TranscriptRecord | null> {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['transcripts'], 'readonly');
        const store = transaction.objectStore('transcripts');
        const index = store.index('chunkId');

        const request = index.getAll(chunkId);

        request.onsuccess = () => {
            const transcripts = request.result || [];
            resolve(transcripts[0] || null);
        };

        request.onerror = () => {
            reject(new Error('Failed to get transcript by chunk'));
        };
    });
}

// Delete transcripts by session
export async function deleteTranscriptsBySession(sessionId: string): Promise<void> {
    const db = await initDB();
    const transcripts = await getTranscriptsBySession(sessionId);

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['transcripts'], 'readwrite');
        const store = transaction.objectStore('transcripts');

        transcripts.forEach((transcript) => {
            store.delete(transcript.transcriptId);
        });

        transaction.oncomplete = () => {
            console.log(`✓ Deleted ${transcripts.length} transcripts for session ${sessionId}`);
            resolve();
        };

        transaction.onerror = () => {
            reject(new Error('Failed to delete transcripts'));
        };
    });
}

// Delete all transcripts
export async function deleteAllTranscripts(): Promise<void> {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['transcripts'], 'readwrite');
        const store = transaction.objectStore('transcripts');

        const request = store.clear();

        request.onsuccess = () => {
            console.log('✓ Deleted all transcripts');
            resolve();
        };

        request.onerror = () => {
            reject(new Error('Failed to delete all transcripts'));
        };
    });
}
