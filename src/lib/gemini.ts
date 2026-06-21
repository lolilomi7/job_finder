import { GoogleGenerativeAI } from '@google/generative-ai'
import { getStorage } from './storage'

const MODEL = 'gemini-1.5-flash'

/** Test an API key before saving. Throws with a user-readable message on failure. */
export async function testKey(apiKey: string): Promise<void> {
  if (!apiKey.trim()) throw new Error('No API key provided.')
  const genAI = new GoogleGenerativeAI(apiKey.trim())
  const model = genAI.getGenerativeModel({ model: MODEL })
  await model.generateContent('Reply with the single word: ok')
}

/** Send a prompt using the stored API key. Throws if no key is configured. */
export async function sendPrompt(prompt: string): Promise<string> {
  const { userSettings } = await getStorage(['userSettings'])
  const apiKey = userSettings?.geminiApiKey
  if (!apiKey) throw new Error('No Gemini API key configured. Add one in Settings.')
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: MODEL })
  const result = await model.generateContent(prompt)
  return result.response.text()
}
