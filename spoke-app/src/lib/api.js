// api.js — fetch wrapper for /api/recordings
// Used by App.jsx to submit audio and get back formatted content.

/**
 * Submits an audio Blob to the backend pipeline.
 * Converts to base64, POSTs to /api/recordings.
 * Returns: { recording_id, transcript, formats: { tweet, thread, longform } }
 */
export async function submitRecording(audioBlob) {
  const base64 = await blobToBase64(audioBlob);

  const response = await fetch('/api/recordings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audio_base64: base64.split(',')[1], // strip the data URI prefix
      audio_type: audioBlob.type,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Request failed (${response.status})`);
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

/**
 * Fetches a previously processed recording by ID.
 * Returns: { id, transcript, formats, created_at }
 */
export async function getRecording(id) {
  const response = await fetch(`/api/recordings/${id}`);

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Not found (${response.status})`);
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
