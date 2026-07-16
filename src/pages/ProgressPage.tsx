import { useEffect, useRef, useState } from 'react'
import { DayCell } from '../components/DayCell'
import { DayLogEditor } from '../components/DayLogEditor'
import { StreakHeader } from '../components/StreakHeader'
import { useAuth } from '../context/AuthContext'
import { useChallenge } from '../context/ChallengeContext'
import {
  CHALLENGE_DAYS,
  countCompletedDays,
  countDayTasksDone,
  dateForDayIndex,
  findDayLog,
  getCurrentDayIndex,
  getDayStatus,
  isDayComplete,
} from '../lib/challenge'
import { getDayPhotoPath, getProgressPhotoUrl } from '../lib/cloud'
import { formatDisplayDate } from '../lib/dates'
import type { Challenge, DayLog, DayStatus, TaskSettings } from '../types'
import { cx, mutedText, pageTitle } from '../lib/ui'

function resolveDayStatus(
  challenge: Challenge,
  logs: DayLog[],
  day: number,
  today: string,
  taskSettings: TaskSettings,
): DayStatus {
  if (challenge.status === 'active') {
    return getDayStatus(challenge, logs, day, today, taskSettings)
  }

  const log = findDayLog(logs, challenge.id, day)
  if (isDayComplete(log, taskSettings)) return 'complete'

  const endDate =
    challenge.failedAt ?? challenge.completedAt ?? challenge.startedAt
  const endIndex = getCurrentDayIndex(challenge.startedAt, endDate)

  if (day < endIndex) return 'missed'
  if (day === endIndex && challenge.status === 'failed') return 'missed'
  return 'upcoming'
}

