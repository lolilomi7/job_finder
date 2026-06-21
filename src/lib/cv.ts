import * as pdfjs from 'pdfjs-dist'
import mammoth from 'mammoth'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import type { CvData } from '../types/types'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

const MIN_TEXT_LENGTH = 50

async function parsePdf(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise
  const pages: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    // Join items, preserving line breaks where vertical position changes
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    pages.push(pageText.trim())
  }

  return pages.filter(Boolean).join('\n\n')
}

async function parseDocx(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer: buffer })
  return result.value
}

export async function parseFile(file: File): Promise<CvData> {
  const lower = file.name.toLowerCase()

  let rawText: string

  if (lower.endsWith('.pdf')) {
    rawText = await parsePdf(file)
  } else if (lower.endsWith('.docx')) {
    rawText = await parseDocx(file)
  } else {
    throw new Error('Unsupported file type. Please upload a .pdf or .docx file.')
  }

  const trimmed = rawText.trim()
  if (trimmed.length < MIN_TEXT_LENGTH) {
    throw new Error(
      'Could not extract readable text from this file. It may be image-based, scanned, or encrypted. Try copy-pasting the text directly into the CV box below.',
    )
  }

  return {
    rawText: trimmed,
    filename: file.name,
    parsedAt: Date.now(),
  }
}
