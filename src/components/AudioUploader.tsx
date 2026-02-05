import React, { useState, useCallback } from 'react';
import { Upload, FileAudio, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
    validateAudioFile,
    extractAudioMetadata,
    formatFileSize,
    formatDuration,
} from '@/services/audioStorageService';

interface AudioUploaderProps {
    onFileSelected: (file: File, metadata: { duration: number; format: 'wav' | 'mp3' | 'webm'; size: number }) => void;
    disabled?: boolean;
}

export function AudioUploader({ onFileSelected, disabled }: AudioUploaderProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [metadata, setMetadata] = useState<any>(null);
    const [isDragging, setIsDragging] = useState(false);
    const { toast } = useToast();

    const handleFileSelect = async (file: File) => {
        // Validate file
        const validation = validateAudioFile(file);
        if (!validation.valid) {
            toast({
                title: 'Invalid File',
                description: validation.error,
                variant: 'destructive',
            });
            return;
        }

        try {
            // Extract metadata
            const meta = await extractAudioMetadata(file);
            setSelectedFile(file);
            setMetadata(meta);

            toast({
                title: 'File Selected',
                description: `${file.name} (${formatFileSize(file.size)})`,
            });

            // Notify parent
            onFileSelected(file, meta);
        } catch (error) {
            toast({
                title: 'Metadata Extraction Failed',
                description: 'Could not read audio file metadata',
                variant: 'destructive',
            });
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    }, []);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const clearSelection = () => {
        setSelectedFile(null);
        setMetadata(null);
    };

    return (
        <Card className="p-6">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Upload Audio File</h3>
                    <Badge variant="outline">WAV / MP3</Badge>
                </div>

                {/* Drag & Drop Area */}
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}
          `}
                >
                    {!selectedFile ? (
                        <>
                            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-sm font-medium mb-2">
                                Drag & drop audio file here
                            </p>
                            <p className="text-xs text-muted-foreground mb-4">
                                or click to browse
                            </p>
                            <input
                                type="file"
                                accept="audio/wav,audio/mpeg,audio/mp3,audio/webm"
                                onChange={handleInputChange}
                                disabled={disabled}
                                className="hidden"
                                id="audio-upload"
                            />
                            <label htmlFor="audio-upload">
                                <Button asChild variant="outline" disabled={disabled}>
                                    <span>Select File</span>
                                </Button>
                            </label>
                        </>
                    ) : (
                        <div className="space-y-3">
                            <FileAudio className="w-12 h-12 mx-auto text-primary" />
                            <div>
                                <p className="font-medium">{selectedFile.name}</p>
                                {metadata && (
                                    <div className="text-sm text-muted-foreground mt-2 space-y-1">
                                        <p>Duration: {formatDuration(metadata.duration)}</p>
                                        <p>Size: {formatFileSize(metadata.size)}</p>
                                        <p>Format: {metadata.format.toUpperCase()}</p>
                                    </div>
                                )}
                            </div>
                            <Button
                                onClick={clearSelection}
                                variant="outline"
                                size="sm"
                                className="gap-2"
                            >
                                <X className="w-4 h-4" />
                                Remove
                            </Button>
                        </div>
                    )}
                </div>

                <p className="text-xs text-center text-muted-foreground">
                    Maximum file size: 50MB • Supported formats: WAV, MP3
                </p>
            </div>
        </Card>
    );
}
