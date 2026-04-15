// api/recordings.js — POST /api/recordings
// The core pipeline: audio → Whisper transcript → Claude formats → Supabase → response
//
// Request body (JSON):
//   audio_base64: string  — base64-encoded audio (no data URI prefix)
//   audio_type: string    — MIME type, e.g. "audio/webm"
//
// Response (JSON):
//   { recording_id, transcript, formats: { tweet, thread, longform } }

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

// ─── Clients ─────────────────────────────────────────────────────────────────

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── Formatting prompt ───────────────────────────────────────────────────────
// To change the framework or output format, edit this prompt.

const FORMATTING_PROMPT = `You are a voice-to-writing translator. Your job is to turn a spoken audio transcript into platform-ready written content.

Core rule: Preserve the speaker's exact voice, rhythm, and word choices. Do not rewrite, reframe, or impose a structure that wasn't in the original. Remove only noise — filler words (um, uh, like, you know), false starts, and repetition. Everything else stays as close to how they said it as possible.

Raw transcript:
{TRANSCRIPT}

Output ONLY this exact JSON structure — no markdown, no explanation:
{
  "tweet": ["<option 1>", "<option 2>", "<option 3>", "<option 4>", "<option 5>"],
  "thread": ["<tweet 1>", "<tweet 2>", "<tweet 3>"],
  "longform": "<longform text>",
  "caption": "<instagram caption>"
}

Rules:
- tweet: Array of exactly 5 options. Each is a different angle on the same idea: (1) exactly as they said it cleaned up, (2) leading with the most surprising line, (3) as a question, (4) as a bold single claim, (5) as a short personal story opener. Each under 280 chars. Keep spoken cadence — short sentences, fragments, line breaks are fine.
- thread: 3-5 tweets. First tweet hooks. Middle tweets unpack. Last tweet lands the point. Each under 280 chars. Flows like the speaker actually talks.
- longform: 500-1000 words. Structured with headers. Expands on the ideas in the transcript. Sounds like the speaker wrote it, not like an AI. Ready to paste into Substack.
- caption: 50-150 words. Written for Instagram. Conversational, visual, ends with a question or call to action. 3-5 relevant hashtags on a new line at the end.

Do not add ideas that weren't in the transcript. Do not use corporate or AI-sounding language. If the speaker used slang or informal phrasing, keep it.`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Accept either a pre-built transcript (from chunked flow) or raw audio
  const { transcript: prebuiltTranscript, audio_base64, audio_type = 'audio/webm' } = req.body;

  if (!prebuiltTranscript && !audio_base64) {
    return res.status(400).json({ error: 'transcript or audio_base64 is required' });
  }

  try {
    let transcript;

    if (prebuiltTranscript) {
      // Chunked flow: transcript already built by the frontend
      transcript = prebuiltTranscript;
    } else {
      // Single file flow: transcribe here
      const audioBuffer = Buffer.from(audio_base64, 'base64');
      const mimeType = audio_type || 'audio/webm';
      const extension = MIME_TO_EXT[mimeType] ?? mimeType.split('/')[1] ?? 'webm';
      const audioFile = new File([audioBuffer], `recording.${extension}`, { type: mimeType });

      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
      });
      transcript = transcription.text;
    }

    // Step 2 (or 3): Format with Anthropic Claude
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: FORMATTING_PROMPT.replace('{TRANSCRIPT}', transcript),
        },
      ],
    });

    // Parse Claude's JSON response
    let formats;
    const rawText = message.content[0].text;
    console.log('[Claude raw]', rawText.slice(0, 500));
    try {
      formats = JSON.parse(rawText);
    } catch {
      // Claude sometimes wraps JSON in markdown code fences — strip them
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Claude returned unparseable output');
      formats = JSON.parse(jsonMatch[0]);
    }

    // Normalize: ensure tweet is always an array
    if (typeof formats.tweet === 'string') {
      formats.tweet = [formats.tweet];
    }
    // Normalize: ensure caption always exists
    if (!formats.caption) {
      formats.caption = '';
    }

    // Step 4: Store in Supabase
    const { data, error: dbError } = await supabase
      .from('recordings')
      .insert({ transcript, formats })
      .select('id')
      .single();

    if (dbError) throw dbError;

    // Step 5: Return everything to the frontend
    return res.status(200).json({
      recording_id: data.id,
      transcript,
      formats,
    });
  } catch (error) {
    console.error('[/api/recordings] Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to process recording',
    });
  }
}
