// ── Settings ──────────────────────────────────────────────────────────────────

export type Seniority = 'intern' | 'junior' | 'senior'

export interface UserSettings {
  geminiApiKey: string
  targetTitles: string[]
  locations: string[]
  seniority: Seniority
}

// ── CV ────────────────────────────────────────────────────────────────────────

export interface CvData {
  rawText: string
  filename: string
  parsedAt: number // Unix ms
}

// ── Storage (chrome.storage.local) ────────────────────────────────────────────

export interface StorageData {
  cvData: CvData
  userSettings: UserSettings
}

// ── ATS job detection (content script) ───────────────────────────────────────

export interface JobData {
  title: string
  company: string
  description: string
  url: string
  ats: 'greenhouse' | 'lever' | 'workday'
}

// ── Application records (IndexedDB) ──────────────────────────────────────────

export type AppStatus =
  | 'seen'
  | 'saved'
  | 'applied'
  | 'interviewing'
  | 'offer'
  | 'rejected'

export interface StatusHistoryEntry {
  status: AppStatus
  at: number // Unix ms
}

export interface ApplicationRecord {
  /** Stable key derived from the ATS job id */
  id: string
  source: 'greenhouse' | 'lever' | 'workday' | 'ashby'
  company: string
  title: string
  url: string

  status: AppStatus
  statusHistory: StatusHistoryEntry[]

  /** Filled by Phase 4 matching */
  matchScore: number | null
  matchReason: string | null

  /** Filled by Phase 5 tailoring */
  tailoredResume: string | null
  tailoredCoverLetter: string | null

  notes: string

  createdAt: number // Unix ms
  updatedAt: number // Unix ms
}

/** Input shape for upsertJob — the fields that come from an ATS feed */
export type JobInput = Pick<ApplicationRecord, 'id' | 'source' | 'company' | 'title' | 'url'>
