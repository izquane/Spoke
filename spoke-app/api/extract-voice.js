// api/extract-voice.js — POST /api/extract-voice
// Accepts up to 10 base64-encoded images (Instagram screenshots).
// Uses Claude Vision to extract the post text from each screenshot.
// Returns the extracted writing as a single text block.
//
// Request body (JSON):
//   images: [{ data: string (base64), type: string (MIME) }]
//
// Response (JSON):
//   { text: string }

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const EXTRACTION_PROMPT = `These are screenshots of social media posts I've written. Extract only the post text from each screenshot.

Rules:
- Include only the actual written content of each post
- Exclude usernames, follower counts, likes, timestamps, hashtag counts, UI elements, and captions like "liked by X and others"
- Separate each post with a blank line
- Preserve line breaks within each post exactly as they appear
- Do not add labels like "Post 1:", "Post 2:" etc.
- Do not summarize or paraphrase — extract verbatim

Return only the extracted post text, nothing else.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { images } = req.body;

  if (!Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ error: 'images array is required' });
  }

  if (images.length > 10) {
    return res.status(400).json({ error: 'Maximum 10 images per request' });
  }

  try {
    const imageContent = images.map(({ data, type }) => ({
      type: 'image',
      source: {
        type: 'base64',
        media_type: type,
        data,
      },
    }));

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            ...imageContent,
            { type: 'text', text: EXTRACTION_PROMPT },
          ],
        },
      ],
    });

    const text = message.content[0].text.trim();
    return res.status(200).json({ text });
  } catch (error) {
    console.error('[/api/extract-voice] Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to extract text from images' });
  }
}
