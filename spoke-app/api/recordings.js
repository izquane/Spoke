// api/recordings.js — POST /api/recordings
// Accepts a transcript + voice profile, returns essay and 3 moment variations.
//
// Request body (JSON):
//   transcript: string           — pre-built transcript from /api/transcribe
//   voice_examples: string       — user's writing examples (from localStorage)
//   writing_intent: string       — user's writing intent (from localStorage)
//   perspective: string          — 'first' | 'observational' | 'auto' (default: 'auto')
//
// Response (JSON):
//   { transcript, perspective, formats: { essay, moments } }

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const FORMATTING_PROMPT = `You are a writing collaborator. Your job is to read a voice transcript, find the sharpest insight in it, and write it as a piece that makes the reader see something about themselves they hadn't named before.

---

BEFORE WRITING — work through these three questions silently. Do not include this thinking in your output:

1. What is the single sharpest observation or tension in this transcript? If there are multiple ideas, pick the one with the most truth — not the most interesting topic, the most honest observation.
2. What does the reader currently do or believe that this insight speaks to? Name the specific behavior or assumption.
3. What concrete scene, moment, or behavior could open the piece — something the reader has done or experienced themselves?

---

VOICE CALIBRATION

Study the author's examples below. Before writing, note:
- How long their sentences typically run — and when they shorten suddenly
- What they open with (a scene? a person? a behavior? a claim they then subvert?)
- Their vocabulary: plain or technical, formal or conversational
- When they write "I" vs. when they observe from the outside
- How they close — what is the last thing they leave with the reader?

Absorb their voice. Do not imitate it.

Author's writing examples:
{VOICE_EXAMPLES}

---

AUTHOR'S WRITING INTENT

{WRITING_INTENT}

---

PERSPECTIVE

{PERSPECTIVE_INSTRUCTION}

---

FRAMEWORK

{FRAMEWORK_INSTRUCTION}

---

RAW TRANSCRIPT

{TRANSCRIPT}

---

ESSAY — 500 to 800 words

- Open with something concrete: a specific person, behavior, moment, or scene the reader has experienced. They should recognize themselves in the first two or three sentences. Do not open with an abstract claim, a question, or a statement about what you are going to say.
- Build toward the insight — do not announce it. Let it arrive naturally from the concrete.
- Name what people do and why it makes sense, before showing why it falls short.
- Use the author's sentence rhythm. Short declarative sentences. Fragments are fine. Vary length — a short sentence lands harder after a longer one.
- Close with one or two lines: what becomes possible, or what the cost is of not changing. Do not summarize what you just said.
- No preamble. No "In this piece I will..." No conclusions that restate the opening.
- No AI-sounding phrases: "it's important to note," "at the end of the day," "in today's world," "game-changer," "dive into," "let's explore."
- Only include ideas from the transcript. Do not add your own.

MOMENTS — exactly 3, each 150 to 250 words

Each moment is a complete standalone piece — not a summary or excerpt of the essay. It is the same core insight, compressed, with a different entry point:
- Moment 1: open with the behavior or pattern the reader recognizes in themselves
- Moment 2: open with the cost or consequence of that pattern
- Moment 3: open with the contrast between how most people approach it and how it could be different

Same craft rules: concrete opening, insight built toward not announced, author's sentence rhythm, no throat-clearing. Each ends where it needs to — not with a summary.

---

Output ONLY this JSON — no markdown, no explanation, no preamble:
{
  "essay": "...",
  "moments": ["...", "...", "..."]
}`;

// Detect first-person usage by ratio of first-person words to total words.
function detectPerspective(transcript) {
  const words = transcript.split(/\s+/).length;
  const firstPerson = (transcript.match(/\bI\b|\bI'm\b|\bI've\b|\bI'll\b|\bI'd\b|\bmy\b|\bme\b|\bmine\b/g) || []).length;
  return firstPerson / words > 0.03 ? 'first' : 'observational';
}

const FRAMEWORK_INSTRUCTIONS = {
  insight: 'Write to create a moment of recognition. The reader should finish with a clear sense of "yes, that\'s exactly it." Build toward the observation — let it land without announcing it. The payoff is naming something the reader already felt but hadn\'t said.',
  edu: 'Write to transfer understanding. The reader should finish knowing how something works that they didn\'t before. Ground each concept in a specific example before naming it. Prioritize clarity over sophistication — the test is whether they could explain it to someone else.',
  motivation: 'Write to move someone toward a specific change. Show the cost of staying still and the possibility of moving. The payoff is momentum — not inspiration in the abstract, but the specific thing they could do differently starting today.',
};

function buildPrompt(transcript, voiceExamples, writingIntent, perspective, framework) {
  let prompt = FORMATTING_PROMPT;

  if (voiceExamples && voiceExamples.trim()) {
    prompt = prompt.replace('{VOICE_EXAMPLES}', voiceExamples.trim());
  } else {
    prompt = prompt.replace(
      'Study the author\'s examples below. Before writing, note:\n- How long their sentences typically run — and when they shorten suddenly\n- What they open with (a scene? a person? a behavior? a claim they then subvert?)\n- Their vocabulary: plain or technical, formal or conversational\n- When they write "I" vs. when they observe from the outside\n- How they close — what is the last thing they leave with the reader?\n\nAbsorb their voice. Do not imitate it.\n\nAuthor\'s writing examples:\n{VOICE_EXAMPLES}',
      'No writing examples provided. Write in a clear, direct voice with short declarative sentences.'
    );
  }

  if (writingIntent && writingIntent.trim()) {
    prompt = prompt.replace('{WRITING_INTENT}', writingIntent.trim());
  } else {
    prompt = prompt.replace('{WRITING_INTENT}', 'Make the reader see something about themselves they hadn\'t named before.');
  }

  const perspectiveInstruction = perspective === 'first'
    ? 'Write in first person throughout. The author speaks directly: "I noticed," "I started to realize," "what changed for me was." Do not shift to observational or universal framing. Stay in the author\'s voice as narrator.'
    : 'Write in an observational voice. Not "I did this" but "most people do this," "you\'ll notice," or simply describing patterns without a narrator. The insight should feel like it applies broadly to the reader, not just to the author.';

  prompt = prompt.replace('{PERSPECTIVE_INSTRUCTION}', perspectiveInstruction);

  const frameworkInstruction = FRAMEWORK_INSTRUCTIONS[framework] || FRAMEWORK_INSTRUCTIONS.insight;
  prompt = prompt.replace('{FRAMEWORK_INSTRUCTION}', frameworkInstruction);

  prompt = prompt.replace('{TRANSCRIPT}', transcript);
  return prompt;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { transcript, voice_examples, writing_intent, perspective: requestedPerspective, framework } = req.body;

  if (!transcript) {
    return res.status(400).json({ error: 'transcript is required' });
  }

  try {
    const perspective = requestedPerspective === 'first' || requestedPerspective === 'observational'
      ? requestedPerspective
      : detectPerspective(transcript);

    const prompt = buildPrompt(transcript, voice_examples, writing_intent, perspective, framework);

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
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

    if (!Array.isArray(formats.moments)) {
      formats.moments = [formats.moments].filter(Boolean);
    }

    return res.status(200).json({ transcript, perspective, formats });
  } catch (error) {
    console.error('[/api/recordings] Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to process recording' });
  }
}
