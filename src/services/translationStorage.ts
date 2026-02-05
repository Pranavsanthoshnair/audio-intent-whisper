/**
 * Translation Storage Operations
 * CRUD operations for translations in IndexedDB
 */

import { TranslationRecord, initDB } from './offlineStorage';

/**
 * Store translation
 */
export async function storeTranslation(
    translation: Omit<TranslationRecord, 'createdAt'>
): Promise<string> {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['translations'], 'readwrite');
        const store = transaction.objectStore('translations');

        const record: TranslationRecord = {
            ...translation,
            createdAt: new Date(),
        };

        const request = store.put(record);

        request.onsuccess = () => {
            console.log(`✓ Stored translation: ${record.translationId}`);
            resolve(record.translationId);
        };

        request.onerror = () => {
            reject(new Error('Failed to store translation'));
        };
    });
}

/**
 * Get translations by session
 */
export async function getTranslationsBySession(sessionId: string): Promise<TranslationRecord[]> {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['translations'], 'readonly');
        const store = transaction.objectStore('translations');
        const index = store.index('sessionId');

        const request = index.getAll(sessionId);

        request.onsuccess = () => {
            const translations = request.result || [];
            // Sort by startTime
            translations.sort((a, b) => a.startTime - b.startTime);
            resolve(translations);
        };

        request.onerror = () => {
            reject(new Error('Failed to get translations'));
        };
    });
}

/**
 * Get translation by chunk
 */
export async function getTranslationByChunk(chunkId: string): Promise<TranslationRecord | null> {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['translations'], 'readonly');
        const store = transaction.objectStore('translations');
        const index = store.index('chunkId');

        const request = index.getAll(chunkId);

        request.onsuccess = () => {
            const translations = request.result || [];
            resolve(translations[0] || null);
        };

        request.onerror = () => {
            reject(new Error('Failed to get translation by chunk'));
        };
    });
}

/**
 * Delete translations by session
 */
export async function deleteTranslationsBySession(sessionId: string): Promise<void> {
    const db = await initDB();
    const translations = await getTranslationsBySession(sessionId);

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['translations'], 'readwrite');
        const store = transaction.objectStore('translations');

        translations.forEach((translation) => {
            store.delete(translation.translationId);
        });

        transaction.oncomplete = () => {
            console.log(`✓ Deleted ${translations.length} translations for session ${sessionId}`);
            resolve();
        };

        transaction.onerror = () => {
            reject(new Error('Failed to delete translations'));
        };
    });
}

/**
 * Delete all translations
 */
export async function deleteAllTranslations(): Promise<void> {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['translations'], 'readwrite');
        const store = transaction.objectStore('translations');

        const request = store.clear();

        request.onsuccess = () => {
            console.log('✓ Deleted all translations');
            resolve();
        };

        request.onerror = () => {
            reject(new Error('Failed to delete all translations'));
        };
    });
}
