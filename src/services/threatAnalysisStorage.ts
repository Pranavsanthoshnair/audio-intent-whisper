/**
 * Threat Analysis Storage Service
 * CRUD operations for threat analysis in IndexedDB
 */

import { initDB, type ThreatAnalysisRecord } from './offlineStorage';

/**
 * Store threat analysis for a session
 */
export async function storeThreatAnalysis(analysis: ThreatAnalysisRecord): Promise<void> {
    const db = await initDB();
    const transaction = db.transaction(['threatAnalysis'], 'readwrite');
    const store = transaction.objectStore('threatAnalysis');

    return new Promise((resolve, reject) => {
        const request = store.put(analysis);

        request.onsuccess = () => {
            console.log(`✓ Threat analysis stored: ${analysis.analysisId}`);
            resolve();
        };

        request.onerror = () => {
            reject(new Error('Failed to store threat analysis'));
        };
    });
}

/**
 * Get threat analysis by session ID
 */
export async function getThreatAnalysisBySession(sessionId: string): Promise<ThreatAnalysisRecord | null> {
    const db = await initDB();
    const transaction = db.transaction(['threatAnalysis'], 'readonly');
    const store = transaction.objectStore('threatAnalysis');
    const index = store.index('sessionId');

    return new Promise((resolve, reject) => {
        const request = index.get(sessionId);

        request.onsuccess = () => {
            resolve(request.result || null);
        };

        request.onerror = () => {
            reject(new Error('Failed to get threat analysis'));
        };
    });
}

/**
 * Get all threat analyses
 */
export async function getAllThreatAnalyses(): Promise<ThreatAnalysisRecord[]> {
    const db = await initDB();
    const transaction = db.transaction(['threatAnalysis'], 'readonly');
    const store = transaction.objectStore('threatAnalysis');

    return new Promise((resolve, reject) => {
        const request = store.getAll();

        request.onsuccess = () => {
            resolve(request.result || []);
        };

        request.onerror = () => {
            reject(new Error('Failed to get threat analyses'));
        };
    });
}

/**
 * Get high-risk sessions
 */
export async function getHighRiskSessions(): Promise<ThreatAnalysisRecord[]> {
    const db = await initDB();
    const transaction = db.transaction(['threatAnalysis'], 'readonly');
    const store = transaction.objectStore('threatAnalysis');
    const index = store.index('severity');

    return new Promise((resolve, reject) => {
        const request = index.getAll('HIGH_RISK');

        request.onsuccess = () => {
            resolve(request.result || []);
        };

        request.onerror = () => {
            reject(new Error('Failed to get high-risk sessions'));
        };
    });
}

/**
 * Delete threat analysis by session ID
 */
export async function deleteThreatAnalysisBySession(sessionId: string): Promise<void> {
    const db = await initDB();
    const transaction = db.transaction(['threatAnalysis'], 'readwrite');
    const store = transaction.objectStore('threatAnalysis');
    const index = store.index('sessionId');

    return new Promise((resolve, reject) => {
        const getRequest = index.getKey(sessionId);

        getRequest.onsuccess = () => {
            const key = getRequest.result;
            if (!key) {
                resolve();
                return;
            }

            const deleteRequest = store.delete(key);

            deleteRequest.onsuccess = () => {
                console.log(`✓ Threat analysis deleted for session: ${sessionId}`);
                resolve();
            };

            deleteRequest.onerror = () => {
                reject(new Error('Failed to delete threat analysis'));
            };
        };

        getRequest.onerror = () => {
            reject(new Error('Failed to find threat analysis'));
        };
    });
}

/**
 * Delete all threat analyses
 */
export async function deleteAllThreatAnalyses(): Promise<void> {
    const db = await initDB();
    const transaction = db.transaction(['threatAnalysis'], 'readwrite');
    const store = transaction.objectStore('threatAnalysis');

    return new Promise((resolve, reject) => {
        const request = store.clear();

        request.onsuccess = () => {
            console.log('✓ All threat analyses deleted');
            resolve();
        };

        request.onerror = () => {
            reject(new Error('Failed to delete threat analyses'));
        };
    });
}
