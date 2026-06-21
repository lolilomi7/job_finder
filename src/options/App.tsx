import { useEffect, useState } from 'react'
import { getStorage, setStorage } from '../lib/storage'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export default function App() {
  const [cvText, setCvText] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [status, setStatus] = useState<SaveStatus>('idle')

  useEffect(() => {
    async function load() {
      try {
        const data = await getStorage(['cvText', 'geminiApiKey'])
        setCvText(data.cvText ?? '')
        setApiKey(data.geminiApiKey ?? '')
      } catch {
        // storage unavailable in this context
      }
    }
    void load()
  }, [])

  async function handleSave() {
    setStatus('saving')
    try {
      await setStorage({ cvText, geminiApiKey: apiKey })
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 2500)
    } catch {
      setStatus('error')
    }
  }

  const wordCount = cvText.trim() ? cvText.trim().split(/\s+/).length : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-blue-700 tracking-tight">Apply Co-Pilot</h1>
          <p className="text-sm text-gray-500 mt-1">Settings</p>
        </header>

        <div className="flex flex-col gap-6">
          {/* CV */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-1">Your CV</h2>
            <p className="text-xs text-gray-500 mb-3">
              Paste your CV as plain text. Stored on this device only — never sent anywhere.
            </p>
            <textarea
              className="w-full h-52 text-sm border border-gray-200 rounded-lg p-3 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-300"
              placeholder="Paste your CV here…"
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
            />
            {wordCount > 0 && (
              <p className="text-xs text-gray-400 mt-1">{wordCount} words</p>
            )}
          </section>

          {/* Gemini API Key */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-1">Gemini API Key</h2>
            <p className="text-xs text-gray-500 mb-3">
              Stored locally. Only sent to Google's Gemini API when you trigger a match or
              tailoring action.{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-blue-500 hover:underline"
              >
                Get a free key
              </a>
            </p>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 pr-16 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-300"
                placeholder="AIza…"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
          </section>

          {/* Save */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={status === 'saving'}
              className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {status === 'saving' ? 'Saving…' : 'Save'}
            </button>
            {status === 'saved' && (
              <span className="text-sm text-green-600">Saved!</span>
            )}
            {status === 'error' && (
              <span className="text-sm text-red-500">Failed to save. Try again.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
