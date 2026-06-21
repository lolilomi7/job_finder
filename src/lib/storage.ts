import type { StorageData } from '../types/types'

export async function getStorage<K extends keyof StorageData>(
  keys: K[],
): Promise<Partial<Pick<StorageData, K>>> {
  const result = await chrome.storage.local.get(keys as string[])
  return result as Partial<Pick<StorageData, K>>
}

export async function setStorage(data: Partial<StorageData>): Promise<void> {
  await chrome.storage.local.set(data)
}
