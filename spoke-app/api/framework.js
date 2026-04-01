// api/framework.js — POST /api/framework
// Optional 3rd API call. Takes a transcript and applies a user-chosen framework.
//
// Request body (JSON):
//   transcript: string  — the original Whisper transcript
//   framework: string   — the framework rules to apply (preset or custom)
//
// Response (JSON):
//   { formats: { tweet, thread, longform, caption } }

import Anthropic from '@anthropic-ai/sdk';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const FRAMEWORK_PROMPT = `You are a voice-to-writing translator. Apply the framework below to reformat this transcript into platform-ready content.

Core rule: Keep the speaker's voice, word choices, and ideas. The framework shapes the structure — it does not replace the speaker's words with generic writing. Remove filler words (um, uh, like, you know) but keep everything else as close to how they said it as possible.

---
FRAMEWORK:
{FRAMEWORK}
---

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
- tweet: Array of exactly 5 options applying the framework. Each under 280 chars. Keep spoken cadence.
- thread: 3-5 tweets structured using the framework. Each under 280 chars.
- longform: 500-1000 words following the framework structure. Sounds like the speaker, not an AI.
- caption: 50-150 words for Instagram. Conversational. Ends with a question or call to action. 3-5 hashtags on a new line.

Do not add ideas that weren't in the transcript. Do not use corporate or AI-sounding language.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { transcript, framework } = req.body;

  if (!transcript) return res.status(400).json({ error: 'transcript is required' });
  if (!framework) return res.status(400).json({ error: 'framework is required' });

  try {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: FRAMEWORK_PROMPT
            .replace('{FRAMEWORK}', framework)
            .replace('{TRANSCRIPT}', transcript),
        },
      ],
    });

    let formats;
    const rawText = message.content[0].text;
    try {
      formats = JSON.parse(rawText);
    } catch {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Claude returned unparseable output');
      formats = JSON.parse(jsonMatch[0]);
    }

    if (typeof formats.tweet === 'string') formats.tweet = [formats.tweet];
    if (!formats.caption) formats.caption = '';

    return res.status(200).json({ formats });
  } catch (error) {
    console.error('[/api/framework] Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to apply framework' });
  }
}
