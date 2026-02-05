/**
 * Audio Recording Service
 * Handles microphone access, recording, and WAV conversion
 */

export interface RecordingState {
    isRecording: boolean;
    isPaused: boolean;
    duration: number; // seconds
    error: string | null;
}

export interface RecordedAudio {
    blob: Blob;
    duration: number;
    format: 'wav' | 'webm';
    size: number;
}

class AudioRecordingService {
    private mediaRecorder: MediaRecorder | null = null;
    private audioChunks: Blob[] = [];
    private stream: MediaStream | null = null;
    private startTime: number = 0;
    private audioContext: AudioContext | null = null;

    /**
     * Request microphone permission
     */
    async requestMicrophonePermission(): Promise<boolean> {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Stop the stream immediately, we just needed permission
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (error) {
            console.error('Microphone permission denied:', error);
            return false;
        }
    }

    /**
     * Start recording
     */
    async startRecording(): Promise<void> {
        try {
            // Get audio stream
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100,
                },
            });

            // Create MediaRecorder
            const mimeType = this.getSupportedMimeType();
            this.mediaRecorder = new MediaRecorder(this.stream, {
                mimeType,
            });

            // Reset chunks
            this.audioChunks = [];
            this.startTime = Date.now();

            // Handle data available
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            // Start recording
            this.mediaRecorder.start(100); // Collect data every 100ms
            console.log('✓ Recording started');
        } catch (error) {
            console.error('Failed to start recording:', error);
            throw new Error('Failed to start recording. Please check microphone permissions.');
        }
    }

    /**
     * Stop recording and return audio blob
     */
    async stopRecording(): Promise<RecordedAudio> {
        return new Promise((resolve, reject) => {
            if (!this.mediaRecorder) {
                reject(new Error('No active recording'));
                return;
            }

            this.mediaRecorder.onstop = async () => {
                try {
                    const duration = (Date.now() - this.startTime) / 1000;
                    const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';

                    // Create blob from chunks
                    const blob = new Blob(this.audioChunks, { type: mimeType });

                    // Determine format
                    const format = mimeType.includes('wav') ? 'wav' : 'webm';

                    // Stop all tracks
                    if (this.stream) {
                        this.stream.getTracks().forEach(track => track.stop());
                    }

                    // Convert to WAV if needed
                    const finalBlob = format === 'webm' ? await this.convertToWav(blob) : blob;

                    resolve({
                        blob: finalBlob,
                        duration,
                        format: 'wav',
                        size: finalBlob.size,
                    });

                    // Cleanup
                    this.mediaRecorder = null;
                    this.audioChunks = [];
                    this.stream = null;

                    console.log('✓ Recording stopped, duration:', duration.toFixed(2), 's');
                } catch (error) {
                    reject(error);
                }
            };

            this.mediaRecorder.stop();
        });
    }

    /**
     * Pause recording
     */
    pauseRecording(): void {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.pause();
            console.log('⏸ Recording paused');
        }
    }

    /**
     * Resume recording
     */
    resumeRecording(): void {
        if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
            this.mediaRecorder.resume();
            console.log('▶ Recording resumed');
        }
    }

    /**
     * Get current recording duration
     */
    getCurrentDuration(): number {
        if (!this.startTime) return 0;
        return (Date.now() - this.startTime) / 1000;
    }

    /**
     * Check if currently recording
     */
    isRecording(): boolean {
        return this.mediaRecorder?.state === 'recording';
    }

    /**
     * Get supported MIME type
     */
    private getSupportedMimeType(): string {
        const types = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus',
            'audio/wav',
        ];

        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }

        return 'audio/webm'; // Fallback
    }

    /**
     * Convert WebM to WAV format
     */
    private async convertToWav(webmBlob: Blob): Promise<Blob> {
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

            // Convert blob to array buffer
            const arrayBuffer = await webmBlob.arrayBuffer();

            // Decode audio data
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            // Convert to WAV
            const wavBlob = this.audioBufferToWav(audioBuffer);

            return wavBlob;
        } catch (error) {
            console.error('WAV conversion failed, using original format:', error);
            return webmBlob; // Return original if conversion fails
        }
    }

    /**
     * Convert AudioBuffer to WAV Blob
     */
    private audioBufferToWav(buffer: AudioBuffer): Blob {
        const numberOfChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const format = 1; // PCM
        const bitDepth = 16;

        const bytesPerSample = bitDepth / 8;
        const blockAlign = numberOfChannels * bytesPerSample;

        const data = this.interleave(buffer);
        const dataLength = data.length * bytesPerSample;
        const headerLength = 44;
        const totalLength = headerLength + dataLength;

        const arrayBuffer = new ArrayBuffer(totalLength);
        const view = new DataView(arrayBuffer);

        // Write WAV header
        this.writeString(view, 0, 'RIFF');
        view.setUint32(4, totalLength - 8, true);
        this.writeString(view, 8, 'WAVE');
        this.writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true); // fmt chunk size
        view.setUint16(20, format, true);
        view.setUint16(22, numberOfChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * blockAlign, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitDepth, true);
        this.writeString(view, 36, 'data');
        view.setUint32(40, dataLength, true);

        // Write audio data
        this.floatTo16BitPCM(view, 44, data);

        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }

    /**
     * Interleave audio channels
     */
    private interleave(buffer: AudioBuffer): Float32Array {
        const numberOfChannels = buffer.numberOfChannels;
        const length = buffer.length * numberOfChannels;
        const result = new Float32Array(length);

        let offset = 0;
        for (let i = 0; i < buffer.length; i++) {
            for (let channel = 0; channel < numberOfChannels; channel++) {
                result[offset++] = buffer.getChannelData(channel)[i];
            }
        }

        return result;
    }

    /**
     * Write string to DataView
     */
    private writeString(view: DataView, offset: number, string: string): void {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    /**
     * Convert float samples to 16-bit PCM
     */
    private floatTo16BitPCM(view: DataView, offset: number, input: Float32Array): void {
        for (let i = 0; i < input.length; i++, offset += 2) {
            const s = Math.max(-1, Math.min(1, input[i]));
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        }
    }
}

// Export singleton instance
export const audioRecordingService = new AudioRecordingService();
