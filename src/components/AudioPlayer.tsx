import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { getAudioBlobUrl, formatDuration } from '@/services/audioStorageService';

interface AudioPlayerProps {
    audioId: string;
    format?: string;
    duration?: number;
}

export function AudioPlayer({ audioId, format, duration: initialDuration }: AudioPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(initialDuration || 0);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    // Load audio on mount
    useEffect(() => {
        const loadAudio = async () => {
            const url = await getAudioBlobUrl(audioId);
            if (url) {
                setAudioUrl(url);
            }
        };

        loadAudio();

        // Cleanup
        return () => {
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
        };
    }, [audioId]);

    // Update duration when audio loads
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
        };

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [audioUrl]);

    const togglePlayPause = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (value: number[]) => {
        const audio = audioRef.current;
        if (!audio) return;

        const newTime = value[0];
        audio.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    if (!audioUrl) {
        return (
            <Card className="p-6">
                <p className="text-sm text-muted-foreground text-center">
                    Loading audio...
                </p>
            </Card>
        );
    }

    return (
        <Card className="p-6">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Audio Playback</h3>
                    <div className="flex gap-2">
                        <Badge variant="secondary">
                            <Volume2 className="w-3 h-3 mr-1" />
                            {format?.toUpperCase() || 'WAV'}
                        </Badge>
                        <Badge variant="outline" className="text-green-600 dark:text-green-400">
                            Stored Locally
                        </Badge>
                    </div>
                </div>

                {/* Hidden audio element */}
                <audio ref={audioRef} src={audioUrl} preload="metadata" />

                {/* Progress Bar */}
                <div className="space-y-2">
                    <Slider
                        value={[currentTime]}
                        max={duration}
                        step={0.1}
                        onValueChange={handleSeek}
                        className="cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatDuration(currentTime)}</span>
                        <span>{formatDuration(duration)}</span>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex justify-center">
                    <Button
                        onClick={togglePlayPause}
                        size="lg"
                        className="gap-2"
                    >
                        {isPlaying ? (
                            <>
                                <Pause className="w-5 h-5" />
                                Pause
                            </>
                        ) : (
                            <>
                                <Play className="w-5 h-5" />
                                Play
                            </>
                        )}
                    </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                    Playing from local browser storage
                </p>
            </div>
        </Card>
    );
}
