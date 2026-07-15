import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useChallenge } from '../context/ChallengeContext'
import { dateForDayIndex } from '../lib/challenge'
import { getDayPhotoPath, getProgressPhotoUrl } from '../lib/cloud'
import { formatDisplayDate } from '../lib/dates'
import './PhotosPage.css'

interface PhotoEntry {
  dayIndex: number
  date: string
  url: string
}

export function PhotosPage() {
  const { user } = useAuth()
  const { state, loading } = useChallenge()
  const challenge = state.activeChallenge ?? state.pastChallenges[0] ?? null
  const [photos, setPhotos] = useState<PhotoEntry[]>([])
  const [loadingPhotos, setLoadingPhotos] = useState(false)
  const [selected, setSelected] = useState<PhotoEntry | null>(null)

  const photoLogs = useMemo(() => {
    if (!challenge) return []
    return state.dayLogs
      .filter((log) => log.challengeId === challenge.id && log.hasPhoto)
      .sort((a, b) => a.dayIndex - b.dayIndex)
  }, [challenge, state.dayLogs])

  useEffect(() => {
    let cancelled = false

    if (!user || !challenge || photoLogs.length === 0) {
      setPhotos([])
      setLoadingPhotos(false)
      return
    }

    setLoadingPhotos(true)

    void (async () => {
      const entries = await Promise.all(
        photoLogs.map(async (log) => {
          const path = getDayPhotoPath(user.id, challenge.id, log.dayIndex)
          const url = await getProgressPhotoUrl(path)
          if (!url) return null
          return {
            dayIndex: log.dayIndex,
            date: log.date || dateForDayIndex(challenge.startedAt, log.dayIndex),
            url,
          } satisfies PhotoEntry
        }),
      )

      if (!cancelled) {
        setPhotos(entries.filter((entry): entry is PhotoEntry => entry !== null))
        setLoadingPhotos(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user, challenge, photoLogs])

  if (loading) {
    return (
      <section className="photos-empty">
        <h1>Loading photos…</h1>
      </section>
    )
  }

  if (!challenge) {
    return (
      <section className="photos-empty">
        <h1>No photos yet</h1>
        <p>Start a challenge and take your Day 1 progress photo from Today.</p>
        <Link className="text-link" to="/">
          Go to Today
        </Link>
      </section>
    )
  }

  const first = photos[0] ?? null
  const latest = photos.length > 1 ? photos[photos.length - 1] : null
  const canCompare = Boolean(first && latest)

  return (
    <section className="photos-page">
      <header className="photos-page__head">
        <h1>See the change</h1>
        <p>
          Progress photos from this attempt
          {photos.length > 0 ? ` · ${photos.length} saved` : ''}.
        </p>
      </header>

      {loadingPhotos && (
        <p className="photos-status">Loading your photos…</p>
      )}

      {!loadingPhotos && photos.length === 0 && (
        <article className="photos-empty-card">
          <h2>No progress photos yet</h2>
          <p>
            Complete the photo task on Today. Once a few days are saved, you can
            compare Day 1 with your latest shot.
          </p>
          <Link className="btn-primary photos-cta" to="/">
            Take today’s photo
          </Link>
        </article>
      )}

      {canCompare && first && latest && (
        <article className="photos-compare">
          <h2>Before & after</h2>
          <p className="photos-compare__lead">
            Day {first.dayIndex} vs Day {latest.dayIndex}
          </p>
          <div className="photos-compare__grid">
            <button
              type="button"
              className="photos-compare__slot"
              onClick={() => setSelected(first)}
            >
              <img src={first.url} alt={`Day ${first.dayIndex} progress`} />
              <span>
                Day {first.dayIndex}
                <small>{formatDisplayDate(first.date)}</small>
              </span>
            </button>
            <button
              type="button"
              className="photos-compare__slot"
              onClick={() => setSelected(latest)}
            >
              <img src={latest.url} alt={`Day ${latest.dayIndex} progress`} />
              <span>
                Day {latest.dayIndex}
                <small>{formatDisplayDate(latest.date)}</small>
              </span>
            </button>
          </div>
        </article>
      )}

      {!canCompare && first && (
        <article className="photos-compare">
          <h2>Starting photo</h2>
          <p className="photos-compare__lead">
            Keep logging photos daily to unlock the before & after view.
          </p>
          <button
            type="button"
            className="photos-compare__slot photos-compare__slot--single"
            onClick={() => setSelected(first)}
          >
            <img src={first.url} alt={`Day ${first.dayIndex} progress`} />
            <span>
              Day {first.dayIndex}
              <small>{formatDisplayDate(first.date)}</small>
            </span>
          </button>
        </article>
      )}

      {photos.length > 0 && (
        <article className="photos-gallery">
          <h2>All photos</h2>
          <div className="photos-gallery__grid" role="list">
            {photos.map((photo) => (
              <button
                key={photo.dayIndex}
                type="button"
                role="listitem"
                className="photos-gallery__item"
                onClick={() => setSelected(photo)}
              >
                <img
                  src={photo.url}
                  alt={`Day ${photo.dayIndex} progress photo`}
                  loading="lazy"
                />
                <span>Day {photo.dayIndex}</span>
              </button>
            ))}
          </div>
        </article>
      )}

      {selected && (
        <div
          className="photos-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`Day ${selected.dayIndex} progress photo`}
          onClick={() => setSelected(null)}
        >
          <button
            type="button"
            className="photos-lightbox__close"
            onClick={() => setSelected(null)}
          >
            Close
          </button>
          <img
            src={selected.url}
            alt={`Day ${selected.dayIndex} progress photo`}
            onClick={(e) => e.stopPropagation()}
          />
          <p>
            Day {selected.dayIndex} · {formatDisplayDate(selected.date)}
          </p>
        </div>
      )}
    </section>
  )
}
