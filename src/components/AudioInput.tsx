import { useState, useRef, useCallback } from 'react';
import { Upload, Mic, MicOff, FileAudio, X, Loader2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useOfflineContext } from '@/contexts/OfflineContext';
import { offlineBackendService } from '@/services/offlineBackendService';
import { offlineStorage } from '@/services/offlineStorage';
import { useToast } from '@/hooks/use-toast';

interface AudioInputProps {
  onAudioSubmit: (audioBlob: Blob, fileName: string, sessionId: string) => void;
  isProcessing: boolean;
}

export function AudioInput({ onAudioSubmit, isProcessing }: AudioInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isBackendConnected, setCurrentSessionId } = useOfflineContext();
  const { toast } = useToast();

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setAudioFile(null);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: 'Microphone Error',
        description: 'Failed to access microphone. Please check permissions.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const handleFileChange = (file: File | null) => {
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file);
      setRecordedBlob(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    handleFileChange(file);
  };

  const handleSubmit = async () => {
    if (!audioFile && !recordedBlob) return;

    const inputType = audioFile ? 'upload' : 'record';
    const fileName = audioFile ? audioFile.name : `recording_${Date.now()}.webm`;
    const blob = audioFile || recordedBlob!;

    try {
      // Initialize session with backend
      if (isBackendConnected) {
        const session = await offlineBackendService.initSession(inputType);
        setCurrentSessionId(session.caseId);

        // Store session in IndexedDB
        await offlineStorage.saveSession({
          caseId: session.caseId,
          inputType,
          createdAt: session.createdAt,
          status: 'initialized',
          mode: session.mode,
          engine: session.engine,
        });

        console.log('✓ Session initialized and stored:', session.caseId);

        // Call parent handler with session ID
        onAudioSubmit(blob, fileName, session.caseId);
      } else {
        // Fallback: create local session without backend
        const localSessionId = `local-${Date.now()}`;
        setCurrentSessionId(localSessionId);

        await offlineStorage.saveSession({
          caseId: localSessionId,
          inputType,
          createdAt: new Date().toISOString(),
          status: 'initialized',
          mode: 'offline',
          engine: 'local-fallback',
        });

        toast({
          title: 'Backend Not Connected',
          description: 'Session created locally. Start backend for full functionality.',
          variant: 'default',
        });

        onAudioSubmit(blob, fileName, localSessionId);
      }
    } catch (error) {
      console.error('Session initialization error:', error);
      toast({
        title: 'Session Error',
        description: 'Failed to initialize session. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const clearAudio = () => {
    setAudioFile(null);
    setRecordedBlob(null);
  };

  const hasAudio = audioFile || recordedBlob;

  return (
    <div className="glass-panel rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FileAudio className="h-5 w-5 text-primary" />
          Audio Input
        </h2>
        {hasAudio && (
          <Button variant="ghost" size="sm" onClick={clearAudio}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Upload Zone */}
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg p-6 transition-all cursor-pointer",
            "hover:border-primary/50 hover:bg-primary/5",
            dragActive && "border-primary bg-primary/10",
            audioFile && "border-risk-low bg-risk-low/5"
          )}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
          />
          <div className="flex flex-col items-center gap-3 text-center">
            <div className={cn(
              "p-3 rounded-full",
              audioFile ? "bg-risk-low/20" : "bg-muted"
            )}>
              <Upload className={cn(
                "h-6 w-6",
                audioFile ? "text-risk-low" : "text-muted-foreground"
              )} />
            </div>
            {audioFile ? (
              <>
                <p className="font-medium text-risk-low">{audioFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </>
            ) : (
              <>
                <p className="font-medium">Drop audio file here</p>
                <p className="text-sm text-muted-foreground">
                  or click to browse
                </p>
              </>
            )}
          </div>
        </div>

        {/* Record Zone */}
        <div className={cn(
          "border-2 border-dashed rounded-lg p-6 transition-all",
          isRecording && "border-risk-high bg-risk-high/5",
          recordedBlob && !isRecording && "border-risk-low bg-risk-low/5"
        )}>
          <div className="flex flex-col items-center gap-3 text-center h-full justify-center">
            <Button
              variant={isRecording ? "destructive" : "secondary"}
              size="lg"
              className={cn(
                "rounded-full h-16 w-16",
                isRecording && "animate-pulse-glow"
              )}
              onClick={isRecording ? stopRecording : startRecording}
            >
              {isRecording ? (
                <MicOff className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </Button>
            <p className="font-medium">
              {isRecording ? "Recording... Click to stop" :
                recordedBlob ? "Recording captured" : "Record live audio"}
            </p>
            {recordedBlob && !isRecording && (
              <p className="text-xs text-muted-foreground">
                {(recordedBlob.size / 1024).toFixed(1)} KB recorded
              </p>
            )}
          </div>
        </div>
      </div>

      <Button
        className="w-full"
        size="lg"
        disabled={!hasAudio || isProcessing}
        onClick={handleSubmit}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Shield className="h-4 w-4 mr-2" />
            Initialize Session & Submit
          </>
        )}
      </Button>
    </div>
  );
}