// api.js — fetch wrapper for /api/recordings and /api/transcribe

import { splitAudioIntoChunks } from './audioChunker.js';

const LARGE_FILE_THRESHOLD = 1.5 * 1024 * 1024; // 1.5MB — base64 adds 33%, giving ~2MB encoded, well under Vercel's body limit

/**
 * Submits an audio Blob to the backend pipeline.
 * Large files are decoded, split into 5-min WAV chunks, transcribed in sequence,
 * then formatted in one Claude call.
 * Returns: { transcript, formats: { essay, moments } }
 */
export async function submitRecording(audioBlob, { voiceExamples = '', writingIntent = '' } = {}) {
  let transcript;

  if (audioBlob.size > LARGE_FILE_THRESHOLD) {
    transcript = await transcribeInChunks(audioBlob);
  } else {
    transcript = await transcribeSingle(audioBlob);
  }

  return formatTranscript(transcript, { voiceExamples, writingIntent });
}

/**
 * Transcribes a single small audio blob directly.
 */
async function transcribeSingle(audioBlob) {
  const response = await fetch('/api/transcribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'X-Audio-Type': audioBlob.type || 'audio/wav',
    },
    body: audioBlob,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Transcription failed (${response.status})`);
  }

  const data = await response.json();
  return data.transcript;
}

/**
 * Decodes a large audio file, splits into 60s WAV chunks, transcribes each.
 */
async function transcribeInChunks(audioBlob) {
  const chunks = await splitAudioIntoChunks(audioBlob);

  const transcripts = [];
  for (const chunk of chunks) {
    const response = await fetch('/api/transcribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-Audio-Type': 'audio/wav',
      },
      body: chunk,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Transcription failed (${response.status})`);
    }

    const data = await response.json();
    transcripts.push(data.transcript);
  }

  return transcripts.join(' ');
}

/**
 * Sends a transcript to Claude for formatting.
 * Returns: { transcript, perspective, formats: { essay, moments } }
 */
async function formatTranscript(transcript, { voiceExamples, writingIntent, perspective }) {
  const response = await fetch('/api/recordings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transcript,
      voice_examples: voiceExamples,
      writing_intent: writingIntent,
      perspective,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Formatting failed (${response.status})`);
  }

  return response.json();
}

/**
 * Re-formats an already-transcribed transcript with a new perspective.
 * Skips the Whisper transcription step entirely.
 * Returns: { transcript, perspective, formats: { essay, moments } }
 */
export async function reformatTranscript(transcript, { voiceExamples = '', writingIntent = '', perspective } = {}) {
  return formatTranscript(transcript, { voiceExamples, writingIntent, perspective });
}

/**
 * Sends screenshot images to Claude Vision to extract post text.
 * Sends one image at a time to stay under Vercel's 4.5MB body limit.
 * Returns: { text: string }
 */
export async function extractVoiceFromImages(imageFiles) {
  const texts = [];

  for (const file of imageFiles) {
    const base64 = await blobToBase64(file);
    const image = {
      data: base64.split(',')[1],
      type: file.type || 'image/jpeg',
    };

    const response = await fetch('/api/extract-voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: [image] }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Extraction failed (${response.status})`);
    }

    const { text } = await response.json();
    if (text) texts.push(text);
  }

  return { text: texts.join('\n\n') };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
