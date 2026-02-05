import React from 'react';
import { Download, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ModelLoadingProgressProps {
    progress: number;
    isLoading: boolean;
    isLoaded: boolean;
    error?: string | null;
    onRetry?: () => void;
}

export function ModelLoadingProgress({
    progress,
    isLoading,
    isLoaded,
    error,
    onRetry
}: ModelLoadingProgressProps) {
    // Show success state
    if (isLoaded && !error) {
        return (
            <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-green-900 dark:text-green-100">
                            Whisper Model Ready
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300">
                            Offline AI transcription available
                        </p>
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Cached
                    </Badge>
                </div>
            </Card>
        );
    }

    // Show error state
    if (error && !isLoading) {
        return (
            <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <div className="space-y-3">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-red-900 dark:text-red-100">
                                Model Loading Failed
                            </p>
                            <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                                {error}
                            </p>
                        </div>
                    </div>
                    {onRetry && (
                        <Button
                            onClick={onRetry}
                            variant="outline"
                            size="sm"
                            className="w-full gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Retry Loading Model
                        </Button>
                    )}
                </div>
            </Card>
        );
    }

    // Show loading state
    if (!isLoading) {
        return null;
    }

    return (
        <Card className="p-6">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        <h3 className="text-lg font-semibold">Loading Whisper Model...</h3>
                    </div>
                    <Badge variant="outline" className="gap-1">
                        <Download className="w-3 h-3" />
                        First-time setup
                    </Badge>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Downloading AI model</span>
                        <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                        ℹ️ The Whisper model (~142MB) is downloading and will be cached for offline use. This only happens once.
                    </p>
                </div>

                {progress > 0 && progress < 100 && (
                    <p className="text-xs text-muted-foreground text-center">
                        Please wait... This may take 1-3 minutes depending on your connection.
                    </p>
                )}

                {progress === 100 && (
                    <p className="text-xs text-muted-foreground text-center">
                        Initializing model... Almost ready!
                    </p>
                )}
            </div>
        </Card>
    );
}
