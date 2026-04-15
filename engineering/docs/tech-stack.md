# Tech Stack — Spoke

## Current Stack (v0.0.2)

| Layer | Choice | Notes |
|---|---|---|
| Frontend | React + Tailwind CSS + Vite | `src/pages/`, `src/components/` |
| API | Vercel Serverless Functions | `api/` — Node.js, ES modules |
| Transcription | OpenAI Whisper (`whisper-1`) | Via `openai` SDK, `toFile()` for uploads |
| Formatting | Anthropic Claude (`claude-opus-4-6`) | Via `@anthropic-ai/sdk` |
| Hosting | Vercel | Auto-deploy on git push |
| Storage | None | Stateless — nothing persisted |

## Future Stack (don't build now)

| Addition | Version | Purpose |
|---|---|---|
| Supabase | v0.3 | Drafts + history |
| Auth | v1.0 | User accounts |
| React Native | v1.0 | Mobile app |
| Buffer | v1.5 | Scheduling |

---

## API Architecture

All business logic lives in `spoke-app/api/`. Three functions:

| File | Route | Purpose |
|---|---|---|
| `transcribe.js` | `POST /api/transcribe` | Whisper — audio chunk → transcript |
| `recordings.js` | `POST /api/recordings` | Claude — transcript → 4 formats |
| `framework.js` | `POST /api/framework` | Claude — transcript + framework → 4 formats |

**Audio flow:**
- Files ≤ 2.5MB → sent directly to `/api/transcribe`
- Files > 2.5MB → chunked into 90s WAV clips by `src/lib/audioChunker.js`, each chunk sent to `/api/transcribe` in sequence, transcripts joined, sent to `/api/recordings`

---

## Key Constraints

- **Chunking threshold: 2.5MB** — base64 adds 33% overhead; above this hits Vercel's 4.5MB body limit
- **Function timeout: 60s** — set in `vercel.json`
- **Use `toFile()` not `new File()`** — `new File()` from Node.js global causes `APIConnectionError` in Vercel functions
- **`"type": "module"`** — all files use ES module syntax (`import`/`export`)
