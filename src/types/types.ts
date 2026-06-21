export type Seniority = 'intern' | 'junior' | 'senior'

export interface UserSettings {
  geminiApiKey: string
  targetTitles: string[]
  locations: string[]
  seniority: Seniority
}

export interface CvData {
  rawText: string
  filename: string
  parsedAt: number // Unix timestamp ms
}

export interface StorageData {
  cvData: CvData
  userSettings: UserSettings
}

export interface JobData {
  title: string
  company: string
  description: string
  url: string
  ats: 'greenhouse' | 'lever' | 'workday'
}
