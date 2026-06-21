import {
  useEffect,
  useState,
  useRef,
  KeyboardEvent,
  DragEvent,
  ChangeEvent,
} from 'react'
import { getStorage, setStorage } from '../lib/storage'
import { testKey } from '../lib/gemini'
import { parseFile } from '../lib/cv'
import {
  upsertJob,
  getJob,
  getAllJobs,
  getJobsByStatus,
  setStatus,
  deleteJob,
  isGhosted,
} from '../lib/store'
import type { Seniority, UserSettings, CvData } from '../types/types'

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
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit() }
    if (e.key === 'Backspace' && input === '' && tags.length > 0) onChange(tags.slice(0, -1))
  }

  return (
    <div className="flex flex-wrap gap-1.5 items-center p-2 border border-gray-200 rounded-lg min-h-10 focus-within:ring-2 focus-within:ring-blue-500">
      {tags.map((tag) => (
        <span key={tag} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
          {tag}
          <button type="button" onClick={() => onChange(tags.filter((t) => t !== tag))}
            className="hover:text-blue-900 leading-none" aria-label={`Remove ${tag}`}>×</button>
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

// ── Seniority picker ──────────────────────────────────────────────────────────

const SENIORITY_OPTIONS: { value: Seniority; label: string }[] = [
  { value: 'intern', label: 'Intern' },
  { value: 'junior', label: 'Junior' },
  { value: 'senior', label: 'Senior' },
]

function SeniorityPicker({ value, onChange }: { value: Seniority; onChange: (v: Seniority) => void }) {
  return (
    <div className="flex rounded-lg border border-gray-200 overflow-hidden w-fit">
      {SENIORITY_OPTIONS.map(({ value: v, label }, i) => (
        <button key={v} type="button" onClick={() => onChange(v)}
          className={['px-4 py-1.5 text-sm font-medium transition-colors',
            i > 0 ? 'border-l border-gray-200' : '',
            value === v ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50',
          ].join(' ')}>
          {label}
        </button>
      ))}
    </div>
  )
}

// ── CV upload section ─────────────────────────────────────────────────────────

type ParseStatus = 'idle' | 'parsing' | 'done' | 'error'

function CvSection({
  cvData,
  onCvChange,
}: {
  cvData: CvData | null
  onCvChange: (data: CvData) => void
}) {
  const [parseStatus, setParseStatus] = useState<ParseStatus>('idle')
  const [parseError, setParseError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [editedText, setEditedText] = useState(cvData?.rawText ?? '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setEditedText(cvData?.rawText ?? '')
  }, [cvData?.rawText])

  async function handleFile(file: File) {
    setParseStatus('parsing')
    setParseError('')
    try {
      const parsed = await parseFile(file)
      setParseStatus('done')
      setEditedText(parsed.rawText)
      onCvChange(parsed)
    } catch (err) {
      setParseStatus('error')
      setParseError(err instanceof Error ? err.message : 'Failed to parse file.')
    }
  }

  function onFileInput(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) void handleFile(file)
    e.target.value = ''
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) void handleFile(file)
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) { e.preventDefault(); setIsDragging(true) }
  function onDragLeave() { setIsDragging(false) }

  function handleTextEdit(text: string) {
    setEditedText(text)
    if (cvData) {
      onCvChange({ ...cvData, rawText: text })
    } else {
      onCvChange({ rawText: text, filename: 'manual', parsedAt: Date.now() })
    }
  }

  const wordCount = editedText.trim() ? editedText.trim().split(/\s+/).length : 0
  const hasText = editedText.trim().length > 0

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-base font-semibold text-gray-800 mb-1">Your CV</h2>
      <p className="text-xs text-gray-500 mb-4">
        Upload a PDF or .docx — parsed entirely in your browser, never sent anywhere.
        You can edit the extracted text before saving.
      </p>

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={[
          'border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors mb-4',
          isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
        ].join(' ')}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={onFileInput}
        />
        {parseStatus === 'parsing' ? (
          <p className="text-sm text-blue-600 animate-pulse">Parsing…</p>
        ) : (
          <>
            <p className="text-sm text-gray-500 font-medium">
              {cvData ? `Replace: ${cvData.filename}` : 'Drop your CV here or click to browse'}
            </p>
            <p className="text-xs text-gray-400 mt-1">PDF or .docx</p>
          </>
        )}
      </div>

      {parseStatus === 'error' && (
        <p className="text-xs text-red-500 mb-3">&#x2717; {parseError}</p>
      )}

      {parseStatus === 'done' && (
        <p className="text-xs text-green-600 mb-3">&#x2713; Parsed successfully — review and edit below.</p>
      )}

      {/* Editable text area */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">
          {hasText ? 'Extracted text (editable)' : 'Or paste CV text directly'}
        </label>
        <textarea
          className="w-full h-52 text-sm border border-gray-200 rounded-lg p-3 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-300"
          placeholder="Paste your CV here, or upload a file above…"
          value={editedText}
          onChange={(e) => handleTextEdit(e.target.value)}
        />
        {wordCount > 0 && (
          <p className="text-xs text-gray-400">{wordCount} words</p>
        )}
      </div>
    </section>
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

// ── Store dev panel ───────────────────────────────────────────────────────────

type StoreTestStatus = 'idle' | 'running' | 'pass' | 'fail'

const TEST_ID = '__dev_test_job__'

function StoreDevPanel() {
  const [status, setStatus_] = useState<StoreTestStatus>('idle')
  const [lines, setLines] = useState<string[]>([])

  async function runTests() {
    setStatus_('running')
    const log: string[] = []
    let passed = 0

    function check(label: string, ok: boolean) {
      log.push(`${ok ? '✓' : '✗'} ${label}`)
      if (ok) passed++
    }

    try {
      // Clean up any leftover from a previous run
      await deleteJob(TEST_ID)

      // 1. Insert a new job
      const r1 = await upsertJob({
        id: TEST_ID,
        source: 'greenhouse',
        company: 'Acme Corp',
        title: 'Intern',
        url: 'https://example.com/job/1',
      })
      check('upsertJob creates record with status="seen"', r1.status === 'seen')
      check('statusHistory has 1 entry after insert', r1.statusHistory.length === 1)

      // 2. Advance status to 'saved'
      await setStatus(TEST_ID, 'saved')
      const r2 = await getJob(TEST_ID)
      check('setStatus("saved") updates status', r2?.status === 'saved')
      check('setStatus appends to statusHistory', r2?.statusHistory.length === 2)

      // 3. Upsert the SAME id again — status must stay 'saved'
      await upsertJob({
        id: TEST_ID,
        source: 'greenhouse',
        company: 'Acme Corp',
        title: 'Intern (updated title)',
        url: 'https://example.com/job/1',
      })
      const r3 = await getJob(TEST_ID)
      check('upsertJob deduplicates: status still "saved"', r3?.status === 'saved')
      check('upsertJob deduplicates: history unchanged', r3?.statusHistory.length === 2)
      check('upsertJob refreshes title', r3?.title === 'Intern (updated title)')

      // 4. Query helpers
      const all = await getAllJobs()
      check('getAllJobs returns ≥ 1 record', all.length >= 1)
      const bySaved = await getJobsByStatus('saved')
      check('getJobsByStatus("saved") includes test record', bySaved.some((j) => j.id === TEST_ID))

      // 5. isGhosted should be false (applied 0 ms ago)
      await setStatus(TEST_ID, 'applied')
      const r4 = await getJob(TEST_ID)
      check('isGhosted is false immediately after applying', r4 ? !isGhosted(r4) : false)

      setLines([...log, '', `${passed}/${log.filter((l) => l.startsWith('✓') || l.startsWith('✗')).length} checks passed`])
      setStatus_(passed === log.filter((l) => l.startsWith('✓') || l.startsWith('✗')).length ? 'pass' : 'fail')
    } catch (err) {
      setLines([...log, `ERROR: ${err instanceof Error ? err.message : String(err)}`])
      setStatus_('fail')
    } finally {
      // Clean up the test record
      await deleteJob(TEST_ID).catch(() => undefined)
    }
  }

  return (
    <section className="bg-amber-50 rounded-xl border border-amber-200 p-6">
      <h2 className="text-base font-semibold text-amber-800 mb-1">Developer — Store checks</h2>
      <p className="text-xs text-amber-700 mb-3">
        Verifies IndexedDB dedup and status-history behaviour. Remove this section after Phase 3.
      </p>
      <button
        onClick={runTests}
        disabled={status === 'running'}
        className="px-4 py-1.5 text-sm font-medium bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 disabled:opacity-50 transition-colors"
      >
        {status === 'running' ? 'Running…' : 'Run store tests'}
      </button>
      {lines.length > 0 && (
        <pre className={[
          'mt-3 text-xs font-mono whitespace-pre-wrap p-3 rounded-lg',
          status === 'pass' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800',
        ].join(' ')}>
          {lines.join('\n')}
        </pre>
      )}
    </section>
  )
}

export default function App() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [cvData, setCvData] = useState<CvData | null>(null)
  const [showKey, setShowKey] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [testStatus, setTestStatus] = useState<TestStatus>('idle')
  const [testError, setTestError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const data = await getStorage(['userSettings', 'cvData'])
        setSettings({ ...DEFAULT_SETTINGS, ...data.userSettings })
        if (data.cvData) setCvData(data.cvData)
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
      const toSave: Partial<import('../types/types').StorageData> = { userSettings: settings }
      if (cvData) toSave.cvData = cvData
      await setStorage(toSave)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-blue-700 tracking-tight">Apply Co-Pilot</h1>
          <p className="text-sm text-gray-500 mt-1">Settings</p>
        </header>

        <div className="flex flex-col gap-6">
          {/* ── API Key ── */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-1">Gemini API Key</h2>
            <p className="text-xs text-gray-500 mb-3">
              Stored on this device only. Only sent to Google's Gemini API.{' '}
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer"
                className="text-blue-500 hover:underline">Get a free key ↗</a>
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showKey ? 'text' : 'password'}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 pr-14 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-300"
                  placeholder="AIza…"
                  value={settings.geminiApiKey}
                  onChange={(e) => { patch({ geminiApiKey: e.target.value }); setTestStatus('idle') }}
                  autoComplete="off"
                />
                <button type="button" onClick={() => setShowKey((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600">
                  {showKey ? 'Hide' : 'Show'}
                </button>
              </div>
              <button type="button" onClick={handleTestKey}
                disabled={!settings.geminiApiKey.trim() || testStatus === 'testing'}
                className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors whitespace-nowrap">
                {testStatus === 'testing' ? 'Testing…' : 'Test key'}
              </button>
            </div>
            {testStatus === 'ok' && <p className="text-xs text-green-600 mt-2">&#x2713; Key is working</p>}
            {testStatus === 'error' && <p className="text-xs text-red-500 mt-2">&#x2717; {testError}</p>}
          </section>

          {/* ── Search Preferences ── */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Search Preferences</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Target job titles</label>
                <TagInput tags={settings.targetTitles} onChange={(t) => patch({ targetTitles: t })}
                  placeholder="e.g. Software Engineer Intern — press Enter to add" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Locations</label>
                <TagInput tags={settings.locations} onChange={(l) => patch({ locations: l })}
                  placeholder="e.g. Remote, New York — press Enter to add" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Seniority</label>
                <SeniorityPicker value={settings.seniority} onChange={(s) => patch({ seniority: s })} />
              </div>
            </div>
          </section>

          {/* ── CV Upload ── */}
          <CvSection cvData={cvData} onCvChange={setCvData} />

          {/* ── Store dev panel ── */}
          <StoreDevPanel />

          {/* ── Save ── */}
          <div className="flex items-center gap-3">
            <button onClick={handleSave} disabled={saveStatus === 'saving'}
              className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saveStatus === 'saving' ? 'Saving…' : 'Save'}
            </button>
            {saveStatus === 'saved' && <span className="text-sm text-green-600">Saved!</span>}
            {saveStatus === 'error' && <span className="text-sm text-red-500">Failed to save. Try again.</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
