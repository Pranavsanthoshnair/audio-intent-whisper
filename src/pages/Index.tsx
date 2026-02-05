/**
 * Main Index Page - Offline Audio Intent Analysis
 * Checkpoint 3: Integrated with STT transcription
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mic, Upload, RotateCcw, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Components
import { AudioRecorder } from '@/components/AudioRecorder';
import type { RecordedAudio } from '@/services/audioRecordingService';
import { AudioUploader } from '@/components/AudioUploader';
import { AudioPlayer } from '@/components/AudioPlayer';
import { SessionCard } from '@/components/SessionCard';
import { ExportButtons } from '@/components/ExportButtons';
import { TranscriptionProgress } from '@/components/TranscriptionProgress';
import { TranscriptViewer } from '@/components/TranscriptViewer';

// Services
import { createSession, getSession, updateSessionStatus } from '@/services/sessionService';
import { storeAudio } from '@/services/audioStorageService';
import { transcribeChunks } from '@/services/sttService';
import { storeTranscriptChunks, aggregateTranscripts } from '@/services/transcriptService';
import type { Session } from '@/services/offlineStorage';
import type { SessionTranscript } from '@/services/transcriptService';

export default function Index() {
  const { toast } = useToast();

  // Session state
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [hasAudio, setHasAudio] = useState(false);
  const [audioId, setAudioId] = useState<string | null>(null);
  const [audioFormat, setAudioFormat] = useState<'wav' | 'mp3' | 'webm'>('wav');
  const [audioDuration, setAudioDuration] = useState(0);

  // Transcription state
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionProgress, setTranscriptionProgress] = useState({ current: 0, total: 0 });
  const [currentLanguage, setCurrentLanguage] = useState<'hindi' | 'urdu' | 'kashmiri' | 'english' | undefined>();
  const [sessionTranscript, setSessionTranscript] = useState<SessionTranscript | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState<'record' | 'upload'>('record');

  /**
   * Create a new session
   */
  const handleCreateSession = async (inputMode: 'record' | 'upload') => {
    try {
      const session = await createSession(inputMode);
      setCurrentSession(session);
      setActiveTab(inputMode);

      toast({
        title: 'Session Created',
        description: `Session ${session.sessionId.slice(0, 8)}... ready`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create session',
        variant: 'destructive',
      });
    }
  };

  /**
   * Handle audio recording completion
   */
  const handleRecordComplete = async (audio: RecordedAudio) => {
    if (!currentSession) return;

    try {
      const id = await storeAudio(
        currentSession.sessionId,
        audio.blob,
        'wav',
        audio.duration
      );

      await updateSessionStatus(currentSession.sessionId, 'audio_attached');

      setAudioId(id);
      setAudioFormat('wav');
      setAudioDuration(audio.duration);
      setHasAudio(true);

      const updatedSession = await getSession(currentSession.sessionId);
      if (updatedSession) setCurrentSession(updatedSession);

      toast({
        title: 'Audio Recorded',
        description: `${audio.duration.toFixed(1)}s recording saved`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save recording',
        variant: 'destructive',
      });
    }
  };

  /**
   * Handle file upload
   */
  const handleFileSelected = async (
    file: File,
    metadata: { duration: number; format: 'wav' | 'mp3' | 'webm'; size: number }
  ) => {
    if (!currentSession) return;

    try {
      const id = await storeAudio(
        currentSession.sessionId,
        file,
        metadata.format,
        metadata.duration
      );

      await updateSessionStatus(currentSession.sessionId, 'audio_attached');

      setAudioId(id);
      setAudioFormat(metadata.format);
      setAudioDuration(metadata.duration);
      setHasAudio(true);

      const updatedSession = await getSession(currentSession.sessionId);
      if (updatedSession) setCurrentSession(updatedSession);

      toast({
        title: 'Audio Uploaded',
        description: `${file.name} saved`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload audio',
        variant: 'destructive',
      });
    }
  };

  /**
   * Handle transcription
   */
  const handleTranscribe = async () => {
    if (!currentSession || !audioId) return;

    setIsTranscribing(true);
    setTranscriptionProgress({ current: 0, total: 0 });

    try {
      // Create mock audio chunks (in real implementation, these would come from audio preprocessing)
      const mockChunks = Array.from({ length: 5 }, (_, i) => ({
        chunkId: `chunk-${String(i + 1).padStart(3, '0')}`,
        audioBlob: new Blob(['mock audio data'], { type: 'audio/wav' }),
        startTime: i * 5,
      }));

      setTranscriptionProgress({ current: 0, total: mockChunks.length });

      // Transcribe chunks with progress
      const transcripts = await transcribeChunks(mockChunks, (current, total) => {
        setTranscriptionProgress({ current, total });
        if (current > 0 && transcripts.length > 0) {
          setCurrentLanguage(transcripts[current - 1].language);
        }
      });

      // Store transcripts in IndexedDB
      await storeTranscriptChunks(currentSession.sessionId, transcripts);

      // Update session status
      await updateSessionStatus(currentSession.sessionId, 'transcribed');

      // Aggregate transcripts
      const aggregated = await aggregateTranscripts(currentSession.sessionId);
      setSessionTranscript(aggregated);

      const updatedSession = await getSession(currentSession.sessionId);
      if (updatedSession) setCurrentSession(updatedSession);

      toast({
        title: 'Transcription Complete',
        description: `${transcripts.length} chunks transcribed in ${aggregated.language}`,
      });
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: 'Transcription Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  /**
   * Reset session
   */
  const handleReset = () => {
    setCurrentSession(null);
    setHasAudio(false);
    setAudioId(null);
    setAudioFormat('wav');
    setAudioDuration(0);
    setIsTranscribing(false);
    setTranscriptionProgress({ current: 0, total: 0 });
    setCurrentLanguage(undefined);
    setSessionTranscript(null);
    setActiveTab('record');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Offline Audio Intent Analysis</h1>
          <p className="text-muted-foreground">
            Record or upload audio • Transcribe • Analyze • Export
          </p>
        </div>

        {/* Session Creation */}
        {!currentSession ? (
          <Card className="p-8">
            <h2 className="text-2xl font-semibold mb-4 text-center">Create New Session</h2>
            <p className="text-muted-foreground text-center mb-6">
              Choose your input method to begin
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                size="lg"
                onClick={() => handleCreateSession('record')}
                className="h-24 flex flex-col gap-2"
              >
                <Mic className="h-8 w-8" />
                <span>Record Audio</span>
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => handleCreateSession('upload')}
                className="h-24 flex flex-col gap-2"
              >
                <Upload className="h-8 w-8" />
                <span>Upload File</span>
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Session Info */}
            <SessionCard session={currentSession} hasAudio={hasAudio} />

            {/* Audio Input */}
            {!hasAudio && (
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'record' | 'upload')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="record">Record</TabsTrigger>
                  <TabsTrigger value="upload">Upload</TabsTrigger>
                </TabsList>

                <TabsContent value="record" className="mt-4">
                  <AudioRecorder onRecordComplete={handleRecordComplete} disabled={hasAudio} />
                </TabsContent>

                <TabsContent value="upload" className="mt-4">
                  <AudioUploader onFileSelected={handleFileSelected} disabled={hasAudio} />
                </TabsContent>
              </Tabs>
            )}

            {/* Audio Playback */}
            {hasAudio && audioId && (
              <AudioPlayer audioId={audioId} format={audioFormat} duration={audioDuration} />
            )}

            {/* Transcription Section */}
            {hasAudio && !sessionTranscript && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Speech-to-Text Transcription
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Convert audio to text with language detection
                    </p>
                  </div>
                  <Button
                    onClick={handleTranscribe}
                    disabled={isTranscribing}
                    size="lg"
                  >
                    {isTranscribing ? 'Transcribing...' : 'Transcribe Audio'}
                  </Button>
                </div>
              </Card>
            )}

            {/* Transcription Progress */}
            {isTranscribing && (
              <TranscriptionProgress
                current={transcriptionProgress.current}
                total={transcriptionProgress.total}
                currentLanguage={currentLanguage}
                isProcessing={isTranscribing}
              />
            )}

            {/* Transcript Viewer */}
            {sessionTranscript && (
              <TranscriptViewer transcript={sessionTranscript} />
            )}

            {/* Export & Actions */}
            {hasAudio && (
              <div className="flex gap-4">
                <ExportButtons sessionId={currentSession.sessionId} disabled={false} />
                <Button variant="outline" onClick={handleReset} className="ml-auto">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  New Session
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
