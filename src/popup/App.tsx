import { useEffect, useState } from 'react'
import { getStorage } from '../lib/storage'

export default function App() {
  const [wordCount, setWordCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await getStorage(['cvText'])
        const text = data.cvText?.trim()
        if (text) setWordCount(text.split(/\s+/).length)
      } catch {
        // storage unavailable
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const hasCv = wordCount !== null && wordCount > 0

  return (
    <div className="w-80 min-h-96 bg-white p-5 flex flex-col gap-4">
      <header className="border-b border-gray-100 pb-3">
        <h1 className="text-lg font-bold text-blue-700 tracking-tight">Apply Co-Pilot</h1>
        <p className="text-xs text-gray-400 mt-0.5">Your job-application assistant</p>
      </header>

      <div className="flex-1 flex flex-col gap-2 py-4">
        <div className="flex items-center gap-2">
          {loading ? (
            <span className="text-xs text-gray-300">Loading…</span>
          ) : hasCv ? (
            <>
              <span className="text-green-500 text-sm">&#10003;</span>
              <span className="text-sm text-gray-700">
                CV loaded &mdash; {wordCount} words
              </span>
            </>
          ) : (
            <>
              <span className="text-gray-300 text-sm">&#9675;</span>
              <span className="text-sm text-gray-400">No CV loaded</span>
            </>
          )}
        </div>

        {!loading && !hasCv && (
          <p className="text-xs text-gray-400 mt-1">
            Paste your CV in Settings to get started.
          </p>
        )}
      </div>

      <footer className="border-t border-gray-100 pt-3">
        <button
          className="w-full text-xs text-gray-400 hover:text-blue-600 transition-colors"
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          Open Settings
        </button>
      </footer>
    </div>
  )
}
