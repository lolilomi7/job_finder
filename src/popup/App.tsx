import { useEffect, useState } from 'react'
import { getStorage } from '../lib/storage'
import type { JobData } from '../types/types'

const ATS_LABEL: Record<JobData['ats'], string> = {
  greenhouse: 'Greenhouse',
  lever: 'Lever',
  workday: 'Workday',
}

const ATS_COLOR: Record<JobData['ats'], string> = {
  greenhouse: 'bg-green-100 text-green-700',
  lever: 'bg-purple-100 text-purple-700',
  workday: 'bg-sky-100 text-sky-700',
}

export default function App() {
  const [wordCount, setWordCount] = useState<number | null>(null)
  const [job, setJob] = useState<JobData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [data, tabs] = await Promise.all([
          getStorage(['cvText']),
          chrome.tabs.query({ active: true, currentWindow: true }),
        ])

        const cvText = data.cvText?.trim()
        if (cvText) setWordCount(cvText.split(/\s+/).length)

        const tabId = tabs[0]?.id
        if (tabId) {
          const detected = await chrome.tabs.sendMessage(tabId, { type: 'GET_JOB' }).catch(() => null)
          if (detected) setJob(detected as JobData)
        }
      } catch {
        // storage or tabs API unavailable
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const hasCv = wordCount !== null

  return (
    <div className="w-80 bg-white flex flex-col min-h-64">
      <header className="border-b border-gray-100 px-5 py-3">
        <h1 className="text-lg font-bold text-blue-700 tracking-tight">Apply Co-Pilot</h1>
        <p className="text-xs text-gray-400">Your job-application assistant</p>
      </header>

      <main className="flex-1 px-5 py-4 flex flex-col gap-4">
        {loading ? (
          <p className="text-xs text-gray-300 animate-pulse">Detecting…</p>
        ) : job ? (
          <div className="flex flex-col gap-2">
            <span className={`self-start text-xs font-semibold px-2 py-0.5 rounded-full ${ATS_COLOR[job.ats]}`}>
              {ATS_LABEL[job.ats]}
            </span>
            <h2 className="text-sm font-semibold text-gray-800 leading-snug">{job.title}</h2>
            {job.company && (
              <p className="text-xs text-gray-500 capitalize">{job.company}</p>
            )}
            {job.description && (
              <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">
                {job.description.slice(0, 280)}
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <p className="text-sm text-gray-500">No job detected</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Navigate to a job posting on Greenhouse, Lever, or Workday.
            </p>
          </div>
        )}

        <div className={`flex items-center gap-1.5 text-xs pt-3 border-t border-gray-100 mt-auto ${hasCv ? 'text-green-600' : 'text-gray-400'}`}>
          <span>{hasCv ? '✓' : '○'}</span>
          <span>{hasCv ? `CV loaded — ${wordCount} words` : 'No CV loaded'}</span>
        </div>
      </main>

      <footer className="border-t border-gray-100 px-5 py-2.5">
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
