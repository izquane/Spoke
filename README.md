# Spoke

Audio-first content for creators who speak better than they write.

**Record insight → transcribe → format for social → copy & paste.**

## The Problem

You have insights. You're better at talking than writing. You don't want to learn writing frameworks or reformat the same idea for Twitter, Threads, and Substack.

## The Solution

Spoke takes your raw audio, turns it into platform-ready posts in seconds.

## v0.0.1 MVP

**What it does:**
- Record audio (in-app)
- Transcribe (Whisper API)
- Format 3 ways (tweet, thread, long-form) using insight framework
- Copy buttons for each format

**What it doesn't do (yet):**
- File upload
- Framework selection
- Goal tracking
- Drafts/history
- Social posting
- Auth

## Stack

- **Frontend:** React + Tailwind CSS
- **Backend:** Supabase
- **APIs:** Whisper (transcription) + Claude (formatting)
- **Hosting:** Vercel

## Quick Start

```bash
git clone https://github.com/YOUR_USERNAME/spoke.git
cd spoke
npm install
npm start
```

Visit `localhost:3000` → record → copy.

## Deploy

Push to main → Vercel auto-deploys.

```bash
git add .
git commit -m "feature: xyz"
git push origin main
```

## Next (v0.1+)

- File upload
- Framework selection (insight, value, story, question, contrarian)
- Goal tracking (email signups, sales, engagement)
- Drafts/history
- React Native (mobile)
- TestFlight + App Store
