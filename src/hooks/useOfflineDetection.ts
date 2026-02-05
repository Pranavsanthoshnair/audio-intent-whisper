import { useState, useEffect } from 'react';

/**
 * Custom hook for detecting browser online/offline status
 * Uses navigator.onLine and listens to online/offline events
 */
export const useOfflineDetection = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => {
            console.log('✓ Browser is now online');
            setIsOnline(true);
        };

        const handleOffline = () => {
            console.log('⚠ Browser is now offline');
            setIsOnline(false);
        };

        // Add event listeners
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Cleanup
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return {
        isOnline,
        isOffline: !isOnline,
    };
};
