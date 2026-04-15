# Engineering Workspace — Spoke

## What This Is

How we build things. 4-stage pipeline for any feature: brief → spec → build → output.
Read `engineering/docs/tech-stack.md` for standards before writing code.

---

## Pipeline Stages

```
01-briefs/    ← Feature input (from product/specs/ or direct request)
    ↓
02-specs/     ← Technical plan (component breakdown, API changes, edge cases)
    ↓
03-builds/    ← Active code (pages, components, API functions, lib)
    ↓
04-output/    ← Shipped feature + changelog entry
```

---

## Tasks & What to Load

| Task | Load |
|---|---|
| **Create a build brief** | This file only. Drop brief in `01-briefs/[slug]-brief.md` |
| **Write a tech spec** | Brief from `01-briefs/` + `docs/tech-stack.md` |
| **Build a page/screen** | Tech spec from `02-specs/` + `docs/tech-stack.md` |
| **Build a component** | Tech spec only. `src/components/` = UI only, no business logic |
| **Edit an API function** | Tech spec + `docs/tech-stack.md` |
| **Review/debug** | Relevant source files only |

---

## Code Rules (Always Active)

- `src/lib/` — Pure JS only. No React imports.
- `src/components/` — UI only. No business logic. Receive data via props.
- `src/pages/` — Compose components. Minimal logic. Screen-level only.
- `api/` — Vercel Functions only. One responsibility per file.
- Never call OpenAI or Anthropic directly from the frontend.

---

## File Naming

| Type | Pattern |
|---|---|
| Pages | `[Name]Screen.jsx` |
| Components | `[Name].jsx` (PascalCase) |
| API functions | `[name].js` (camelCase) |
| Lib utilities | `[name].js` (camelCase) |
| Build specs | `[slug]-spec.md` |
| Briefs | `[slug]-brief.md` |
