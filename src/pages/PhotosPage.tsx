import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useChallenge } from '../context/ChallengeContext'
import { dateForDayIndex } from '../lib/challenge'
import { getDayPhotoPath, getProgressPhotoUrl } from '../lib/cloud'
import { formatDisplayDate } from '../lib/dates'
import { btnPrimary, cx, mutedText, pageTitle, textLink } from '../lib/ui'

interface PhotoEntry {
  dayIndex: number
  date: string
  url: string
}

const photoCard =
  'grid gap-3 rounded-2xl border border-line bg-panel/94 p-4'

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
      <section className="grid gap-3 pt-6">
        <h1 className={pageTitle}>Loading photos…</h1>
      </section>
    )
  }

  if (!challenge) {
    return (
      <section className="grid gap-3 pt-6">
        <h1 className={pageTitle}>No photos yet</h1>
        <p className={mutedText}>
          Start a challenge and take your Day 1 progress photo from Today.
        </p>
        <Link className={textLink} to="/">
          Go to Today
        </Link>
      </section>
    )
  }

  const first = photos[0] ?? null
  const latest = photos.length > 1 ? photos[photos.length - 1] : null
  const canCompare = Boolean(first && latest)

  return (
    <section className="grid animate-rise gap-[1.1rem] pt-[0.35rem] motion-reduce:animate-none min-[900px]:max-w-[1100px]">
      <header>
        <h1 className={pageTitle}>See the change</h1>
        <p className={cx(mutedText, 'mt-[0.35rem]')}>
          Progress photos from this attempt
          {photos.length > 0 ? ` · ${photos.length} saved` : ''}.
        </p>
      </header>

      {loadingPhotos && (
        <p className={cx(mutedText, 'mt-[0.35rem]')}>Loading your photos…</p>
      )}

      {!loadingPhotos && photos.length === 0 && (
        <article className={photoCard}>
          <h2 className="m-0 text-base">No progress photos yet</h2>
          <p className={cx(mutedText, 'text-[0.92rem]')}>
            Complete the photo task on Today. Once a few days are saved, you can
            compare Day 1 with your latest shot.
          </p>
          <Link
            className={cx(btnPrimary, '!w-fit no-underline')}
            to="/"
          >
            Take today’s photo
          </Link>
        </article>
      )}

      {canCompare && first && latest && (
        <article className={photoCard}>
          <h2 className="m-0 text-base">Before & after</h2>
          <p className={cx(mutedText, 'text-[0.92rem]')}>
            Day {first.dayIndex} vs Day {latest.dayIndex}
          </p>
          <div className="grid grid-cols-2 gap-[0.65rem]">
            {[first, latest].map((entry) => (
              <button
                key={entry.dayIndex}
                type="button"
                className="grid appearance-none overflow-hidden rounded-[0.85rem] border border-line bg-bg p-0 text-left cursor-pointer"
                onClick={() => setSelected(entry)}
              >
                <img
                  src={entry.url}
                  alt={`Day ${entry.dayIndex} progress`}
                  className="aspect-[3/4] w-full object-cover"
                />
                <span className="grid gap-0.5 px-[0.65rem] py-[0.55rem] text-[0.88rem] font-bold">
                  Day {entry.dayIndex}
                  <small className="text-[0.78rem] font-medium text-muted">
                    {formatDisplayDate(entry.date)}
                  </small>
                </span>
              </button>
            ))}
          </div>
        </article>
      )}

      {!canCompare && first && (
        <article className={photoCard}>
          <h2 className="m-0 text-base">Starting photo</h2>
          <p className={cx(mutedText, 'text-[0.92rem]')}>
            Keep logging photos daily to unlock the before & after view.
          </p>
          <button
            type="button"
            className="grid max-w-64 appearance-none overflow-hidden rounded-[0.85rem] border border-line bg-bg p-0 text-left cursor-pointer min-[900px]:max-w-80"
            onClick={() => setSelected(first)}
          >
            <img
              src={first.url}
              alt={`Day ${first.dayIndex} progress`}
              className="aspect-[3/4] w-full object-cover"
            />
            <span className="grid gap-0.5 px-[0.65rem] py-[0.55rem] text-[0.88rem] font-bold">
              Day {first.dayIndex}
              <small className="text-[0.78rem] font-medium text-muted">
                {formatDisplayDate(first.date)}
              </small>
            </span>
          </button>
        </article>
      )}

      {photos.length > 0 && (
        <article className={photoCard}>
          <h2 className="m-0 text-base">All photos</h2>
          <div
            className="grid grid-cols-3 gap-2 min-[900px]:grid-cols-5 min-[900px]:gap-3 min-[1100px]:grid-cols-6"
            role="list"
          >
            {photos.map((photo) => (
              <button
                key={photo.dayIndex}
                type="button"
                role="listitem"
                className="grid appearance-none overflow-hidden rounded-[0.7rem] border border-line bg-bg p-0 cursor-pointer"
                onClick={() => setSelected(photo)}
              >
                <img
                  src={photo.url}
                  alt={`Day ${photo.dayIndex} progress photo`}
                  loading="lazy"
                  className="aspect-square w-full object-cover"
                />
                <span className="px-1.5 py-[0.35rem] text-center text-[0.72rem] font-bold">
                  Day {photo.dayIndex}
                </span>
              </button>
            ))}
          </div>
        </article>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-40 grid place-content-center gap-3 bg-black/88 p-5 text-white"
          role="dialog"
          aria-modal="true"
          aria-label={`Day ${selected.dayIndex} progress photo`}
          onClick={() => setSelected(null)}
        >
          <button
            type="button"
            className="appearance-none justify-self-end cursor-pointer rounded-full border border-white/28 bg-transparent px-[0.85rem] py-[0.45rem] font-bold text-white"
            onClick={() => setSelected(null)}
          >
            Close
          </button>
          <img
            src={selected.url}
            alt={`Day ${selected.dayIndex} progress photo`}
            className="max-h-[72dvh] w-min max-w-full rounded-xl object-contain min-[900px]:max-w-[40rem]"
            style={{ width: 'min(100%, 28rem)' }}
            onClick={(e) => e.stopPropagation()}
          />
          <p className="m-0 text-center font-semibold">
            Day {selected.dayIndex} · {formatDisplayDate(selected.date)}
          </p>
        </div>
      )}
    </section>
  )
}
