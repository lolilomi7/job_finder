import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx, defineManifest } from '@crxjs/vite-plugin'

const manifest = defineManifest({
  manifest_version: 3,
  name: 'Apply Co-Pilot',
  version: '0.1.0',
  description: 'A job-application co-pilot for internships and jobs.',
  action: {
    default_popup: 'src/popup/index.html',
    default_title: 'Apply Co-Pilot',
  },
  options_page: 'src/options/index.html',
  permissions: ['storage', 'activeTab'],
  content_scripts: [
    {
      matches: [
        'https://boards.greenhouse.io/*/jobs/*',
        'https://job-boards.greenhouse.io/*/jobs/*',
        'https://jobs.lever.co/*/*',
        'https://*.myworkdayjobs.com/*',
      ],
      js: ['src/content/index.ts'],
      run_at: 'document_idle',
    },
  ],
})

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  build: {
    // pdfjs-dist + mammoth only load in the options page, not the popup.
    // 1500 kB limit avoids false-alarm warnings for the settings bundle.
    chunkSizeWarningLimit: 1500,
  },
})
