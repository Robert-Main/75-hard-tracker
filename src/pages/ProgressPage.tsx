import { useEffect, useState } from 'react'
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
import './ProgressPage.css'

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

  if (loading) {
    return (
      <section className="progress-empty">
        <h1>Loading progress…</h1>
      </section>
    )
  }

  if (!challenge) {
    return (
      <section className="progress-empty">
        <h1>No progress yet</h1>
        <p>Start a challenge from Today to fill the 75-day grid.</p>
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
    <section className="progress">
      <div className="progress-main">
        <StreakHeader
          dayIndex={Math.min(dayIndex, CHALLENGE_DAYS)}
          completedDays={completed}
          challenge={challenge}
          logs={state.dayLogs}
          today={today}
        />

        <p className="progress-hint">
          Tap any day to review or edit tasks
          {challenge.status === 'active' ? ' for this attempt' : ''}.
          {failedDay !== null
            ? ` Day ${failedDay} failed — restart from Today.`
            : ''}
        </p>

        <div className="legend" aria-hidden="true">
          <span>
            <i className="swatch swatch-today" /> Today
          </span>
          <span>
            <i className="swatch swatch-done" /> Done
          </span>
          <span>
            <i className="swatch swatch-miss" /> Missed
          </span>
        </div>

        <div className="day-grid" role="list" aria-label="75 day progress">
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
                className={`day-pick ${selectedDay === day ? 'is-selected' : ''}`}
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

      <aside className="progress-detail">
        {selectedDay !== null && selectedDate ? (
          <article className="day-detail">
            <header className="day-detail__head">
              <h2>
                Day {selectedDay} · {formatDisplayDate(selectedDate)}
              </h2>
              <p>
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
                  <p className="muted">No log saved for this day yet.</p>
                ) : (
                  <ul className="day-detail__list">
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
                    className="day-detail__photo"
                    src={photoUrl}
                    alt={`Progress photo for day ${selectedDay}`}
                  />
                )}
                <p className="muted">
                  {challenge.status !== 'active'
                    ? 'Past attempts are view-only.'
                    : 'Future days open when you reach them.'}
                </p>
              </>
            )}
          </article>
        ) : (
          <article className="day-detail day-detail--empty">
            <h2>Day details</h2>
            <p className="muted">
              Select a day from the grid to review or edit workouts, diet,
              water, reading, and your progress photo.
            </p>
          </article>
        )}
      </aside>
    </section>
  )
}
