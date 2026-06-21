export interface StorageData {
  cvText: string
  geminiApiKey: string
}

export interface JobData {
  title: string
  company: string
  description: string
  url: string
  ats: 'greenhouse' | 'lever' | 'workday'
}
