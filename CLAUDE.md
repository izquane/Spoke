# Spoke — Workspace Map

## What This Is

A voice-to-content translator. Record or upload audio, get back tweet options, a thread, long-form prose, and an Instagram caption — all in your authentic voice.

**CONTEXT.md** (top-level) routes to the right workspace for each task.

---

## Folder Structure

```
spoke/
├── CLAUDE.md                         ← You are here (always loaded)
├── CONTEXT.md                        ← Task router
├── docs/superpowers/
│   ├── plans/                        ← Implementation plans
│   └── specs/                        ← Design docs
├── engineering/
│   ├── CONTEXT.md
│   ├── docs/tech-stack.md            ← Tech standards, constraints
│   └── workflows/
│       ├── 01-briefs/                ← What to build
│       ├── 02-specs/                 ← How to build it
│       ├── 03-builds/                ← Active work
│       └── 04-output/                ← Shipped features / changelogs
├── product/
│   ├── CONTEXT.md
│   ├── specs/                        ← Feature specs
│   └── versions/ROADMAP.md
│
└── spoke-app/                        ← The actual web app
    ├── api/                          ← Vercel serverless functions
    │   ├── transcribe.js             ← POST /api/transcribe (Whisper)
    │   ├── recordings.js             ← POST /api/recordings (Claude formatting)
    │   └── framework.js              ← POST /api/framework (framework overlay)
    ├── src/
    │   ├── pages/                    ← Screen-level components (RecordScreen, OutputScreen, LoadingScreen)
    │   ├── components/               ← Reusable UI (CopyButton)
    │   └── lib/                      ← api.js, audioChunker.js
    ├── index.html
    ├── package.json
    ├── vercel.json
    └── .env.example
```

---

## Quick Navigation

| Want to... | Go here |
|---|---|
| **Build a feature** | `engineering/CONTEXT.md` |
| **Define what to build** | `product/CONTEXT.md` |
| **Write a feature spec** | `product/specs/` |
| **Edit the transcription logic** | `api/transcribe.js` |
| **Edit the Claude formatting prompt** | `api/recordings.js` — `FORMATTING_PROMPT` constant |
| **Edit the framework overlay prompt** | `api/framework.js` — `FRAMEWORK_PROMPT` constant |
| **Add a screen** | `src/pages/` |
| **Add a reusable component** | `src/components/` |
| **Edit the audio chunking logic** | `src/lib/audioChunker.js` |
| **Edit API fetch wrappers** | `src/lib/api.js` |

---

## Core Constraints (Always Active)

- **No Supabase until drafts/history (v0.3).** The app is stateless — record → transcribe → format → copy. Nothing is stored.
- **`src/lib/` = no React imports.** Pure JS only.
- **`src/components/` = no business logic.** UI only.
- **Vercel Functions only.** All API logic in `api/`. No Express routes in production.
- **Chunking threshold = 2.5MB.** Base64 adds 33% overhead; anything larger hits Vercel's 4.5MB body limit.

---

## Tech Stack

| Layer | Current | Future |
|---|---|---|
| Frontend | React + Tailwind + Vite | Same |
| API | Vercel Serverless Functions | Same |
| Transcription | OpenAI Whisper (`whisper-1`) | Same |
| Formatting | Anthropic Claude (`claude-opus-4-6`) | Same |
| Storage | None | Supabase (v0.3) |
| Auth | None | v1.0 |
| Mobile | None | React Native (v1.0) |

---

## Roadmap

| Version | Scope |
|---|---|
| **v0.0.2** | Record + upload, Whisper, authenticity-first Claude prompt, 4 formats, framework overlay ✅ |
| **v0.1** | UX polish, better loading states, error handling |
| **v0.2** | Voice fingerprinting (paste your writing, Spoke learns your style) |
| **v0.3** | Drafts/history + Supabase |
| **v1.0** | React Native + TestFlight + social ingestion |
| **v1.5** | Scheduling + Buffer integration |
