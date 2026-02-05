/**
 * Audio Chunking Service
 * Splits audio into chunks for processing
 */

export interface AudioChunk {
    chunkId: string;
    audioBlob: Blob;
    startTime: number;
    duration: number;
}

/**
 * Split audio into chunks for transcription
 * @param audioBlob - The full audio blob
 * @param chunkDurationSeconds - Duration of each chunk in seconds (default: 30s)
 * @returns Array of audio chunks
 */
export async function splitAudioIntoChunks(
    audioBlob: Blob,
    chunkDurationSeconds: number = 30
): Promise<AudioChunk[]> {
    try {
        // Create audio context
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Convert blob to array buffer
        const arrayBuffer = await audioBlob.arrayBuffer();

        // Decode audio data
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const sampleRate = audioBuffer.sampleRate;
        const totalDuration = audioBuffer.duration;
        const chunkSamples = chunkDurationSeconds * sampleRate;

        const chunks: AudioChunk[] = [];
        let chunkIndex = 0;

        // Split audio buffer into chunks
        for (let startSample = 0; startSample < audioBuffer.length; startSample += chunkSamples) {
            const endSample = Math.min(startSample + chunkSamples, audioBuffer.length);
            const chunkLength = endSample - startSample;

            // Create new buffer for this chunk
            const chunkBuffer = audioContext.createBuffer(
                audioBuffer.numberOfChannels,
                chunkLength,
                sampleRate
            );

            // Copy audio data to chunk buffer
            for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
                const sourceData = audioBuffer.getChannelData(channel);
                const chunkData = chunkBuffer.getChannelData(channel);
                for (let i = 0; i < chunkLength; i++) {
                    chunkData[i] = sourceData[startSample + i];
                }
            }

            // Convert chunk buffer to WAV blob
            const chunkBlob = await audioBufferToWav(chunkBuffer);

            const startTime = startSample / sampleRate;
            const duration = chunkLength / sampleRate;

            chunks.push({
                chunkId: `chunk-${String(chunkIndex + 1).padStart(3, '0')}`,
                audioBlob: chunkBlob,
                startTime,
                duration,
            });

            chunkIndex++;
        }

        console.log(`✓ Split audio into ${chunks.length} chunks (${chunkDurationSeconds}s each)`);
        return chunks;

    } catch (error) {
        console.error('Error splitting audio:', error);
        throw new Error('Failed to split audio into chunks');
    }
}

/**
 * Convert AudioBuffer to WAV Blob
 */
async function audioBufferToWav(audioBuffer: AudioBuffer): Promise<Blob> {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;

    const data = interleave(audioBuffer);
    const dataLength = data.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);

    // Write WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, format, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    // Write audio data
    floatTo16BitPCM(view, 44, data);

    return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Interleave audio channels
 */
function interleave(audioBuffer: AudioBuffer): Float32Array {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length * numberOfChannels;
    const result = new Float32Array(length);

    let offset = 0;
    for (let i = 0; i < audioBuffer.length; i++) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
            result[offset++] = audioBuffer.getChannelData(channel)[i];
        }
    }

    return result;
}

/**
 * Write string to DataView
 */
function writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

/**
 * Convert float samples to 16-bit PCM
 */
function floatTo16BitPCM(view: DataView, offset: number, input: Float32Array): void {
    for (let i = 0; i < input.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, input[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
}

/**
 * Process single audio file without chunking (for smaller files)
 */
export async function processSingleAudio(audioBlob: Blob): Promise<AudioChunk> {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    return {
        chunkId: 'chunk-001',
        audioBlob,
        startTime: 0,
        duration: audioBuffer.duration,
    };
}
