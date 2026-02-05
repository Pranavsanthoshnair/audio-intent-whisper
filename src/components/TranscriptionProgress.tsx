/**
 * Transcription Progress Component
 * Shows real-time progress of audio transcription
 */

import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { Language } from '@/services/offlineStorage';

interface TranscriptionProgressProps {
    current: number;
    total: number;
    currentLanguage?: Language;
    isProcessing: boolean;
}

export function TranscriptionProgress({
    current,
    total,
    currentLanguage,
    isProcessing,
}: TranscriptionProgressProps) {
    const progress = total > 0 ? (current / total) * 100 : 0;

    const languageLabels: Record<Language, string> = {
        hindi: 'Hindi (हिंदी)',
        urdu: 'Urdu (اردو)',
        kashmiri: 'Kashmiri (کٲشُر)',
        english: 'English',
    };

    return (
        <Card className="p-6">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        {isProcessing && <Loader2 className="h-5 w-5 animate-spin" />}
                        Transcribing Audio
                    </h3>
                    {currentLanguage && (
                        <Badge variant="secondary" className="font-mono">
                            {languageLabels[currentLanguage]}
                        </Badge>
                    )}
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>
                            Processing chunk {current} of {total}
                        </span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                {isProcessing && (
                    <p className="text-sm text-muted-foreground">
                        Converting speech to text with language detection...
                    </p>
                )}
            </div>
        </Card>
    );
}
