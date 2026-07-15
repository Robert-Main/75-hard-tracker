import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getDayPhotoPath,
  getProgressPhotoUrl,
  removeProgressPhoto,
  uploadProgressPhoto,
} from '../lib/cloud'
import { fileToCompressedDataUrl } from '../lib/photos'
import './ChecklistCard.css'

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
    <div className="task-editor">
      {preview ? (
        <img className="photo-preview" src={preview} alt="Progress photo" />
      ) : (
        <p className="photo-empty">No photo yet — take or upload one.</p>
      )}

      <div className="photo-actions">
        <label>
          Camera
          <input
            type="file"
            accept="image/*"
            capture="environment"
            disabled={disabled || busy}
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
        </label>
        <label>
          Upload
          <input
            type="file"
            accept="image/*"
            disabled={disabled || busy}
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
        </label>
      </div>

      {hasPhoto && (
        <button
          type="button"
          className="btn-secondary"
          disabled={disabled || busy}
          onClick={() => void onClear()}
        >
          Remove photo
        </button>
      )}

      {error && <p className="photo-empty">{error}</p>}
    </div>
  )
}
