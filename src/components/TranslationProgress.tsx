import React from 'react';
import { Languages, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { Language } from '@/services/offlineStorage';

interface TranslationProgressProps {
    current: number;
    total: number;
    currentLanguage?: Language;
}

export function TranslationProgress({ current, total, currentLanguage }: TranslationProgressProps) {
    const progress = total > 0 ? (current / total) * 100 : 0;

    const languageLabels: Record<Language, string> = {
        hindi: 'Hindi',
        urdu: 'Urdu',
        kashmiri: 'Kashmiri',
        english: 'English',
    };

    return (
        <Card className="p-6">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        <h3 className="text-lg font-semibold">Translating to English...</h3>
                    </div>
                    {currentLanguage && (
                        <Badge variant="outline" className="gap-1">
                            <Languages className="w-3 h-3" />
                            {languageLabels[currentLanguage]}
                        </Badge>
                    )}
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Progress</span>
                        <span>
                            {current} / {total} chunks
                        </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                <p className="text-sm text-muted-foreground">
                    Translating transcript chunks offline using dictionary-based translation...
                </p>
            </div>
        </Card>
    );
}
