/**
 * Session Management Service
 * Handles session creation, retrieval, and lifecycle management
 */

import { v4 as uuidv4 } from 'uuid';
import {
    Session,
    saveSession as saveSessionToDB,
    getSession as getSessionFromDB,
    getAllSessions as getAllSessionsFromDB,
    updateSessionStatus as updateSessionStatusInDB,
    deleteSession as deleteSessionFromDB,
    getSessionWithAudio,
    deleteSessionWithAudio,
} from './offlineStorage';

/**
 * Create a new session
 */
export const createSession = async (inputMode: 'record' | 'upload'): Promise<Session> => {
    const session: Session = {
        sessionId: `session-${uuidv4().slice(0, 8)}`,
        createdAt: new Date().toISOString(),
        inputMode,
        status: 'initialized',
    };

    await saveSessionToDB(session);
    console.log('✓ Session created:', session.sessionId);

    return session;
};

/**
 * Get session by ID
 */
export const getSession = async (sessionId: string): Promise<Session | null> => {
    return await getSessionFromDB(sessionId);
};

/**
 * Get all sessions
 */
export const getAllSessions = async (): Promise<Session[]> => {
    return await getAllSessionsFromDB();
};

/**
 * Update session status
 */
export const updateSessionStatus = async (
    sessionId: string,
    status: Session['status'],
    audioId?: string
): Promise<void> => {
    await updateSessionStatusInDB(sessionId, status, audioId);
    console.log(`✓ Session ${sessionId} status updated to: ${status}`);
};

/**
 * Attach audio to session
 */
export const attachAudioToSession = async (
    sessionId: string,
    audioId: string
): Promise<void> => {
    await updateSessionStatusInDB(sessionId, 'audio_attached', audioId);
    console.log(`✓ Audio ${audioId} attached to session ${sessionId}`);
};

/**
 * Get session with audio data
 */
export const getSessionWithAudioData = async (sessionId: string) => {
    return await getSessionWithAudio(sessionId);
};

/**
 * Delete session and associated audio
 */
export const deleteSessionAndAudio = async (sessionId: string): Promise<void> => {
    await deleteSessionWithAudio(sessionId);
    console.log(`✓ Session ${sessionId} and associated audio deleted`);
};

/**
 * Delete session only (keep audio)
 */
export const deleteSession = async (sessionId: string): Promise<void> => {
    await deleteSessionFromDB(sessionId);
    console.log(`✓ Session ${sessionId} deleted`);
};
