// api.js — fetch wrapper for /api/recordings and /api/transcribe

import { splitAudioIntoChunks } from './audioChunker.js';

const LARGE_FILE_THRESHOLD = 10 * 1024 * 1024; // 10MB — above this we chunk via Web Audio API

/**
 * Submits an audio Blob to the backend pipeline.
 * Large files are decoded, split into 5-min WAV chunks, transcribed in sequence,
 * then formatted in one Claude call.
 * Returns: { recording_id, transcript, formats: { tweet, thread, longform, caption } }
 */
export async function submitRecording(audioBlob) {
  let transcript;

  if (audioBlob.size > LARGE_FILE_THRESHOLD) {
    transcript = await transcribeInChunks(audioBlob);
  } else {
    transcript = await transcribeSingle(audioBlob);
  }

  return formatTranscript(transcript, audioBlob.type);
}

/**
 * Transcribes a single small audio blob directly.
 */
async function transcribeSingle(audioBlob) {
  const base64 = await blobToBase64(audioBlob);
  const response = await fetch('/api/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audio_base64: base64.split(',')[1],
      audio_type: audioBlob.type,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Transcription failed (${response.status})`);
  }

  const data = await response.json();
  return data.transcript;
}

/**
 * Decodes a large audio file, splits into 5-min WAV chunks, transcribes each.
 */
async function transcribeInChunks(audioBlob) {
  const chunks = await splitAudioIntoChunks(audioBlob);

  const transcripts = [];
  for (const chunk of chunks) {
    const base64 = await blobToBase64(chunk);
    const response = await fetch('/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio_base64: base64.split(',')[1],
        audio_type: 'audio/wav',
      }),
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
 * Returns: { recording_id, transcript, formats }
 */
async function formatTranscript(transcript, audioType) {
  const response = await fetch('/api/recordings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript, audio_type: audioType }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Formatting failed (${response.status})`);
  }

  return response.json();
}

/**
 * Applies a framework to an existing transcript.
 * Returns: { formats: { tweet, thread, longform, caption } }
 */
export async function applyFramework(transcript, framework) {
  const response = await fetch('/api/framework', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript, framework }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Request failed (${response.status})`);
  }

  return response.json();
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
