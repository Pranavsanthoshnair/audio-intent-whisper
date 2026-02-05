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
