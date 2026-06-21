export type Seniority = 'intern' | 'junior' | 'senior'

export interface UserSettings {
  geminiApiKey: string
  targetTitles: string[]
  locations: string[]
  seniority: Seniority
}

export interface StorageData {
  cvText: string
  userSettings: UserSettings
}

export interface JobData {
  title: string
  company: string
  description: string
  url: string
  ats: 'greenhouse' | 'lever' | 'workday'
}