export function ProgressPage() {
  const { user } = useAuth()
  const {
    state,
    today,
    failedDay,
    loading,
    updateWorkout,
    updateDayLog,
    addWorkoutPreference,
    updateWorkoutPreference,
    removeWorkoutPreference,
    addReadingPreference,
    updateReadingPreference,
    removeReadingPreference,
  } = useChallenge()
  const challenge = state.activeChallenge ?? state.pastChallenges[0] ?? null
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const detailRef = useRef<HTMLElement>(null)

  const selectedLog =
    challenge && selectedDay !== null
      ? findDayLog(state.dayLogs, challenge.id, selectedDay) ?? null
      : null

  const currentDay =
    challenge && challenge.status === 'active'
      ? getCurrentDayIndex(challenge.startedAt, today)
      : null

  const canEdit =
    Boolean(challenge && challenge.status === 'active') &&
    selectedDay !== null &&
    currentDay !== null &&
    selectedDay <= currentDay &&
    failedDay === null

  useEffect(() => {
    let cancelled = false
    if (
      !user ||
      !challenge ||
      !selectedLog?.hasPhoto ||
      selectedDay === null
    ) {
      setPhotoUrl(null)
      return
    }
    const path = getDayPhotoPath(user.id, challenge.id, selectedDay)
    void getProgressPhotoUrl(path).then((url) => {
      if (!cancelled) setPhotoUrl(url)
    })
    return () => {
      cancelled = true
    }
  }, [user, challenge, selectedDay, selectedLog?.hasPhoto])

  useEffect(() => {
    if (selectedDay === null) return
    if (!window.matchMedia('(max-width: 1023px)').matches) return
    detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [selectedDay])

  if (loading) {
    return (
      <section className="pt-6">
        <h1 className={pageTitle}>Loading progress…</h1>
      </section>
    )
  }

  if (!challenge) {
    return (
      <section className="pt-6">
        <h1 className={pageTitle}>No progress yet</h1>
        <p className={cx(mutedText, 'mt-2')}>
          Start a challenge from Today to fill the 75-day grid.
        </p>
      </section>
    )
  }

  const dayIndex =
    challenge.status === 'active'
      ? getCurrentDayIndex(challenge.startedAt, today)
      : CHALLENGE_DAYS
  const completed = countCompletedDays(
    challenge,
    state.dayLogs,
    state.taskSettings,
  )

  const selectedDate =
    selectedDay === null
      ? null
      : dateForDayIndex(challenge.startedAt, selectedDay)
  const selectedStatus =
    selectedDay === null
      ? null
      : resolveDayStatus(
          challenge,
          state.dayLogs,
          selectedDay,
          today,
          state.taskSettings,
        )
  const taskCounts = countDayTasksDone(
    selectedLog ?? undefined,
    state.taskSettings,
  )

  return (
    <section className="grid gap-4 lg:gap-7">
      <StreakHeader
        dayIndex={Math.min(dayIndex, CHALLENGE_DAYS)}
        completedDays={completed}
        challenge={challenge}
        logs={state.dayLogs}
        today={today}
        className="mb-0"
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,400px)] lg:items-start lg:gap-7">
        <div className="min-w-0">
          <p className="mb-[0.85rem] mt-0 text-[0.9rem] leading-snug text-muted">
            Tap any day to review or edit tasks
            {challenge.status === 'active' ? ' for this attempt' : ''}.
            {failedDay !== null
              ? ` Day ${failedDay} failed — restart from Today.`
              : ''}
          </p>

          <div
            className="mb-[0.9rem] flex flex-wrap gap-[0.85rem] text-[0.78rem] font-semibold text-muted"
            aria-hidden="true"
          >
            <span className="inline-flex items-center gap-[0.35rem]">
              <i className="inline-block h-[0.7rem] w-[0.7rem] rounded-[0.2rem] bg-accent not-italic" />{' '}
              Today
            </span>
            <span className="inline-flex items-center gap-[0.35rem]">
              <i className="inline-block h-[0.7rem] w-[0.7rem] rounded-[0.2rem] bg-done not-italic" />{' '}
              Done
            </span>
            <span className="inline-flex items-center gap-[0.35rem]">
              <i className="inline-block h-[0.7rem] w-[0.7rem] rounded-[0.2rem] bg-[color-mix(in_srgb,var(--danger)_55%,white)] not-italic" />{' '}
              Missed
            </span>
          </div>

          <div
            className="grid grid-cols-5 gap-1.5 sm:grid-cols-7 sm:gap-2 md:grid-cols-10 lg:grid-cols-10 lg:gap-[0.45rem] xl:grid-cols-[repeat(15,minmax(0,1fr))]"
            role="list"
            aria-label="75 day progress"
          >
            {Array.from({ length: CHALLENGE_DAYS }, (_, i) => {
              const day = i + 1
              const status = resolveDayStatus(
                challenge,
                state.dayLogs,
                day,
                today,
                state.taskSettings,
              )
              return (
                <button
                  key={day}
                  type="button"
                  role="listitem"
                  className={cx(
                    'appearance-none cursor-pointer rounded-[0.45rem] border-0 bg-transparent p-0',
                    selectedDay === day &&
                      'outline outline-2 outline-offset-1 outline-accent',
                  )}
                  onClick={() =>
                    setSelectedDay((prev) => (prev === day ? null : day))
                  }
                >
                  <DayCell dayIndex={day} status={status} />
                </button>
              )
            })}
          </div>
        </div>

        <aside
          ref={detailRef}
          className={cx(
            selectedDay !== null ? 'block' : 'hidden',
            'lg:sticky lg:top-8 lg:block',
          )}
        >
          {selectedDay !== null && selectedDate ? (
            <article className="grid max-h-none gap-[0.85rem] rounded-2xl border border-line bg-panel/92 p-4 lg:max-h-[calc(100dvh-4rem)] lg:overflow-auto">
            <header>
              <h2 className="m-0 text-[1.05rem]">
                Day {selectedDay} · {formatDisplayDate(selectedDate)}
              </h2>
              <p className="mt-1 capitalize text-[0.9rem] text-muted">
                {selectedStatus} · {taskCounts.done}/{taskCounts.total} tasks
                {canEdit ? ' · editable' : ''}
              </p>
            </header>

            {canEdit ? (
              <DayLogEditor
                challengeId={challenge.id}
                dayIndex={selectedDay}
                logDate={selectedDate}
                log={selectedLog}
                taskSettings={state.taskSettings}
                preferences={state.workoutPreferences}
                className="lg:!grid-cols-1"
                onUpdateWorkout={(which, patch) =>
                  void updateWorkout(which, patch, selectedDay)
                }
                onUpdateDayLog={(patch) =>
                  void updateDayLog(patch, selectedDay)
                }
                onAddPreference={addWorkoutPreference}
                onUpdatePreference={updateWorkoutPreference}
                onRemovePreference={removeWorkoutPreference}
                onAddReadingPreference={addReadingPreference}
                onUpdateReadingPreference={updateReadingPreference}
                onRemoveReadingPreference={removeReadingPreference}
              />
            ) : (
              <>
                {!selectedLog ? (
                  <p className={mutedText}>No log saved for this day yet.</p>
                ) : (
                  <ul className="m-0 grid list-disc gap-[0.35rem] pl-[1.1rem] text-[0.92rem] text-ink">
                    <li>
                      Workout 1:{' '}
                      {selectedLog.workout1.done
                        ? [
                            selectedLog.workout1.location,
                            selectedLog.workout1.note,
                            selectedLog.workout1.durationMins != null
                              ? `${selectedLog.workout1.durationMins} min`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')
                        : 'not done'}
                    </li>
                    <li>
                      Workout 2:{' '}
                      {selectedLog.workout2.done
                        ? [
                            selectedLog.workout2.location,
                            selectedLog.workout2.note,
                            selectedLog.workout2.durationMins != null
                              ? `${selectedLog.workout2.durationMins} min`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')
                        : 'not done'}
                    </li>
                    <li>Diet: {selectedLog.diet ? 'done' : 'not done'}</li>
                    <li>Water: {selectedLog.waterOz} oz</li>
                    <li>
                      Reading: {selectedLog.readingPages} pages
                      {selectedLog.readingTitle
                        ? ` · ${selectedLog.readingTitle}`
                        : ''}
                    </li>
                    <li>Photo: {selectedLog.hasPhoto ? 'saved' : 'missing'}</li>
                  </ul>
                )}
                {photoUrl && (
                  <img
                    className="max-h-80 w-full rounded-xl border border-line object-cover lg:max-h-[420px]"
                    src={photoUrl}
                    alt={`Progress photo for day ${selectedDay}`}
                  />
                )}
                <p className={mutedText}>
                  {challenge.status !== 'active'
                    ? 'Past attempts are view-only.'
                    : 'Future days open when you reach them.'}
                </p>
              </>
            )}
          </article>
        ) : (
          <article className="grid gap-[0.85rem] rounded-2xl border border-line bg-panel/92 p-4">
            <h2 className="m-0 text-[1.05rem]">Day details</h2>
            <p className={mutedText}>
              Select a day from the grid to review or edit workouts, diet,
              water, reading, and your progress photo.
            </p>
          </article>
        )}
        </aside>
      </div>
    </section>
  )
}
