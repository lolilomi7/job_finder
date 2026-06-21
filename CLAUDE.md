# Apply Co-Pilot — CLAUDE.md

## Project Overview

Apply Co-Pilot is a Manifest V3 Chrome extension that acts as a job-application co-pilot. It discovers internship and job postings from public ATS feeds (Greenhouse, Lever, Workday, etc.), matches them against the user's stored CV using the Gemini API, tailors application materials by re-weighting and re-ordering the user's real experience to fit each posting, autofills application forms so the user can review and submit themselves, and tracks all application history entirely on-device with no backend or external account required.

## Stack (locked)

- **Runtime**: Chrome Extension Manifest V3
- **Build**: Vite 5 + @crxjs/vite-plugin (beta 2.x)
- **UI**: React 18 + Tailwind CSS 3
- **Language**: TypeScript (strict mode throughout)
- **AI**: Google Gemini API — BYOK, user supplies key in Settings
- **Storage**: `chrome.storage.local` only — no external database

## NON-NEGOTIABLES

These are hard constraints. They may never be relaxed or worked around:

1. **Local-first & free**: No backend server. All user data (CV text, applications, API key) lives in `chrome.storage.local` on the user's device. Never call a paid third-party service that stores PII, never require an account.

2. **Human-in-the-loop**: The extension **never** auto-submits an application. It fills form fields and stops, presenting a review screen. The user reads, edits if needed, and clicks Submit themselves. Auto-submission code must never be written.

3. **No fabrication**: Tailoring means re-weighting or re-ordering content that already exists in the user's CV. The AI prompt must never invent skills, job titles, companies, dates, or achievements. If the CV doesn't contain it, it doesn't appear in the output.

4. **BYOK**: The user provides their own Gemini API key via the Settings (options) page. The key is stored in `chrome.storage.local`. Never hard-code an API key in any source file, config, or comment.

## Build Workflow

- Work is done **one phase at a time**. At the start of every session, read `PROGRESS.md` to understand current state.
- At the end of every session, update `PROGRESS.md`: move completed work into "Done", update "Current" and "Next".
- Only mark a phase "Done" after verifying it works end-to-end in a real Chrome session (load unpacked → exercise the feature manually).
- After every significant change: run `npm run build` and confirm zero TypeScript errors and zero build errors before declaring done.

## Code Conventions

- **Indentation**: 2 spaces everywhere (TS, TSX, JSON, CSS).
- **TypeScript**: strict mode on; avoid `any`; if unavoidable, add a comment explaining why.
- **React**: functional components + hooks only; no class components.
- **Component size**: keep components focused; extract reusable logic into `src/lib/` helpers.
- **Styling**: Tailwind utility classes only; avoid inline `style` props.
- **Chrome APIs**: always handle promise rejections; wrap in try/catch or `.catch()`.
- **Types**: add new shared types to `src/types/types.ts`; keep domain types co-located with their feature until they're shared.

## Directory Layout

```
src/
  popup/        React entry — toolbar popup (380 × 560 px)
  options/      React entry — full-page Settings
  lib/          Shared helpers, Chrome API wrappers, AI calls
  types/        Shared TypeScript types
```

## Phase Reference

See `PROGRESS.md` for the current phase list and status.
