# Apply Co-Pilot — Progress

## Done

- **Phase 0 — Project scaffold** (2026-06-21)
  - Vite 5 + @crxjs/vite-plugin + React 18 + Tailwind CSS 3 + TypeScript strict
  - Popup and options page render in Chrome; `npm run build` passes clean
  - Manifest V3: `storage` permission, popup + options page registered
  - `CLAUDE.md` and `PROGRESS.md` created

- **Phase 1 — Settings page + Gemini client** (2026-06-22)
  - `UserSettings` type: `geminiApiKey`, `targetTitles[]`, `locations[]`, `seniority`
  - `StorageData`: `{ cvText, userSettings }` — all on-device via `chrome.storage.local`
  - `src/lib/storage.ts`: typed `getStorage` / `setStorage` wrappers
  - `src/lib/gemini.ts`: `testKey(apiKey)` + `sendPrompt(prompt)` using `@google/generative-ai`; key read from `chrome.storage.local`, never logged or hard-coded
  - Options page: API key input (show/hide, Test key button with success/error feedback), search preferences (tag inputs for job titles + locations, seniority toggle), CV textarea, single Save button
  - Popup: reads `cvText` on open, shows word count or "No CV loaded"
  - `@types/chrome` added for Chrome API type coverage

- **Phase 2 — ATS job detection** (2026-06-22)
  - `src/content/index.ts`: content script with per-ATS DOM extractors (Greenhouse, Lever, Workday)
  - Manifest: `activeTab` permission + `content_scripts` for all three ATS URL patterns
  - Popup queries active tab on open, sends `GET_JOB` to content script, renders job card (ATS badge, title, company, description preview) or "No job detected" state
  - `JobData` type added to `src/types/types.ts`

## Current

_Nothing in progress._

## Next

- **Phase 3 — CV ↔ Job matching**
  - On popup with job detected: "Match" button sends CV + job description to Gemini
  - Gemini returns match score (0–100) and lists matched / missing keywords
  - Popup shows score bar and keyword chips below the job card

## Notes / decisions

- Tailwind CSS v3 (not v4) — stable `tailwind.config.js` + PostCSS pipeline.
- Manifest defined via `defineManifest()` in `vite.config.ts`; build outputs `dist/manifest.json`.
- **Load unpacked**: point Chrome to the `dist/` folder after `npm run build`.
- `chrome.storage.local` over `sync` — CV data can exceed the 8 KB sync quota.
- Gemini model pinned to `gemini-1.5-flash` in `src/lib/gemini.ts` (`MODEL` constant).
- `UserSettings` stored as a single object under the `userSettings` key; `cvText` remains top-level.
- TagInput: Enter or comma adds a tag; Backspace on empty removes the last tag.
