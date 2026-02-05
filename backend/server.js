import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

// Track server uptime
const startTime = Date.now();

// CORS Configuration
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:8080', 'http://localhost:4173'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Security headers middleware
app.use((req, res, next) => {
  // Allow Chrome DevTools and development tools
  res.setHeader('Content-Security-Policy',
    "default-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:* chrome-extension:; " +
    "connect-src 'self' http://localhost:* ws://localhost:* chrome-extension:; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' chrome-extension:; " +
    "style-src 'self' 'unsafe-inline' chrome-extension:;"
  );
  next();
});

// In-memory session storage (for this checkpoint only)
const sessions = new Map();

/**
 * Health Check Endpoint
 * Returns backend status and uptime
 */
app.get('/health', (req, res) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  res.json({
    status: 'online',
    mode: 'offline-first',
    engine: 'local',
    uptime: uptime,
    timestamp: new Date().toISOString(),
    message: 'Offline backend engine is running'
  });
});

/**
 * Ping Endpoint
 * Simple connectivity check
 */
app.get('/api/ping', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now()
  });
});

/**
 * Initialize Session Endpoint
 * Creates a new offline session/case
 * 
 * TODO (Checkpoint 4): Add translation and threat analysis
 * TODO (Checkpoint 3): Add AI/ML integration
 */
app.post('/api/init-session', (req, res) => {
  try {
    const { inputType } = req.body;

    // Validate input type
    if (!inputType || !['record', 'upload'].includes(inputType)) {
      return res.status(400).json({
        error: 'Invalid input type. Must be "record" or "upload"'
      });
    }

    // Generate unique case ID
    const caseId = `case-${uuidv4().split('-')[0]}`;

    // Create session object
    const session = {
      caseId,
      inputType,
      mode: 'offline',
      engine: 'local',
      status: 'initialized',
      createdAt: new Date().toISOString(),
      // TODO: Add audio metadata in next checkpoint
      // TODO: Add processing pipeline info
    };

    // Store session in memory
    sessions.set(caseId, session);

    console.log(`✓ Session initialized: ${caseId} (${inputType})`);

    res.json(session);
  } catch (error) {
    console.error('Session initialization error:', error);
    res.status(500).json({
      error: 'Failed to initialize session',
      details: error.message
    });
  }
});

/**
 * Get Session Endpoint
 * Retrieve session details by case ID
 */
app.get('/api/session/:caseId', (req, res) => {
  const { caseId } = req.params;
  const session = sessions.get(caseId);

  if (!session) {
    return res.status(404).json({
      error: 'Session not found'
    });
  }

  res.json(session);
});

/**
 * List All Sessions Endpoint
 * For debugging and monitoring
 */
app.get('/api/sessions', (req, res) => {
  const allSessions = Array.from(sessions.values());
  res.json({
    count: allSessions.length,
    sessions: allSessions
  });
});

/**
 * Audio Upload Endpoint (Checkpoint 2 - Completed)
 * Accept audio metadata and link to session
 */
