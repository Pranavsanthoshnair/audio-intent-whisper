import React from 'react';
import { Languages, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { SessionTranslation } from '@/services/translationAggregationService';
import type { Language } from '@/services/offlineStorage';

interface DualLanguageViewerProps {
    translation: SessionTranslation;
}

export function DualLanguageViewer({ translation }: DualLanguageViewerProps) {
    const languageLabels: Record<Language, string> = {
        hindi: 'हिंदी',
        urdu: 'اردو',
        kashmiri: 'کٲشُر',
        english: 'English',
    };

    const languageColors: Record<Language, string> = {
        hindi: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
        urdu: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        kashmiri: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
        english: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    };

    return (
        <Card className="p-6">
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Languages className="w-5 h-5 text-green-600" />
                        <h3 className="text-lg font-semibold">Bilingual Transcript</h3>
                    </div>
                    <Badge variant="outline" className="gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {translation.totalChunks} chunks translated
                    </Badge>
                </div>

                {/* Auto-translated label */}
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                        ℹ️ Auto-translated for analysis and reporting using offline dictionary-based translation
                    </p>
                </div>

                {/* Tabs for different views */}
                <Tabs defaultValue="side-by-side" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="side-by-side">Side-by-Side</TabsTrigger>
                        <TabsTrigger value="english-only">English Only</TabsTrigger>
                    </TabsList>

                    {/* Side-by-Side View */}
                    <TabsContent value="side-by-side" className="mt-4">
                        <ScrollArea className="h-[400px] rounded-md border p-4">
                            <div className="space-y-4">
                                {translation.translatedTranscript.map((chunk, index) => (
                                    <div
                                        key={chunk.chunkId}
                                        className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50"
                                    >
                                        {/* Source Language */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Badge className={languageColors[chunk.sourceLanguage]} variant="secondary">
                                                    {languageLabels[chunk.sourceLanguage]}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {chunk.startTime.toFixed(1)}s
                                                </span>
                                            </div>
                                            <p className="text-sm leading-relaxed" dir="auto">
                                                {chunk.sourceText}
                                            </p>
                                        </div>

                                        {/* English Translation */}
                                        <div className="space-y-2 border-l pl-4">
                                            <div className="flex items-center gap-2">
                                                <Badge className={languageColors.english} variant="secondary">
                                                    English
                                                </Badge>
                                                {chunk.confidence && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {(chunk.confidence * 100).toFixed(0)}% confidence
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm leading-relaxed">{chunk.translatedText}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    {/* English Only View */}
                    <TabsContent value="english-only" className="mt-4">
                        <ScrollArea className="h-[400px] rounded-md border p-4">
                            <div className="space-y-3">
                                {translation.translatedTranscript.map((chunk, index) => (
                                    <div key={chunk.chunkId} className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-muted-foreground">
                                                [{chunk.startTime.toFixed(1)}s]
                                            </span>
                                            {chunk.confidence && (
                                                <span className="text-xs text-muted-foreground">
                                                    {(chunk.confidence * 100).toFixed(0)}%
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm leading-relaxed">{chunk.translatedText}</p>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>

                {/* Summary */}
                <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
                    <span>Target Language: English</span>
                    <span>Total Chunks: {translation.totalChunks}</span>
                </div>
            </div>
        </Card>
    );
}
