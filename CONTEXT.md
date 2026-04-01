# Spoke — Task Router

## What This Is

Spoke's top-level task router. Single-workspace project: record → transcribe → format → copy.

**CLAUDE.md** (always loaded) has the full spec, stack, and mission. This file routes you to the code.

---

## Task Routing

| Your Task | Go Here | Notes |
|-----------|---------|-------|
| Change the record screen | `spoke-app/src/pages/RecordScreen.jsx` | Uses MediaRecorder API |
| Change the loading screen | `spoke-app/src/pages/LoadingScreen.jsx` | Animation only |
| Change the output/copy screen | `spoke-app/src/pages/OutputScreen.jsx` | 3 tabs: tweet, thread, longform |
| Edit copy button behavior | `spoke-app/src/components/CopyButton.jsx` | |
| Change the Claude formatting prompt | `spoke-app/api/recordings.js` → `FORMATTING_PROMPT` | Insight framework |
| Change Whisper settings | `spoke-app/api/recordings.js` → `openai.audio.transcriptions` | |
| Change screen routing logic | `spoke-app/src/App.jsx` | 3 states: record / loading / output |
| Add env variables | `spoke-app/.env.example` then `.env` | Never commit `.env` |
| Configure Vercel deployment | `spoke-app/vercel.json` | |
| Set up the database | Supabase dashboard → run SQL in `CONTEXT.md` below | |

---

## File Map

```
spoke-app/
├── api/
│   ├── recordings.js          ← POST /api/recordings (Whisper → Claude → Supabase)
│   └── recordings/
│       └── [id].js            ← GET /api/recordings/:id
└── src/
    ├── App.jsx                ← Screen state machine (record → loading → output)
    ├── main.jsx               ← React entry point
    ├── index.css              ← Tailwind imports
    ├── pages/
    │   ├── RecordScreen.jsx   ← Record button, timer, stop, playback, submit
    │   ├── LoadingScreen.jsx  ← "Transcribing..." animation
    │   └── OutputScreen.jsx   ← Tab group, formatted content, copy buttons
    ├── components/
    │   └── CopyButton.jsx     ← Clipboard copy with toast feedback
    └── lib/
        ├── supabase.js        ← Supabase client (frontend, uses VITE_ keys)
        └── api.js             ← fetch wrapper for /api/recordings
```

---

## Core Data Flow

```
RecordScreen
  → user records audio (MediaRecorder API → Blob)
  → submit triggers App.jsx handleSubmit()
  → audio Blob → base64 → POST /api/recordings

api/recordings.js
  → base64 → Buffer → OpenAI Whisper → transcript
  → transcript → Anthropic Claude → { tweet, thread, longform }
  → insert into Supabase recordings table
  → return { recording_id, transcript, formats }

OutputScreen
  → receives formats from App state
  → renders 3 tabs with CopyButton on each
```

---

## Supabase Setup (run once before first use)

In your Supabase dashboard → SQL Editor, run:

```sql
create table recordings (
  id uuid primary key default gen_random_uuid(),
  transcript text,
  formats jsonb,
  created_at timestamptz default now()
);
```

---

## Running Locally

```bash
cd spoke-app
npm install
cp .env.example .env   # fill in your real keys
npm run dev
```

Open http://localhost:5173

---

## v0.0.1 Scope Guard

**In scope:** Record → Transcribe → Format → Copy
**Not in scope yet:** File upload, framework selection, auth, drafts/history, mobile