app.post('/api/audio/upload', (req, res) => {
  try {
    const { sessionId, format, duration, size } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const audioId = `audio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const session = sessions.get(sessionId);
    if (session) {
      session.audioId = audioId;
      session.status = 'audio_attached';
      sessions.set(sessionId, session);
    }

    console.log(`✓ Audio uploaded: ${audioId} for session ${sessionId}`);

    res.json({
      audioId,
      sessionId,
      stored: true,
      message: 'Audio metadata stored successfully',
    });
  } catch (error) {
    console.error('Audio upload error:', error);
    res.status(500).json({ error: 'Failed to process audio upload' });
  }
});

/**
 * Get Audio Metadata
 */
app.get('/api/audio/:audioId', (req, res) => {
  const { audioId } = req.params;
  const session = Array.from(sessions.values()).find(s => s.audioId === audioId);

  if (!session) {
    return res.status(404).json({ error: 'Audio not found' });
  }

  res.json({
    audioId,
    sessionId: session.caseId,
    status: 'stored',
    message: 'Audio is stored in browser IndexedDB',
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

/**
 * Transcription Endpoint (Checkpoint 3)
 * Process audio chunks and return transcripts
 */
app.post('/api/transcribe', async (req, res) => {
  try {
    const { sessionId, chunks } = req.body;

    if (!sessionId || !chunks || !Array.isArray(chunks)) {
      return res.status(400).json({ error: 'sessionId and chunks array required' });
    }

    console.log(`Processing ${chunks.length} chunks for session ${sessionId}`);

    // Mock transcription processing
    const transcripts = chunks.map((chunk, index) => {
      // Simulate language detection (deterministic based on chunk index)
      const languages = ['hindi', 'urdu', 'kashmiri', 'english'];
      const language = languages[index % languages.length];

      // Mock transcript texts
      const mockTexts = {
        hindi: 'यह एक परीक्षण ऑडियो है',
        urdu: 'یہ ایک ٹیسٹ آڈیو ہے',
        kashmiri: 'یہ اکھ ٹیسٹ آڈیو چھُ',
        english: 'This is a test audio recording'
      };

      return {
        chunkId: chunk.chunkId,
        text: mockTexts[language],
        language,
        confidence: 0.7 + Math.random() * 0.25, // 0.7-0.95
        startTime: chunk.startTime || index * 5,
        duration: chunk.duration || 5
      };
    });

    // Calculate dominant language
    const languageCounts = {};
    transcripts.forEach(t => {
      languageCounts[t.language] = (languageCounts[t.language] || 0) + 1;
    });

    const dominantLanguage = Object.keys(languageCounts).reduce((a, b) =>
      languageCounts[a] > languageCounts[b] ? a : b
    );

    // Calculate average confidence
    const avgConfidence = transcripts.reduce((sum, t) => sum + t.confidence, 0) / transcripts.length;

    const session = sessions.get(sessionId);
    if (session) {
      session.status = 'transcribed';
      session.dominantLanguage = dominantLanguage;
      sessions.set(sessionId, session);
    }

    console.log(`✓ Transcribed ${transcripts.length} chunks for session ${sessionId}`);

    res.json({
      sessionId,
      chunksProcessed: transcripts.length,
      dominantLanguage,
      confidenceAvg: parseFloat(avgConfidence.toFixed(2)),
      transcripts
    });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: 'Failed to process transcription' });
  }
});

/**
 * Get Transcript by Session
 */
app.get('/api/transcript/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  // In a real implementation, transcripts would be stored
  // For now, return session info
  res.json({
    sessionId,
    status: session.status,
    dominantLanguage: session.dominantLanguage || 'unknown',
    message: 'Transcripts are stored in browser IndexedDB'
  });
});

/**
 * Translation Endpoint (Checkpoint 4)
 * Translate transcript chunks to English
 */
app.post('/api/translate', async (req, res) => {
  try {
    const { sessionId, transcriptChunks } = req.body;

    if (!sessionId || !transcriptChunks || !Array.isArray(transcriptChunks)) {
      return res.status(400).json({ error: 'sessionId and transcriptChunks array required' });
    }

    console.log(`Translating ${transcriptChunks.length} chunks for session ${sessionId}`);

    // Mock translation (dictionary-based)
    const phraseDictionary = {
      hindi: {
        'यह एक परीक्षण ऑडियो है': 'This is a test audio',
        'कृपया ध्यान से सुनें': 'Please listen carefully',
        'धन्यवाद': 'Thank you',
      },
      urdu: {
        'یہ ایک ٹیسٹ آڈیو ہے': 'This is a test audio',
        'براہ کرم غور سے سنیں': 'Please listen carefully',
        'شکریہ': 'Thank you',
      },
      kashmiri: {
        'یہ اکھ ٹیسٹ آڈیو چھُ': 'This is a test audio',
        'مہربأنی کٔرتھ غور سٟتؠ بوزِو': 'Please listen carefully',
        'شُکریہ': 'Thank you',
      },
      english: {},
    };

    const translations = transcriptChunks.map((chunk) => {
      const { chunkId, sourceLanguage, sourceText, startTime } = chunk;

      // Translate using dictionary or return as-is for English
      let translatedText = sourceText;
      let confidence = 1.0;

      if (sourceLanguage !== 'english') {
        const dict = phraseDictionary[sourceLanguage] || {};
        translatedText = dict[sourceText] || sourceText;
        confidence = dict[sourceText] ? 0.9 : 0.7; // Higher confidence for exact matches
      }

      return {
        chunkId,
        sourceLanguage,
        sourceText,
        translatedText,
        confidence,
        startTime: startTime || 0,
      };
    });

    // Update session status
    const session = sessions.get(sessionId);
    if (session) {
      session.status = 'translated';
      sessions.set(sessionId, session);
    }

    console.log(`✓ Translated ${translations.length} chunks for session ${sessionId}`);

    res.json({
      sessionId,
      chunksTranslated: translations.length,
      targetLanguage: 'english',
      translations,
    });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: 'Failed to process translation' });
  }
});

/**
 * Get Translation by Session
 */
app.get('/api/translation/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  // In a real implementation, translations would be stored
  // For now, return session info
  res.json({
    sessionId,
    status: session.status,
    targetLanguage: 'english',
    message: 'Translations are stored in browser IndexedDB',
  });
});

// ============================================
// SERVER STARTUP
// ============================================

app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   OFFLINE BACKEND ENGINE                       ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log('');
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log('✓ Mode: Offline-First');
  console.log('');
  console.log('Available endpoints:');
  console.log('  GET  /health              - Health check');
  console.log('  GET  /api/ping            - Connectivity test');
  console.log('  POST /api/init-session    - Initialize new session');
  console.log('  GET  /api/session/:id     - Get session details');
  console.log('  GET  /api/sessions        - List all sessions');
  console.log('  POST /api/transcribe      - Transcribe audio chunks');
  console.log('  GET  /api/transcript/:id  - Get session transcript');
  console.log('\n⏳ Waiting for requests...\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n⚠ SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n⚠ SIGINT received, shutting down gracefully...');
  process.exit(0);
});
