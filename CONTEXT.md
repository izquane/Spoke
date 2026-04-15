# Spoke — Task Router

## What This Is

A voice-to-content web app. Users record or upload audio, Spoke transcribes it with Whisper and formats it with Claude into tweets, threads, long-form, and Instagram captions.

**CLAUDE.md** (always loaded) has the full folder map and constraints.
This file routes you to the right workspace for your task.

---

## Task Routing

| Your Task | Go Here | You'll Also Need |
|---|---|---|
| **Define a new feature** | `spoke-app/product/` | Nothing — start fresh |
| **Write a feature spec** | `spoke-app/product/specs/` | Nothing |
| **Plan a technical build** | `spoke-app/engineering/` | Spec from `product/specs/` |
| **Edit the Claude formatting prompt** | `spoke-app/api/recordings.js` | `FORMATTING_PROMPT` constant |
| **Edit the framework overlay** | `spoke-app/api/framework.js` | `FRAMEWORK_PROMPT` constant |
| **Edit transcription logic** | `spoke-app/api/transcribe.js` | — |
| **Edit chunking logic** | `spoke-app/src/lib/audioChunker.js` | — |
| **Add/edit a screen** | `spoke-app/src/pages/` | — |
| **Add/edit a component** | `spoke-app/src/components/` | — |
| **Debug an API error** | `spoke-app/api/` + `vercel logs` | Check env vars with `vercel env ls` |
| **Deploy** | `cd spoke-app && vercel --prod` | Env vars: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` |

---

## Workspace Summary

| Workspace | Purpose |
|---|---|
| `spoke-app/product/` | What to build + why. Specs, research. |
| `spoke-app/engineering/` | How to build it. 4-stage pipeline: brief → spec → build → output. |
| `spoke-app/api/` | Serverless functions. Whisper + Claude. |
| `spoke-app/src/` | React frontend. Pages, components, lib. |
| `docs/superpowers/` | Design docs and implementation plans from planning sessions. |

---

## Required Env Vars (Production)

| Variable | Used by |
|---|---|
| `OPENAI_API_KEY` | Whisper transcription |
| `ANTHROPIC_API_KEY` | Claude formatting |
