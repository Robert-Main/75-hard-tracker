import { Link } from 'react-router-dom'
import { DayLogEditor } from '../components/DayLogEditor'
import { DayOverview } from '../components/DayOverview'
import { StreakHeader } from '../components/StreakHeader'
import { useChallenge } from '../context/ChallengeContext'
import {
  countCompletedDays,
  getMissingTasks,
  isDayComplete,
} from '../lib/challenge'
import { dayTaskLabelFromSettings } from '../lib/taskSettings'
import { formatDisplayDate } from '../lib/dates'
import { getFailMessage } from '../lib/rules'
import './TodayPage.css'

export function TodayPage() {
  const {
    state,
    today,
    currentDayIndex,
    todayLog,
    startChallenge,
    updateWorkout,
    updateDayLog,
    addWorkoutPreference,
    updateWorkoutPreference,
    removeWorkoutPreference,
    addReadingPreference,
    updateReadingPreference,
    removeReadingPreference,
    failedDay,
    acknowledgeAutoFail,
    loading,
    syncError,
  } = useChallenge()

  const challenge = state.activeChallenge

  if (loading) {
    return (
      <section className="welcome">
        <p className="welcome-kicker">Syncing</p>
        <h1>Loading your challenge…</h1>
      </section>
    )
  }

  if (failedDay !== null) {
    return (
      <section className="fail-banner">
        <p className="welcome-kicker">Challenge failed</p>
        <h1>Day {failedDay} broke your streak.</h1>
        <p className="welcome-copy">{getFailMessage(failedDay)}</p>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            acknowledgeAutoFail()
            void startChallenge()
          }}
        >
          Start Day 1 again
        </button>
        <Link className="text-link" to="/rules">
          Read the rules
        </Link>
        <Link className="text-link" to="/progress">
          View progress
        </Link>
      </section>
    )
  }

  if (!challenge) {
    const last = state.pastChallenges[0]
    return (
      <section className="welcome">
        <p className="welcome-kicker">No active challenge</p>
        <h1>Start your 75 days.</h1>
        <p className="welcome-copy">
          Every day: 2 workouts (1 outdoor), diet, 1 gallon of water, 10 pages
          of reading, and a progress photo. Miss anything and you start over.
        </p>
        {last && (
          <p className="welcome-history">
            Last attempt: {last.status}
            {last.startedAt ? ` · started ${formatDisplayDate(last.startedAt)}` : ''}
          </p>
        )}
        {syncError && <p className="welcome-history">Could not load cloud data.</p>}
        <button type="button" className="btn-primary" onClick={() => void startChallenge()}>
          Begin Day 1
        </button>
        <Link className="text-link" to="/rules">
          Read the rules first
        </Link>
      </section>
    )
  }

  if (currentDayIndex !== null && currentDayIndex > 75) {
    return (
      <section className="welcome">
        <p className="welcome-kicker">Past day 75</p>
        <h1>Finish any remaining logs on Progress, or start fresh.</h1>
        <button type="button" className="btn-primary" onClick={() => void startChallenge()}>
          Start a new challenge
        </button>
      </section>
    )
  }

  const dayIndex = currentDayIndex ?? 1
  const dayDone = isDayComplete(todayLog ?? undefined, state.taskSettings)
  const missing = getMissingTasks(todayLog ?? undefined, state.taskSettings)
  const completed = countCompletedDays(
    challenge,
    state.dayLogs,
    state.taskSettings,
  )

  return (
    <section className="today">
      <header className="today-top">
        <div className="today-top__hero">
          <StreakHeader
            dayIndex={dayIndex}
            completedDays={completed}
            challenge={challenge}
            logs={state.dayLogs}
            today={today}
          />
        </div>
        <div className="today-top__status">
          <DayOverview log={todayLog ?? undefined} taskSettings={state.taskSettings} />
          <p className={`day-hint ${dayDone ? 'is-good' : ''}`}>
            {dayDone
              ? 'All daily tasks complete. You can still edit anything below.'
              : missing.length > 0
                ? `Still needed: ${missing.map((id) => dayTaskLabelFromSettings(id, state.taskSettings)).join(', ')}.`
                : 'Keep going.'}
          </p>
          <p className="day-warning">
            Miss logging before midnight and the day counts as failed when you
            sign back in.
          </p>
        </div>
      </header>

      <div className="today-main">
        <DayLogEditor
          challengeId={challenge.id}
          dayIndex={dayIndex}
          logDate={today}
          log={todayLog}
          taskSettings={state.taskSettings}
          preferences={state.workoutPreferences}
          onUpdateWorkout={(which, patch) => void updateWorkout(which, patch)}
          onUpdateDayLog={(patch) => void updateDayLog(patch)}
          onAddPreference={addWorkoutPreference}
          onUpdatePreference={updateWorkoutPreference}
          onRemovePreference={removeWorkoutPreference}
          onAddReadingPreference={addReadingPreference}
          onUpdateReadingPreference={updateReadingPreference}
          onRemoveReadingPreference={removeReadingPreference}
        />
      </div>
    </section>
  )
}
