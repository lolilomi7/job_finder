import { useEffect, useState, KeyboardEvent } from 'react'
import { getStorage, setStorage } from '../lib/storage'
import { testKey } from '../lib/gemini'
import type { Seniority, UserSettings } from '../types/types'

// ── Tag input ─────────────────────────────────────────────────────────────────

function TagInput({
  tags,
  onChange,
  placeholder,
}: {
  tags: string[]
  onChange: (next: string[]) => void
  placeholder: string
}) {
  const [input, setInput] = useState('')

  function commit() {
    const val = input.trim()
    if (val && !tags.includes(val)) onChange([...tags, val])
    setInput('')
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commit()
    }
    if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      onChange(tags.slice(0, -1))
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5 items-center p-2 border border-gray-200 rounded-lg min-h-10 focus-within:ring-2 focus-within:ring-blue-500">
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(tags.filter((t) => t !== tag))}
            className="hover:text-blue-900 leading-none"
            aria-label={`Remove ${tag}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        className="flex-1 min-w-24 text-sm outline-none placeholder:text-gray-300 bg-transparent"
        placeholder={tags.length === 0 ? placeholder : ''}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={commit}
      />
    </div>
  )
}

// ── Seniority selector ────────────────────────────────────────────────────────

const SENIORITY_OPTIONS: { value: Seniority; label: string }[] = [
  { value: 'intern', label: 'Intern' },
  { value: 'junior', label: 'Junior' },
  { value: 'senior', label: 'Senior' },
]

function SeniorityPicker({
  value,
  onChange,
}: {
  value: Seniority
  onChange: (v: Seniority) => void
}) {
  return (
    <div className="flex rounded-lg border border-gray-200 overflow-hidden w-fit">
      {SENIORITY_OPTIONS.map(({ value: v, label }, i) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={[
            'px-4 py-1.5 text-sm font-medium transition-colors',
            i > 0 ? 'border-l border-gray-200' : '',
            value === v
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50',
          ].join(' ')}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: UserSettings = {
  geminiApiKey: '',
  targetTitles: [],
  locations: [],
  seniority: 'intern',
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'
type TestStatus = 'idle' | 'testing' | 'ok' | 'error'

export default function App() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [cvText, setCvText] = useState('')
  const [showKey, setShowKey] = useState(false)

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [testStatus, setTestStatus] = useState<TestStatus>('idle')
  const [testError, setTestError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const data = await getStorage(['userSettings', 'cvText'])
        setSettings({ ...DEFAULT_SETTINGS, ...data.userSettings })
        setCvText(data.cvText ?? '')
      } catch {
        // storage unavailable
      }
    }
    void load()
  }, [])

  function patch(partial: Partial<UserSettings>) {
    setSettings((s) => ({ ...s, ...partial }))
  }

  async function handleSave() {
    setSaveStatus('saving')
    try {
      await setStorage({ userSettings: settings, cvText })
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2500)
    } catch {
      setSaveStatus('error')
    }
  }

  async function handleTestKey() {
    setTestStatus('testing')
    setTestError('')
    try {
      await testKey(settings.geminiApiKey)
      setTestStatus('ok')
    } catch (err) {
      setTestError(err instanceof Error ? err.message : 'Unknown error')
      setTestStatus('error')
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
          {/* ── API Key ──────────────────────────────────────────────────── */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-1">Gemini API Key</h2>
            <p className="text-xs text-gray-500 mb-3">
              Stored on this device only. Only sent to Google's Gemini API.{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-blue-500 hover:underline"
              >
                Get a free key ↗
              </a>
            </p>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showKey ? 'text' : 'password'}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 pr-14 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-300"
                  placeholder="AIza…"
                  value={settings.geminiApiKey}
                  onChange={(e) => {
                    patch({ geminiApiKey: e.target.value })
                    setTestStatus('idle')
                  }}
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

              <button
                type="button"
                onClick={handleTestKey}
                disabled={!settings.geminiApiKey.trim() || testStatus === 'testing'}
                className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors whitespace-nowrap"
              >
                {testStatus === 'testing' ? 'Testing…' : 'Test key'}
              </button>
            </div>

            {testStatus === 'ok' && (
              <p className="text-xs text-green-600 mt-2">✓ Key is working</p>
            )}
            {testStatus === 'error' && (
              <p className="text-xs text-red-500 mt-2">✗ {testError}</p>
            )}
          </section>

          {/* ── Search Preferences ───────────────────────────────────────── */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Search Preferences</h2>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Target job titles
                </label>
                <TagInput
                  tags={settings.targetTitles}
                  onChange={(t) => patch({ targetTitles: t })}
                  placeholder="e.g. Software Engineer Intern — press Enter to add"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Locations
                </label>
                <TagInput
                  tags={settings.locations}
                  onChange={(l) => patch({ locations: l })}
                  placeholder="e.g. Remote, New York — press Enter to add"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Seniority
                </label>
                <SeniorityPicker
                  value={settings.seniority}
                  onChange={(s) => patch({ seniority: s })}
                />
              </div>
            </div>
          </section>

          {/* ── CV ───────────────────────────────────────────────────────── */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-1">Your CV</h2>
            <p className="text-xs text-gray-500 mb-3">
              Plain text only. Never leaves this device.
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

          {/* ── Save ─────────────────────────────────────────────────────── */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saveStatus === 'saving' ? 'Saving…' : 'Save'}
            </button>
            {saveStatus === 'saved' && (
              <span className="text-sm text-green-600">Saved!</span>
            )}
            {saveStatus === 'error' && (
              <span className="text-sm text-red-500">Failed to save. Try again.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
