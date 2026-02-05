import { useOfflineContext } from '@/contexts/OfflineContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, Server, RefreshCw, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Backend Status Panel Component
 * Displays connection status for local backend and internet
 */
export const BackendStatusPanel = () => {
    const {
        isBackendConnected,
        isCheckingBackend,
        backendHealth,
        refreshBackendStatus,
        isOnline,
        mode,
    } = useOfflineContext();

    return (
        <Card className="glass-panel p-4 space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    System Status
                </h3>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={refreshBackendStatus}
                    disabled={isCheckingBackend}
                >
                    <RefreshCw className={cn("h-3 w-3", isCheckingBackend && "animate-spin")} />
                </Button>
            </div>

            <div className="space-y-2">
                {/* Local Backend Engine Status */}
                <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Local Engine:</span>
                    <div className="flex items-center gap-2">
                        {isCheckingBackend ? (
                            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        ) : isBackendConnected ? (
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                        ) : (
                            <XCircle className="h-3 w-3 text-red-500" />
                        )}
                        <Badge
                            variant={isBackendConnected ? "default" : "destructive"}
                            className="text-xs"
                        >
                            {isBackendConnected ? 'Connected' : 'Not Connected'}
                        </Badge>
                    </div>
                </div>

                {/* Internet Status */}
                <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Internet:</span>
                    <div className="flex items-center gap-2">
                        {isOnline ? (
                            <Wifi className="h-3 w-3 text-blue-500" />
                        ) : (
                            <WifiOff className="h-3 w-3 text-orange-500" />
                        )}
                        <Badge
                            variant={isOnline ? "outline" : "secondary"}
                            className="text-xs"
                        >
                            {isOnline ? 'Online' : 'Offline'}
                        </Badge>
                    </div>
                </div>

                {/* System Mode */}
                <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Mode:</span>
                    <Badge variant="outline" className="text-xs font-mono">
                        {mode}
                    </Badge>
                </div>

                {/* Backend Health Details */}
                {isBackendConnected && backendHealth && (
                    <div className="pt-2 border-t border-border/50">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Uptime:</span>
                            <span className="font-mono">{formatUptime(backendHealth.uptime)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs mt-1">
                            <span className="text-muted-foreground">Engine:</span>
                            <span className="font-mono">{backendHealth.engine}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Warning when backend is not connected */}
            {!isBackendConnected && !isCheckingBackend && (
                <div className="pt-2 border-t border-border/50">
                    <p className="text-xs text-orange-500">
                        ⚠ Start the backend service to enable session management
                    </p>
                </div>
            )}
        </Card>
    );
};

/**
 * Format uptime in seconds to human-readable format
 */
const formatUptime = (seconds: number): string => {
    if (seconds < 60) {
        return `${seconds}s`;
    } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        return `${minutes}m`;
    } else {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }
};
