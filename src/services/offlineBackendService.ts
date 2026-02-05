/**
 * Offline Backend Service Client
 * Handles communication with local Node.js backend
 * 
 * TODO (Checkpoint 3): Add AI processing endpoints
 */

const BACKEND_URL = 'http://localhost:3001';
const REQUEST_TIMEOUT = 5000; // 5 seconds

export interface BackendHealth {
    status: 'online' | 'offline';
    mode: string;
    engine: string;
    uptime: number;
    timestamp: string;
    message: string;
}

export interface SessionData {
    caseId: string;
    inputType: 'record' | 'upload';
    mode: string;
    engine: string;
    status: string;
    createdAt: string;
}

/**
 * Create a fetch request with timeout
 */
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = REQUEST_TIMEOUT) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
};

/**
 * Check backend health status
 */
export const checkBackendHealth = async (): Promise<BackendHealth | null> => {
    try {
        const response = await fetchWithTimeout(`${BACKEND_URL}/health`);

        if (!response.ok) {
            throw new Error(`Health check failed: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.warn('Backend health check failed:', error);
        return null;
    }
};

/**
 * Ping backend for quick connectivity check
 */
export const pingBackend = async (): Promise<boolean> => {
    try {
        const response = await fetchWithTimeout(`${BACKEND_URL}/api/ping`, {}, 2000);
        return response.ok;
    } catch (error) {
        return false;
    }
};

/**
 * Initialize a new session/case
 */
export const initializeSession = async (inputType: 'record' | 'upload'): Promise<SessionData> => {
    try {
        const response = await fetchWithTimeout(`${BACKEND_URL}/api/init-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ inputType }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to initialize session');
        }

        const data = await response.json();
        console.log('✓ Session initialized:', data.caseId);
        return data;
    } catch (error) {
        console.error('Session initialization error:', error);
        throw error;
    }
};

/**
 * Get session details by case ID
 */
export const getSession = async (caseId: string): Promise<SessionData | null> => {
    try {
        const response = await fetchWithTimeout(`${BACKEND_URL}/api/session/${caseId}`);

        if (!response.ok) {
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('Get session error:', error);
        return null;
    }
};

/**
 * Get all sessions (for debugging)
 */
export const getAllSessions = async (): Promise<SessionData[]> => {
    try {
        const response = await fetchWithTimeout(`${BACKEND_URL}/api/sessions`);

        if (!response.ok) {
            return [];
        }

        const data = await response.json();
        return data.sessions || [];
    } catch (error) {
        console.error('Get all sessions error:', error);
        return [];
    }
};

export const offlineBackendService = {
    checkHealth: checkBackendHealth,
    ping: pingBackend,
    initSession: initializeSession,
    getSession,
    getAllSessions,
};
