// audioChunker.js
// Decodes an audio file to raw PCM using the Web Audio API,
// downsamples to 16kHz mono (all Whisper needs), splits into 2-min chunks,
// and re-encodes each as a WAV Blob (~3.8MB each, safe under API limits).

const TARGET_SAMPLE_RATE = 16000; // Whisper only needs 16kHz
const CHUNK_DURATION_SECS = 60; // 60 seconds per chunk — ~1.8MB raw, ~2.4MB base64, well under Vercel's body limit

/**
 * Takes an audio Blob, downsamples to 16kHz mono, splits into chunks,
 * and returns an array of WAV Blobs.
 */
export async function splitAudioIntoChunks(audioBlob) {
  const arrayBuffer = await audioBlob.arrayBuffer();

  // Decode at original sample rate
  const decodeContext = new AudioContext();
  const originalBuffer = await decodeContext.decodeAudioData(arrayBuffer);
  await decodeContext.close();

  // Resample to 16kHz mono using OfflineAudioContext
  const duration = originalBuffer.duration;
  const targetLength = Math.ceil(duration * TARGET_SAMPLE_RATE);
  const offlineCtx = new OfflineAudioContext(1, targetLength, TARGET_SAMPLE_RATE);
  const source = offlineCtx.createBufferSource();
  source.buffer = originalBuffer;
  source.connect(offlineCtx.destination);
  source.start();
  const resampled = await offlineCtx.startRendering();

  const totalSamples = resampled.length;
  const chunkSamples = Math.floor(CHUNK_DURATION_SECS * TARGET_SAMPLE_RATE);
  const channelData = resampled.getChannelData(0);

  const chunks = [];
  let offset = 0;

  while (offset < totalSamples) {
    const length = Math.min(chunkSamples, totalSamples - offset);
    const slice = channelData.slice(offset, offset + length);
    chunks.push(encodeWavMono(slice, TARGET_SAMPLE_RATE));
    offset += length;
  }

  return chunks;
}

/**
 * Encodes a mono Float32Array as a 16kHz WAV Blob.
 * 2 minutes at 16kHz mono = ~3.8MB — safe to base64 encode and POST.
 */
function encodeWavMono(samples, sampleRate) {
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);            // PCM
  view.setUint16(22, 1, true);            // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  let pos = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(pos, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    pos += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view, offset, str) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
