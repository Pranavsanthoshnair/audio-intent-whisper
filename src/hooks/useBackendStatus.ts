import { useState, useEffect, useCallback } from 'react';
import { offlineBackendService, type BackendHealth } from '@/services/offlineBackendService';

/**
 * Custom hook for monitoring backend connection status
 * Polls the backend periodically and provides connection state
 */
export const useBackendStatus = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [backendHealth, setBackendHealth] = useState<BackendHealth | null>(null);
    const [lastChecked, setLastChecked] = useState<Date | null>(null);

    const checkConnection = useCallback(async () => {
        try {
            const health = await offlineBackendService.checkHealth();

            if (health) {
                setIsConnected(true);
                setBackendHealth(health);
            } else {
                setIsConnected(false);
                setBackendHealth(null);
            }

            setLastChecked(new Date());
        } catch (error) {
            setIsConnected(false);
            setBackendHealth(null);
        } finally {
            setIsChecking(false);
        }
    }, []);

    // Initial check
    useEffect(() => {
        checkConnection();
    }, [checkConnection]);

    // Poll every 10 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            checkConnection();
        }, 10000);

        return () => clearInterval(interval);
    }, [checkConnection]);

    // Manual refresh function
    const refresh = useCallback(() => {
        setIsChecking(true);
        checkConnection();
    }, [checkConnection]);

    return {
        isConnected,
        isChecking,
        backendHealth,
        lastChecked,
        refresh,
    };
};
