import type { JobData } from '../types/types'

function text(selector: string): string {
  return document.querySelector(selector)?.textContent?.trim() ?? ''
}

function extractGreenhouse(): JobData {
  const title = text('h1.app-title') || text('h1') || document.title
  // Company slug from URL: boards.greenhouse.io/COMPANY/jobs/ID
  const company = decodeURIComponent(location.pathname.split('/')[1] ?? '').replace(/-/g, ' ')
  const description = text('#content') || text('.job__description') || text('article') || text('main')
  return { title, company, description, url: location.href, ats: 'greenhouse' }
}

function extractLever(): JobData {
  const title = text('.posting-headline h2') || text('h2') || document.title
  // Company slug from URL: jobs.lever.co/COMPANY/ID
  const company = decodeURIComponent(location.pathname.split('/')[1] ?? '').replace(/-/g, ' ')
  const description = document.querySelector('.section-wrapper')?.textContent?.trim() ?? text('main')
  return { title, company, description, url: location.href, ats: 'lever' }
}

function extractWorkday(): JobData {
  const title =
    text('[data-automation-id="jobPostingHeader"]') ||
    text('[data-automation-id="Job_Posting_Header_Title"]') ||
    text('h1') ||
    document.title
  // Company from subdomain: COMPANY.myworkdayjobs.com
  const company = location.hostname.split('.')[0] ?? ''
  const description =
    text('[data-automation-id="jobPostingDescription"]') ||
    text('[data-automation-id="Job_Posting_Description"]') ||
    text('main')
  return { title, company, description, url: location.href, ats: 'workday' }
}

function extractJobData(): JobData | null {
  const host = location.hostname
  if (host === 'boards.greenhouse.io' || host === 'job-boards.greenhouse.io') {
    return extractGreenhouse()
  }
  if (host === 'jobs.lever.co') {
    return extractLever()
  }
  if (host.endsWith('.myworkdayjobs.com')) {
    return extractWorkday()
  }
  return null
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'GET_JOB') {
    sendResponse(extractJobData())
  }
  return false
})
