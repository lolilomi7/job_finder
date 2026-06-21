# Apply Co-Pilot — Progress

## Done

- **Phase 0 — Project scaffold** (2026-06-21)
  - Vite 5 + @crxjs/vite-plugin (beta) + React 18 + Tailwind CSS 3 + TypeScript strict
  - Popup (`src/popup/`) and options page (`src/options/`) render in Chrome
  - `npm run build` completes with no errors
  - Manifest V3: `storage` permission, popup + options page registered
  - `CLAUDE.md` and `PROGRESS.md` created with full project context

## Current

_Nothing in progress._

## Next

- **Phase 1 — CV storage**
  - Options page: textarea/file-upload for CV text, saved to `chrome.storage.local`
  - Options page: Gemini API key input, saved to `chrome.storage.local`
  - Popup: display loaded CV name / "No CV loaded" status
  - Verify: save CV → reload extension → popup reflects saved state

## Notes / decisions

- Using `@crxjs/vite-plugin@2.0.0-beta.23` (beta 2.x) for Vite 5 + MV3 support.
- Tailwind CSS v3 chosen over v4 for stable `tailwind.config.js` + PostCSS pipeline.
- Manifest defined via `defineManifest()` in `vite.config.ts`; no root `manifest.json` — the build outputs `dist/manifest.json`.
- **Load unpacked**: point Chrome to the `dist/` folder (not project root) after `npm run build`.
- `chrome.storage.local` chosen over `sync` — CV data can exceed the 8 KB sync quota.
