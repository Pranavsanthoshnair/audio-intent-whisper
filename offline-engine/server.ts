import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { transcribePcm16k, type SupportedLanguage } from './stt/whisper.js';
import { translateToEnglish } from './stt/translation.js';

const PORT = Number(process.env.OFFLINE_ENGINE_PORT || 3040);

type JsonValue = Record<string, any>;

interface TranscribeRequest {
  sessionId: string;
  chunkId?: string;
  startTime?: number;
  audioBase64: string;
  mimeType?: string;
}

interface TranslateRequest {
  chunkId: string;
  sourceLanguage: SupportedLanguage;
  sourceText: string;
  startTime?: number;
}

function sendJson(res: ServerResponse, statusCode: number, payload: JsonValue) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req: IncomingMessage): Promise<JsonValue> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function decodeWavPcm16ToFloat32(wavBytes: Buffer): Float32Array {
  if (wavBytes.length < 44) {
    throw new Error('WAV payload too small');
  }

  const channels = wavBytes.readUInt16LE(22);
  const sampleRate = wavBytes.readUInt32LE(24);
  const bitsPerSample = wavBytes.readUInt16LE(34);

  if (bitsPerSample !== 16) {
    throw new Error(`Only PCM16 WAV is supported. Received ${bitsPerSample}-bit.`);
  }

  const dataOffset = 44;
  const dataLength = wavBytes.length - dataOffset;
  const totalSamples = dataLength / 2;

  const monoSampleCount = Math.floor(totalSamples / channels);
  const mono = new Float32Array(monoSampleCount);

  let srcSample = 0;
  for (let i = 0; i < monoSampleCount; i++) {
    let sum = 0;
    for (let c = 0; c < channels; c++) {
      const value = wavBytes.readInt16LE(dataOffset + (srcSample + c) * 2);
      sum += value / 32768;
    }
    mono[i] = sum / channels;
    srcSample += channels;
  }

  if (sampleRate === 16000) {
    return mono;
  }

  const ratio = sampleRate / 16000;
  const resampledLength = Math.max(1, Math.floor(mono.length / ratio));
  const resampled = new Float32Array(resampledLength);

  for (let i = 0; i < resampledLength; i++) {
    const sourceIndex = Math.min(mono.length - 1, Math.floor(i * ratio));
    resampled[i] = mono[sourceIndex];
  }

  return resampled;
}

function validateTranscribeRequest(payload: JsonValue): payload is TranscribeRequest {
  return typeof payload.sessionId === 'string' && typeof payload.audioBase64 === 'string';
}

function validateTranslateRequest(payload: JsonValue): payload is TranslateRequest {
  return typeof payload.chunkId === 'string' && typeof payload.sourceLanguage === 'string' && typeof payload.sourceText === 'string';
}

const server = createServer(async (req, res) => {
  if (!req.url || !req.method) {
    return sendJson(res, 400, { error: 'Malformed request' });
  }

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
    return res.end();
  }

  if (req.method === 'GET' && req.url === '/health') {
    return sendJson(res, 200, {
      status: 'online',
      engine: 'local-node-whisper',
      offlineOnly: true,
      model: 'openai/whisper-tiny',
      translationModel: 'Xenova/m2m100_418M',
    });
  }

  if (req.method === 'POST' && req.url === '/transcribe') {
    try {
      const payload = await readJsonBody(req);

      if (!validateTranscribeRequest(payload)) {
        return sendJson(res, 400, {
          error: 'sessionId and audioBase64 are required',
        });
      }

      const chunkId = payload.chunkId || randomUUID();
      const wav = Buffer.from(payload.audioBase64, 'base64');
      const pcm16k = decodeWavPcm16ToFloat32(wav);
      const transcription = await transcribePcm16k(pcm16k);

      return sendJson(res, 200, {
        sessionId: payload.sessionId,
        chunkId,
        detectedLanguage: transcription.detectedLanguage,
        detectedLanguageCode: transcription.rawLanguageCode,
        text: transcription.text,
        confidence: transcription.confidence,
        timestamps: transcription.timestamps,
        startTime: payload.startTime ?? 0,
      });
    } catch (error) {
      return sendJson(res, 500, {
        error: 'Transcription failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  if (req.method === 'POST' && req.url === '/translate') {
    try {
      const payload = await readJsonBody(req);

      if (!validateTranslateRequest(payload)) {
        return sendJson(res, 400, {
          error: 'chunkId, sourceLanguage, and sourceText are required',
        });
      }

      const translation = await translateToEnglish(payload.sourceText, payload.sourceLanguage);

      return sendJson(res, 200, {
        chunkId: payload.chunkId,
        sourceLanguage: payload.sourceLanguage,
        sourceText: payload.sourceText,
        translatedText: translation.translatedText,
        confidence: translation.confidence,
        startTime: payload.startTime ?? 0,
      });
    } catch (error) {
      return sendJson(res, 500, {
        error: 'Translation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`Offline Whisper engine listening on http://localhost:${PORT}`);
  console.log('POST /transcribe accepts local WAV/PCM chunks and returns transcript metadata.');
  console.log('POST /translate translates transcript text to English using local model files only.');
});
