/**
 * Service Worker Registration
 * Registers the service worker for PWA offline support
 */

export const registerServiceWorker = async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator)) {
        console.warn('Service workers are not supported in this browser');
        return false;
    }

    try {
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
            scope: '/',
        });

        console.log('✓ Service worker registered:', registration.scope);

        // Handle updates
        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('New service worker available. Refresh to update.');

                    // Optionally show update notification
                    if (window.confirm('A new version is available. Reload to update?')) {
                        newWorker.postMessage({ type: 'SKIP_WAITING' });
                        window.location.reload();
                    }
                }
            });
        });

        return true;
    } catch (error) {
        console.error('Service worker registration failed:', error);
        return false;
    }
};

/**
 * Unregister service worker
 */
export const unregisterServiceWorker = async (): Promise<void> => {
    if (!('serviceWorker' in navigator)) {
        return;
    }

    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
        await registration.unregister();
    }

    console.log('✓ Service worker unregistered');
};

/**
 * Check if app is running as PWA
 */
export const isPWA = (): boolean => {
    return window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
};

/**
 * Show install prompt
 */
let deferredPrompt: any = null;

export const setupInstallPrompt = (): void => {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        console.log('✓ Install prompt ready');
    });

    window.addEventListener('appinstalled', () => {
        console.log('✓ PWA installed');
        deferredPrompt = null;
    });
};

export const showInstallPrompt = async (): Promise<boolean> => {
    if (!deferredPrompt) {
        console.warn('Install prompt not available');
        return false;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    console.log(`Install prompt outcome: ${outcome}`);
    deferredPrompt = null;

    return outcome === 'accepted';
};

export const canInstall = (): boolean => {
    return deferredPrompt !== null;
};
