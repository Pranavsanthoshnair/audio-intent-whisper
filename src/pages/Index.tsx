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
import { TranslationProgress } from '@/components/TranslationProgress';
import { DualLanguageViewer } from '@/components/DualLanguageViewer';
import { ModelLoadingProgress } from '@/components/ModelLoadingProgress';
import { ThreatAnalysisCard } from '@/components/ThreatAnalysisCard';

// Services
import { createSession, getSession, updateSessionStatus } from '@/services/sessionService';
import { storeAudio } from '@/services/audioStorageService';
import { transcribeChunks } from '@/services/sttService';
import { storeTranscriptChunks, aggregateTranscripts } from '@/services/transcriptService';
import { translateChunks } from '@/services/translationService';
import { storeTranslationChunks, aggregateTranslations } from '@/services/translationAggregationService';
import type { Session, ThreatAnalysisRecord } from '@/services/offlineStorage';
import type { SessionTranscript } from '@/services/transcriptService';
import type { SessionTranslation } from '@/services/translationAggregationService';

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

  // Translation state
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState({ current: 0, total: 0 });
  const [sessionTranslation, setSessionTranslation] = useState<SessionTranslation | null>(null);

  // Threat analysis state
  const [threatAnalysis, setThreatAnalysis] = useState<ThreatAnalysisRecord | null>(null);
  const [isAnalyzingThreats, setIsAnalyzingThreats] = useState(false);

  // Whisper model state
  const [modelProgress, setModelProgress] = useState(0);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);

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
      // Initialize Whisper model if not loaded
      const { initializeWhisperModel, getModelStatus } = await import('@/services/whisperService');
      const modelStatus = getModelStatus();

      if (!modelStatus.isLoaded && !modelStatus.isLoading) {
        setIsModelLoading(true);
        await initializeWhisperModel((progress) => {
          setModelProgress(progress);
        });
        setIsModelLoaded(true);
        setIsModelLoading(false);
      }

      // Get the actual audio from IndexedDB
      const { getAudio } = await import('@/services/audioStorageService');
      const audioRecord = await getAudio(audioId);

      if (!audioRecord) {
        throw new Error('Audio not found');
      }

      // Split audio into chunks for processing
      const { splitAudioIntoChunks } = await import('@/services/audioChunkingService');
      const audioChunks = await splitAudioIntoChunks(audioRecord.audioBlob, 30); // 30-second chunks

      setTranscriptionProgress({ current: 0, total: audioChunks.length });

      // Transcribe chunks with progress
      let transcripts: any[] = [];
      transcripts = await transcribeChunks(audioChunks, (current, total) => {
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
        description: `Transcribed ${transcripts.length} chunks`,
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
   * Handle translation
   */
  const handleTranslate = async () => {
    if (!currentSession || !sessionTranscript) return;

    setIsTranslating(true);
    setTranslationProgress({ current: 0, total: 0 });

    try {
      const transcriptChunks = sessionTranscript.fullTranscript;
      setTranslationProgress({ current: 0, total: transcriptChunks.length });

      // Translate chunks with progress
      const translations = await translateChunks(transcriptChunks, (current, total) => {
        setTranslationProgress({ current, total });
      });

      // Store translations in IndexedDB
      await storeTranslationChunks(currentSession.sessionId, translations);

      // Update session status
      await updateSessionStatus(currentSession.sessionId, 'translated');

      // Aggregate translations
      const aggregated = await aggregateTranslations(currentSession.sessionId);
      setSessionTranslation(aggregated);

      const updatedSession = await getSession(currentSession.sessionId);
      if (updatedSession) setCurrentSession(updatedSession);

      toast({
        title: 'Translation Complete',
        description: `Translated ${translations.length} chunks to English`,
      });
    } catch (error) {
      toast({
        title: 'Translation Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsTranslating(false);
    }
  };

  /**
   * Analyze threats in session
   */
  const handleAnalyzeThreats = async () => {
    if (!currentSession) {
      toast({
        title: 'No Session',
        description: 'Please create a session and transcribe audio first',
        variant: 'destructive',
      });
      return;
    }

    if (!sessionTranscript || !sessionTranscript.fullTranscript) {
      toast({
        title: 'No Transcript',
        description: 'Please transcribe audio before analyzing threats',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsAnalyzingThreats(true);

      toast({
        title: 'Analyzing Threats',
        description: 'Scanning transcript for threat indicators...',
      });

      // Import orchestrator dynamically
      const { analyzeSessionThreats } = await import('@/services/threatAnalysisOrchestrator');

      // Run threat analysis
      const analysis = await analyzeSessionThreats(currentSession.sessionId);

      setThreatAnalysis(analysis);

      // Update session status
      await updateSessionStatus(currentSession.sessionId, 'analyzed');

      const updatedSession = await getSession(currentSession.sessionId);
      if (updatedSession) setCurrentSession(updatedSession);

      toast({
        title: 'Analysis Complete',
        description: `Threat level: ${analysis.severity} (Score: ${analysis.threatScore})`,
        variant: analysis.severity === 'HIGH_RISK' ? 'destructive' : 'default',
      });
    } catch (error) {
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzingThreats(false);
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
    setSessionTranslation(null);
    setIsTranslating(false);
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

            {/* Whisper Model Loading */}
            {(isModelLoading || isModelLoaded) && (
              <ModelLoadingProgress
                progress={modelProgress}
                isLoading={isModelLoading}
                isLoaded={isModelLoaded}
              />
            )}

            {/* Transcription */}
            {hasAudio && !sessionTranscript && (
              <Card className="p-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Step 2: Transcribe Audio</h3>
                  <p className="text-sm text-muted-foreground">
                    Convert audio to text with automatic language detection
                  </p>
                  <Button onClick={handleTranscribe} disabled={isTranscribing} className="w-full">
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
              />
            )}

            {/* Transcript Viewer */}
            {sessionTranscript && !sessionTranslation && (
              <TranscriptViewer transcript={sessionTranscript} />
            )}

            {/* Translation */}
            {sessionTranscript && !sessionTranslation && !isTranslating && (
              <Card className="p-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Step 3: Translate to English</h3>
                  <p className="text-sm text-muted-foreground">
                    Translate transcript to English for analysis and reporting
                  </p>
                  <Button onClick={handleTranslate} className="w-full">
                    Translate to English
                  </Button>
                </div>
              </Card>
            )}

            {/* Translation Progress */}
            {isTranslating && (
              <TranslationProgress
                current={translationProgress.current}
                total={translationProgress.total}
                currentLanguage={currentLanguage}
              />
            )}

            {/* Dual Language Viewer */}
            {sessionTranslation && (
              <DualLanguageViewer translation={sessionTranslation} />
            )}

            {/* Threat Analysis */}
            {sessionTranscript && !threatAnalysis && (
              <Card className="p-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Step 3: Analyze Threats</h3>
                  <p className="text-sm text-muted-foreground">
                    Scan transcript for threat-related keywords and generate risk assessment
                  </p>
                  <Button
                    onClick={handleAnalyzeThreats}
                    disabled={isAnalyzingThreats}
                    className="w-full"
                  >
                    {isAnalyzingThreats ? 'Analyzing...' : 'Analyze Threats'}
                  </Button>
                </div>
              </Card>
            )}

            {/* Threat Analysis Results */}
            {threatAnalysis && (
              <ThreatAnalysisCard analysis={threatAnalysis} />
            )}

            {/* Export */}
            {sessionTranscript && (
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
