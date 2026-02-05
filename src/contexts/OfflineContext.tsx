import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { useOfflineDetection } from '@/hooks/useOfflineDetection';
import { initDB } from '@/services/offlineStorage';
import type { BackendHealth } from '@/services/offlineBackendService';

interface OfflineContextType {
    // Backend status
    isBackendConnected: boolean;
    isCheckingBackend: boolean;
    backendHealth: BackendHealth | null;
    refreshBackendStatus: () => void;

    // Browser online/offline status
    isOnline: boolean;
    isOffline: boolean;

    // Current session
    currentSessionId: string | null;
    setCurrentSessionId: (id: string | null) => void;

    // System mode
    mode: 'offline-first';
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

interface OfflineProviderProps {
    children: ReactNode;
}

export const OfflineProvider: React.FC<OfflineProviderProps> = ({ children }) => {
    const { isConnected, isChecking, backendHealth, refresh } = useBackendStatus();
    const { isOnline, isOffline } = useOfflineDetection();
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

    // Initialize IndexedDB on mount
    useEffect(() => {
        const initStorage = async () => {
            try {
                await initDB();
                console.log('✓ Offline storage initialized');
            } catch (error) {
                console.error('Failed to initialize offline storage:', error);
            }
        };

        initStorage();
    }, []);

    const value: OfflineContextType = {
        isBackendConnected: isConnected,
        isCheckingBackend: isChecking,
        backendHealth,
        refreshBackendStatus: refresh,
        isOnline,
        isOffline,
        currentSessionId,
        setCurrentSessionId,
        mode: 'offline-first',
    };

    return (
        <OfflineContext.Provider value={value}>
            {children}
        </OfflineContext.Provider>
    );
};

export const useOfflineContext = () => {
    const context = useContext(OfflineContext);
    if (context === undefined) {
        throw new Error('useOfflineContext must be used within OfflineProvider');
    }
    return context;
};
