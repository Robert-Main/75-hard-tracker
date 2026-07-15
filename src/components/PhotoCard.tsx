import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getDayPhotoPath,
  getProgressPhotoUrl,
  removeProgressPhoto,
  uploadProgressPhoto,
} from '../lib/cloud'
import { fileToCompressedDataUrl } from '../lib/photos'
import { btnSecondary, cx, mutedText } from '../lib/ui'

interface PhotoCardProps {
  challengeId: string
  dayIndex: number
  hasPhoto: boolean
  disabled?: boolean
  onHasPhotoChange: (hasPhoto: boolean) => void
}

export function PhotoCard({
  challengeId,
  dayIndex,
  hasPhoto,
  disabled = false,
  onHasPhotoChange,
}: PhotoCardProps) {
  const { user } = useAuth()
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!hasPhoto || !user) {
      setPreview(null)
      return
    }

    const path = getDayPhotoPath(user.id, challengeId, dayIndex)
    void getProgressPhotoUrl(path).then((url) => {
      if (!cancelled) setPreview(url)
    })

    return () => {
      cancelled = true
    }
  }, [challengeId, dayIndex, hasPhoto, user])

  const onFile = async (file: File | undefined) => {
    if (!file || disabled || !user) return
    setBusy(true)
    setError(null)
    try {
      const dataUrl = await fileToCompressedDataUrl(file)
      await uploadProgressPhoto(user.id, challengeId, dayIndex, dataUrl)
      setPreview(dataUrl)
      onHasPhotoChange(true)
    } catch {
      setError('Could not save that photo. Try another image.')
    } finally {
      setBusy(false)
    }
  }

  const onClear = async () => {
    if (!user) return
    setBusy(true)
    setError(null)
    try {
      const path = getDayPhotoPath(user.id, challengeId, dayIndex)
      await removeProgressPhoto(path)
      setPreview(null)
      onHasPhotoChange(false)
    } catch {
      setError('Could not remove photo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-3">
      {preview ? (
        <img
          className="aspect-[3/4] w-full max-w-44 rounded-[0.65rem] border border-line bg-bg-deep object-cover"
          src={preview}
          alt="Progress photo"
        />
      ) : (
        <p className={cx(mutedText, 'text-[0.9rem]')}>
          No photo yet — take or upload one.
        </p>
      )}

      <div className="grid max-w-64 grid-cols-2 gap-1.5">
        <label className="grid cursor-pointer place-items-center rounded-lg border border-line bg-panel px-[0.45rem] py-1.5 text-[0.82rem] font-semibold">
          Camera
          <input
            type="file"
            className="hidden"
            accept="image/*"
            capture="environment"
            disabled={disabled || busy}
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
        </label>
        <label className="grid cursor-pointer place-items-center rounded-lg border border-line bg-panel px-[0.45rem] py-1.5 text-[0.82rem] font-semibold">
          Upload
          <input
            type="file"
            className="hidden"
            accept="image/*"
            disabled={disabled || busy}
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
        </label>
      </div>

      {hasPhoto && (
        <button
          type="button"
          className={cx(btnSecondary, '!w-fit')}
          disabled={disabled || busy}
          onClick={() => void onClear()}
        >
          Remove photo
        </button>
      )}

      {error && <p className={cx(mutedText, 'text-[0.9rem]')}>{error}</p>}
    </div>
  )
}
