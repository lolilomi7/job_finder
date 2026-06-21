# Apply Co-Pilot — Progress

## Done

- **Phase 0 — Project scaffold** (2026-06-21)
  - Vite 5 + @crxjs/vite-plugin (beta) + React 18 + Tailwind CSS 3 + TypeScript strict
  - Popup (`src/popup/`) and options page (`src/options/`) render in Chrome
  - `npm run build` completes with no errors
  - Manifest V3: `storage` permission, popup + options page registered
  - `CLAUDE.md` and `PROGRESS.md` created with full project context

- **Phase 1 — CV storage** (2026-06-22)
  - `src/types/types.ts`: `StorageData` interface (`cvText`, `geminiApiKey`)
  - `src/lib/storage.ts`: typed `getStorage` / `setStorage` wrappers over `chrome.storage.local`
  - Options page: CV textarea (word count display) + Gemini API key input (show/hide toggle) + Save button with feedback states
  - Popup: reads `cvText` on mount; shows "CV loaded — N words" or "No CV loaded"
  - `@types/chrome` added for full TypeScript coverage of Chrome extension APIs

## Current

_Nothing in progress._

## Next

- **Phase 2 — ATS feed discovery**
  - Detect when the active tab is a supported ATS job listing (Greenhouse, Lever, Workday)
  - Content script extracts job title, company, description, requirements
  - Popup shows extracted job info when on a recognised ATS page

## Notes / decisions

- Using `@crxjs/vite-plugin@2.0.0-beta.23` (beta 2.x) for Vite 5 + MV3 support.
- Tailwind CSS v3 chosen over v4 for stable `tailwind.config.js` + PostCSS pipeline.
- Manifest defined via `defineManifest()` in `vite.config.ts`; no root `manifest.json` — the build outputs `dist/manifest.json`.
- **Load unpacked**: point Chrome to the `dist/` folder (not project root) after `npm run build`.
- `chrome.storage.local` chosen over `sync` — CV data can exceed the 8 KB sync quota.
