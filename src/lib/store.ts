import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { ApplicationRecord, AppStatus, JobInput } from '../types/types'

// ── Schema ────────────────────────────────────────────────────────────────────

interface AppDB extends DBSchema {
  applications: {
    key: string
    value: ApplicationRecord
    indexes: {
      'by-status': string
      'by-company': string
      'by-updated': number
    }
  }
}

const DB_NAME = 'apply-copilot'
const DB_VERSION = 1
const STORE = 'applications' as const

// ── Connection (singleton) ────────────────────────────────────────────────────

let _db: Promise<IDBPDatabase<AppDB>> | null = null

function db(): Promise<IDBPDatabase<AppDB>> {
  if (!_db) {
    _db = openDB<AppDB>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        const store = database.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('by-status', 'status')
        store.createIndex('by-company', 'company')
        store.createIndex('by-updated', 'updatedAt')
      },
    })
  }
  return _db
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** 21-day threshold for "ghosted" detection (computed on read, never stored). */
const GHOST_MS = 21 * 24 * 60 * 60 * 1000

/**
 * Returns true when a job is stuck in "applied" for more than 21 days with no
 * further status update. Computed from statusHistory; nothing is persisted.
 */
export function isGhosted(record: ApplicationRecord): boolean {
  if (record.status !== 'applied') return false
  const lastApplied = [...record.statusHistory].reverse().find((h) => h.status === 'applied')
  if (!lastApplied) return false
  return Date.now() - lastApplied.at > GHOST_MS
}

// ── Write operations ──────────────────────────────────────────────────────────

/**
 * Insert a job if it doesn't exist yet; if it does, refresh mutable metadata
 * (title, company, url) while leaving status, history, match, and notes alone.
 * This is the deduplication guarantee: the same job from tomorrow's feed will
 * never reset a status the user has already set.
 */
export async function upsertJob(job: JobInput): Promise<ApplicationRecord> {
  const conn = await db()
  const tx = conn.transaction(STORE, 'readwrite')
  const existing = await tx.store.get(job.id)

  let record: ApplicationRecord

  if (existing) {
    record = {
      ...existing,
      // Refresh only display metadata, never touch workflow fields
      company: job.company,
      title: job.title,
      url: job.url,
      updatedAt: Date.now(),
    }
  } else {
    const now = Date.now()
    record = {
      ...job,
      status: 'seen',
      statusHistory: [{ status: 'seen', at: now }],
      matchScore: null,
      matchReason: null,
      tailoredResume: null,
      tailoredCoverLetter: null,
      notes: '',
      createdAt: now,
      updatedAt: now,
    }
  }

  await tx.store.put(record)
  await tx.done
  return record
}

/**
 * Update status, append to statusHistory, and bump updatedAt.
 * Throws if the record doesn't exist.
 */
export async function setStatus(id: string, status: AppStatus): Promise<void> {
  const conn = await db()
  const tx = conn.transaction(STORE, 'readwrite')
  const record = await tx.store.get(id)
  if (!record) { await tx.done; throw new Error(`Job "${id}" not found`) }

  const now = Date.now()
  await tx.store.put({
    ...record,
    status,
    statusHistory: [...record.statusHistory, { status, at: now }],
    updatedAt: now,
  })
  await tx.done
}

export async function setMatch(id: string, score: number, reason: string): Promise<void> {
  const conn = await db()
  const tx = conn.transaction(STORE, 'readwrite')
  const record = await tx.store.get(id)
  if (!record) { await tx.done; throw new Error(`Job "${id}" not found`) }

  await tx.store.put({ ...record, matchScore: score, matchReason: reason, updatedAt: Date.now() })
  await tx.done
}

export async function setTailored(
  id: string,
  resume: string,
  coverLetter: string,
): Promise<void> {
  const conn = await db()
  const tx = conn.transaction(STORE, 'readwrite')
  const record = await tx.store.get(id)
  if (!record) { await tx.done; throw new Error(`Job "${id}" not found`) }

  await tx.store.put({
    ...record,
    tailoredResume: resume,
    tailoredCoverLetter: coverLetter,
    updatedAt: Date.now(),
  })
  await tx.done
}

export async function setNotes(id: string, notes: string): Promise<void> {
  const conn = await db()
  const tx = conn.transaction(STORE, 'readwrite')
  const record = await tx.store.get(id)
  if (!record) { await tx.done; throw new Error(`Job "${id}" not found`) }

  await tx.store.put({ ...record, notes, updatedAt: Date.now() })
  await tx.done
}

// ── Read operations ───────────────────────────────────────────────────────────

export async function getJob(id: string): Promise<ApplicationRecord | undefined> {
  return (await db()).get(STORE, id)
}

export async function getAllJobs(): Promise<ApplicationRecord[]> {
  return (await db()).getAllFromIndex(STORE, 'by-updated')
}

export async function getJobsByStatus(status: AppStatus): Promise<ApplicationRecord[]> {
  return (await db()).getAllFromIndex(STORE, 'by-status', status)
}

// ── Debug / test helper (used by the options page dev panel) ─────────────────

/** Delete a record by id — only used by the dev test to clean up after itself. */
export async function deleteJob(id: string): Promise<void> {
  const conn = await db()
  await conn.delete(STORE, id)
}
