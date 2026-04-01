# Spoke v0.0.2 — Claude Reference

**Mission:** Voice-to-medium translator for non-writers. Speak your thoughts on the go. Spoke translates them into platform-ready content in your authentic voice.

**Core value:** You sound like the best version of yourself, not like an AI.

## Core Loop

1. **Record** — In-app audio (30 sec - 10 min) or upload audio file
2. **Transcribe** — Whisper API
3. **Format** — Claude structures it 4 ways (authenticity-first):
   - Tweet options (5 angles, 280 chars each)
   - Thread (3-5 tweets, narrative arc)
   - Long-form (500-1000 words, Substack-ready)
   - Instagram caption (punchy, visual, hashtag-ready)
4. **Copy** — One-tap copy each format
5. **Paste** — User manually posts to X, Threads, Substack, Instagram

## Formatting Philosophy

**Authenticity-first:** Default output preserves the speaker's exact voice, word choices, and rhythm. Claude removes noise (filler words, repetition, tangents) but does not rewrite or impose structure.

**Framework overlay (optional):** If the user wants more reach or structure, they apply a framework as a second pass. Frameworks restructure the authentic output — they don't replace it.

**The dial:** Authentic ←————→ Engineered for reach

## Stack

**Frontend:** React + Tailwind CSS
**Backend:** Supabase (auth mock, database)
**APIs:** Whisper + Claude
**Hosting:** Vercel (auto-deploy on git push)

## Frontend Architecture

### Pages

**1. Home/Record Screen**
- Large red "Start Recording" button
- Timer (shows elapsed time during recording)
- Stop button
- Playback (listen before submit)
- Upload mode toggle (for pre-recorded files)
- Submit button → POST /recordings

**2. Loading Screen**
- "Transcribing..." animation
- Status text

**3. Output Screen (Core)**
- 4 tabs: Tweet | Thread | Long-form | Caption
- Tweet tab: 5 options, each a different angle, each with its own copy button
- Thread tab: 3-5 tweets with copy full thread button
- Long-form tab: structured prose with copy button
- Caption tab: Instagram-ready with copy button
- "Start new recording" button

### Design

- **Colors:** Deep blue bg (#1a1a2e), orange CTA (#ff6b35), cream text (#f5f5f0)
- **Typography:** Clean sans-serif, generous spacing
- **Components:** Large buttons (thumb-friendly), card layout, copy feedback toast

## Backend

### Database Schema

```
RECORDINGS table:
- id (uuid, primary key)
- raw_audio (file path or URL)
- transcript (text from Whisper)
- formats: {
    tweet: array of strings (5 options),
    thread: array of strings,
    longform: string,
    caption: string
  }
- created_at
```

### API Endpoints

**POST /recordings**
- Input: audio_base64 + audio_type (JSON)
- Process:
  1. Decode base64 audio
  2. Call Whisper API → transcript
  3. Call Claude (authenticity-first) → 4 formats
  4. Store in Supabase
  5. Return formats
- Output: `{ transcript, formats: { tweet, thread, longform, caption }, recording_id }`

**GET /recordings/:id**
- Retrieve cached formats + transcript

## Formatting Prompt Philosophy

Default prompt is authenticity-first:
- Preserve speaker's voice, rhythm, sentence patterns
- Remove filler words only (um, uh, like, you know)
- Do not rewrite, reframe, or impose structure
- Keep first-person perspective
- Preserve spoken cadence in tweets (short sentences, fragments, line breaks)

## Tech Notes

- **Whisper:** Requires API key in .env
- **Claude:** Requires API key in .env
- **Supabase:** Free tier covers MVP
- **Vercel:** Auto-deploys on git push (connect GitHub)
- **Local dev:** Two terminals — `npm run dev:api` (port 3001) + `npm run dev` (port 5173)

## Success Criteria

- Record → transcribe → format in < 2 minutes
- 80%+ of outputs are copy-paste ready without editing
- Outputs sound like the speaker, not like AI
- User can get from audio to copied post without sitting at a desk

## Scope (v0.0.2)

**Must have:**
- Record + upload (done)
- Whisper integration (done)
- Authenticity-first formatting prompt
- 5 tweet options (done)
- Instagram caption as 4th format
- Polish: smoother UX, cleaner loading states

**Skip:**
- Framework selection UI (v0.1)
- Custom framework input (v0.1)
- Voice fingerprinting (v0.2)
- Goal tracking
- Drafts/history
- Mobile (yet)
- Auth
- Scheduling

## Project Structure

```
spoke/
├── CLAUDE.md          ← You are here (always loaded)
├── CONTEXT.md         ← Task router — go here to find what file to edit
├── README.md          ← Public-facing readme
└── spoke-app/         ← The actual application code
    ├── api/           ← Vercel serverless functions (Whisper + Claude + Supabase)
    ├── src/           ← React frontend (pages, components, lib)
    ├── index.html
    ├── package.json
    ├── .env.example   ← Copy to .env and fill in keys before running
    └── vercel.json
```

See **CONTEXT.md** for the full file map and task routing table.

---

## Roadmap

**v0.0.2:** Authenticity-first prompt + Instagram caption + UX polish
**v0.1:** Custom framework input (paste your own framework or JK Molina-style rules)
**v0.2:** Voice fingerprinting (paste your best writing, Spoke learns your style)
**v0.3:** Framework library (pre-built: Insight, StoryBrand, PAS, etc.) + drafts/history
**v1.0:** React Native mobile + TestFlight + social ingestion (X/Substack/Threads API to auto-build voice profile)
**v1.5:** Buffer integration + scheduling
