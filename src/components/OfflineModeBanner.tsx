import { useOfflineContext } from '@/contexts/OfflineContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff, CheckCircle } from 'lucide-react';

/**
 * Offline Mode Banner Component
 * Shows when browser is offline - presents it as a positive feature
 */
export const OfflineModeBanner = () => {
    const { isOffline } = useOfflineContext();

    if (!isOffline) {
        return null;
    }

    return (
        <Alert className="border-blue-500/50 bg-blue-500/10">
            <WifiOff className="h-4 w-4 text-blue-500" />
            <AlertDescription className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span className="text-sm font-medium">
                    Offline Mode Active – Local Processing Enabled
                </span>
            </AlertDescription>
        </Alert>
    );
};
