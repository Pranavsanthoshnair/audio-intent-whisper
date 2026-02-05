/**
 * Transcript Viewer Component
 * Displays session transcript with chunk breakdown
 */

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Languages, TrendingUp } from 'lucide-react';
import { SessionTranscript } from '@/services/transcriptService';
import { Language } from '@/services/offlineStorage';

interface TranscriptViewerProps {
    transcript: SessionTranscript;
}

export function TranscriptViewer({ transcript }: TranscriptViewerProps) {
    const languageLabels: Record<Language, string> = {
        hindi: 'Hindi (हिंदी)',
        urdu: 'Urdu (اردو)',
        kashmiri: 'Kashmiri (کٲشُر)',
        english: 'English',
    };

    const confidenceColor = (confidence: number) => {
        if (confidence >= 0.8) return 'text-green-600';
        if (confidence >= 0.6) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <Card className="p-6">
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Transcript
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            {transcript.totalChunks} chunks transcribed
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Badge variant="secondary" className="flex items-center gap-1">
                            <Languages className="h-3 w-3" />
                            {languageLabels[transcript.language]}
                        </Badge>
                        <Badge
                            variant="outline"
                            className={`flex items-center gap-1 ${confidenceColor(transcript.confidenceAvg)}`}
                        >
                            <TrendingUp className="h-3 w-3" />
                            {(transcript.confidenceAvg * 100).toFixed(0)}% confidence
                        </Badge>
                    </div>
                </div>

                {/* Transcript Content */}
                <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                    <div className="space-y-4">
                        {transcript.fullTranscript.map((chunk, index) => (
                            <div
                                key={chunk.chunkId}
                                className="border-l-2 border-primary/20 pl-4 py-2 hover:border-primary/40 transition-colors"
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-mono text-muted-foreground">
                                        {chunk.startTime.toFixed(1)}s
                                    </span>
                                    <Badge variant="outline" className="text-xs">
                                        {languageLabels[chunk.language]}
                                    </Badge>
                                    <span className={`text-xs ${confidenceColor(chunk.confidence)}`}>
                                        {(chunk.confidence * 100).toFixed(0)}%
                                    </span>
                                </div>
                                <p className="text-sm leading-relaxed">{chunk.text}</p>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                {/* Footer Info */}
                <div className="text-xs text-muted-foreground">
                    Session ID: <span className="font-mono">{transcript.sessionId}</span>
                </div>
            </div>
        </Card>
    );
}
