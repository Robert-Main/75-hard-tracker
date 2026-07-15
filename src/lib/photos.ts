/** Compress image file to a JPEG data URL suitable for local storage. */
export function fileToCompressedDataUrl(
  file: File,
  maxWidth = 720,
  quality = 0.72,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read image'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Could not decode image'))
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width)
        const width = Math.round(img.width * scale)
        const height = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas unsupported'))
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

const DB_NAME = 'seventy-five-hard-photos'
const STORE = 'photos'

function photoKey(challengeId: string, dayIndex: number): string {
  return `${challengeId}:${dayIndex}`
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveProgressPhoto(
  challengeId: string,
  dayIndex: number,
  dataUrl: string,
): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(dataUrl, photoKey(challengeId, dayIndex))
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

export async function loadProgressPhoto(
  challengeId: string,
  dayIndex: number,
): Promise<string | null> {
  const db = await openDb()
  const result = await new Promise<string | null>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(photoKey(challengeId, dayIndex))
    req.onsuccess = () => resolve((req.result as string | undefined) ?? null)
    req.onerror = () => reject(req.error)
  })
  db.close()
  return result
}

export async function deleteProgressPhoto(
  challengeId: string,
  dayIndex: number,
): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(photoKey(challengeId, dayIndex))
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}
