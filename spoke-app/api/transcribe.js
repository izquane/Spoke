// api/transcribe.js — POST /api/transcribe
// Transcribes a single audio chunk via Whisper.
//
// Request body (JSON):
//   audio_base64: string  — base64-encoded audio chunk
//   audio_type: string    — MIME type, e.g. "audio/mp4"
//
// Response (JSON):
//   { transcript: string }

import OpenAI from 'openai';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '15mb',
    },
  },
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MIME_TO_EXT = {
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/mp4': 'mp4',
  'audio/x-m4a': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/aac': 'aac',
  'audio/flac': 'flac',
  'audio/x-flac': 'flac',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { audio_base64, audio_type = 'audio/mp4' } = req.body;
  if (!audio_base64) return res.status(400).json({ error: 'audio_base64 is required' });

  try {
    const audioBuffer = Buffer.from(audio_base64, 'base64');
    const mimeType = audio_type || 'audio/mp4';
    const extension = MIME_TO_EXT[mimeType] ?? mimeType.split('/')[1] ?? 'mp4';
    const audioFile = new File([audioBuffer], `chunk.${extension}`, { type: mimeType });

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
    });

    return res.status(200).json({ transcript: transcription.text });
  } catch (error) {
    console.error('[/api/transcribe] Error:', error);
    return res.status(500).json({ error: error.message || 'Transcription failed' });
  }
}
