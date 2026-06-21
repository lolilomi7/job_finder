# Apply Co-Pilot — Progress

## Done

- **Phase 0 — Project scaffold** (2026-06-21)
  - Vite 5 + @crxjs/vite-plugin + React 18 + Tailwind CSS 3 + TypeScript strict
  - Popup and options page render in Chrome; `npm run build` passes clean
  - Manifest V3: `storage` permission, popup + options page registered
  - `CLAUDE.md` and `PROGRESS.md` created

- **Phase 1 — Settings page + Gemini client** (2026-06-22)
  - `UserSettings` type: `geminiApiKey`, `targetTitles[]`, `locations[]`, `seniority`
  - `src/lib/storage.ts`: typed `getStorage` / `setStorage` wrappers
  - `src/lib/gemini.ts`: `testKey(apiKey)` + `sendPrompt(prompt)` via `@google/generative-ai`
  - Options page: API key (show/hide + Test key), search preferences (tag inputs + seniority toggle), CV textarea, Save button

- **Phase 2 — CV upload & parsing** (2026-06-22)
  - `CvData` type: `{ rawText, filename, parsedAt }` — replaces flat `cvText` in `StorageData`
  - `src/lib/cv.ts`: `parseFile(file)` — PDF via `pdfjs-dist` (v5, worker bundled via `?url`), .docx via `mammoth`; throws with user-readable message on unsupported type or empty extraction
  - `src/types/mammoth.d.ts`: hand-written type declaration (no `@types/mammoth` on npm)
  - Options page CV section: drag-and-drop / click-to-browse upload zone, parsing status states (idle / parsing / done / error), editable extracted-text textarea + word count, fallback to paste-directly
  - Popup: reads `cvData.rawText` and shows filename + word count or "No CV loaded"
  - `build.chunkSizeWarningLimit: 1500` — pdfjs + mammoth only bundle into the options page, not the popup

- **Phase 3 — ATS job detection** (2026-06-22)
  - `src/content/index.ts`: content script with per-ATS DOM extractors (Greenhouse, Lever, Workday)
  - Manifest: `activeTab` + `content_scripts` for all three ATS URL patterns
  - Popup renders job card (ATS badge, title, company, description preview) or "No job detected"
  - `JobData` type added to `src/types/types.ts`

- **Phase 4 — Application record store** (2026-06-22)
  - `ApplicationRecord` type: id, source, company, title, url, status (AppStatus enum), statusHistory[], matchScore, matchReason, tailoredResume, tailoredCoverLetter, notes, createdAt, updatedAt
  - `src/lib/store.ts`: IndexedDB via `idb` v8; indexes on status, company, updatedAt
  - `upsertJob`: insert-or-refresh — refreshes title/company/url but never touches status or history (dedup guarantee)
  - `setStatus`, `setMatch`, `setTailored`, `setNotes`: atomic read-modify-write via IDB transactions
  - `getAllJobs`, `getJob`, `getJobsByStatus`: read helpers
  - `isGhosted(record)`: pure function, computed on read — true when status=applied for >21 days
  - `deleteJob`: used only by dev test cleanup
  - Options page: amber "Developer — Store checks" panel with 7 automated assertions; cleans up after itself; remove after Phase 5

## Current

_Nothing in progress._

## Next

- **Phase 5 — CV ↔ Job matching**
  - "Match" button in popup (visible when job detected + CV loaded)
  - Sends CV text + job description to Gemini; prompt instructs no fabrication
  - Returns match score (0–100) and matched / missing keyword lists
  - Popup shows score bar and keyword chips
  - Calls `upsertJob` + `setMatch` to persist the result

## Notes / decisions

- Tailwind CSS v3 (not v4); manifest via `defineManifest()` in `vite.config.ts`.
- **Load unpacked**: point Chrome to `dist/` folder after `npm run build`.
- `chrome.storage.local` over `sync` — CV text exceeds 8 KB sync quota.
- Gemini model pinned to `gemini-1.5-flash` (constant in `src/lib/gemini.ts`).
- `cvData` stored as `{ rawText, filename, parsedAt }`; `userSettings` stores preferences.
- pdfjs worker emitted as `pdf.worker.min-[hash].mjs` in `dist/assets/`; loaded via `?url`.
- Image-based/scanned PDFs will fail extraction gracefully — user sees a clear message + paste fallback.
