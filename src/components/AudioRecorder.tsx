import React, { useState, useEffect } from 'react';
import { Mic, Square, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { audioRecordingService, RecordedAudio } from '@/services/audioRecordingService';
import { useToast } from '@/hooks/use-toast';

interface AudioRecorderProps {
    onRecordComplete: (audio: RecordedAudio) => void;
    disabled?: boolean;
}

export function AudioRecorder({ onRecordComplete, disabled }: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [duration, setDuration] = useState(0);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const { toast } = useToast();

    // Update duration while recording
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isRecording && !isPaused) {
            interval = setInterval(() => {
                setDuration(audioRecordingService.getCurrentDuration());
            }, 100);
        }

        return () => clearInterval(interval);
    }, [isRecording, isPaused]);

    const requestPermission = async () => {
        const granted = await audioRecordingService.requestMicrophonePermission();
        setHasPermission(granted);

        if (!granted) {
            toast({
                title: 'Microphone Access Denied',
                description: 'Please allow microphone access to record audio.',
                variant: 'destructive',
            });
        }
    };

    const startRecording = async () => {
        try {
            await audioRecordingService.startRecording();
            setIsRecording(true);
            setIsPaused(false);
            setDuration(0);

            toast({
                title: 'Recording Started',
                description: 'Speak clearly into your microphone',
            });
        } catch (error) {
            toast({
                title: 'Recording Failed',
                description: error instanceof Error ? error.message : 'Failed to start recording',
                variant: 'destructive',
            });
        }
    };

    const stopRecording = async () => {
        try {
            const audio = await audioRecordingService.stopRecording();
            setIsRecording(false);
            setIsPaused(false);
            setDuration(0);

            toast({
                title: 'Recording Complete',
                description: `Recorded ${audio.duration.toFixed(1)}s of audio`,
            });

            onRecordComplete(audio);
        } catch (error) {
            toast({
                title: 'Stop Recording Failed',
                description: error instanceof Error ? error.message : 'Failed to stop recording',
                variant: 'destructive',
            });
        }
    };

    const togglePause = () => {
        if (isPaused) {
            audioRecordingService.resumeRecording();
            setIsPaused(false);
        } else {
            audioRecordingService.pauseRecording();
            setIsPaused(true);
        }
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Check permission on mount
    useEffect(() => {
        navigator.permissions.query({ name: 'microphone' as PermissionName }).then((result) => {
            setHasPermission(result.state === 'granted');
        }).catch(() => {
            setHasPermission(null);
        });
    }, []);

    return (
        <Card className="p-6">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Record Audio</h3>
                    {isRecording && (
                        <Badge variant="destructive" className="animate-pulse">
                            Recording
                        </Badge>
                    )}
                </div>

                {/* Permission Request */}
                {hasPermission === false && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                            Microphone access is required to record audio.
                        </p>
                        <Button onClick={requestPermission} size="sm" variant="outline">
                            Grant Permission
                        </Button>
                    </div>
                )}

                {/* Recording Timer */}
                {isRecording && (
                    <div className="text-center">
                        <div className="text-4xl font-mono font-bold text-red-600 dark:text-red-400">
                            {formatTime(duration)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            {isPaused ? 'Paused' : 'Recording...'}
                        </p>
                    </div>
                )}

                {/* Controls */}
                <div className="flex gap-2 justify-center">
                    {!isRecording ? (
                        <Button
                            onClick={startRecording}
                            disabled={disabled || hasPermission === false}
                            size="lg"
                            className="gap-2"
                        >
                            <Mic className="w-5 h-5" />
                            Start Recording
                        </Button>
                    ) : (
                        <>
                            <Button
                                onClick={togglePause}
                                variant="outline"
                                size="lg"
                                className="gap-2"
                            >
                                {isPaused ? (
                                    <>
                                        <Play className="w-5 h-5" />
                                        Resume
                                    </>
                                ) : (
                                    <>
                                        <Pause className="w-5 h-5" />
                                        Pause
                                    </>
                                )}
                            </Button>
                            <Button
                                onClick={stopRecording}
                                variant="destructive"
                                size="lg"
                                className="gap-2"
                            >
                                <Square className="w-5 h-5" />
                                Stop
                            </Button>
                        </>
                    )}
                </div>

                <p className="text-xs text-center text-muted-foreground">
                    Audio will be stored locally in your browser
                </p>
            </div>
        </Card>
    );
}
