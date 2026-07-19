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
import { btnPrimary, cx, mutedText, textLink } from '../lib/ui'

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
      <section className="grid animate-rise gap-[0.85rem] pt-6 motion-reduce:animate-none">
        <p className="m-0 text-[0.75rem] font-bold uppercase tracking-[0.14em] text-accent-ink">
          Syncing
        </p>
        <h1 className="m-0 font-display text-[clamp(2rem,9vw,2.6rem)] uppercase leading-[0.95] tracking-[0.02em]">
          Loading your challenge…
        </h1>
      </section>
    )
  }

  if (failedDay !== null) {
    return (
      <section className="grid animate-rise gap-[0.85rem] pt-6 motion-reduce:animate-none">
        <p className="m-0 text-[0.75rem] font-bold uppercase tracking-[0.14em] text-accent-ink">
          Challenge failed
        </p>
        <h1 className="m-0 font-display text-[clamp(2rem,9vw,2.6rem)] uppercase leading-[0.95] tracking-[0.02em]">
          Day {failedDay} broke your streak.
        </h1>
        <p className={cx(mutedText, 'max-w-[36ch] leading-normal')}>
          {getFailMessage(failedDay)}
        </p>
        <button
          type="button"
          className={btnPrimary}
          onClick={() => {
            acknowledgeAutoFail()
            void startChallenge()
          }}
        >
          Start Day 1 again
        </button>
        <Link className={textLink} to="/rules">
          Read the rules
        </Link>
        <Link className={textLink} to="/progress">
          View progress
        </Link>
      </section>
    )
  }

  if (!challenge) {
    const last = state.pastChallenges[0]
    return (
      <section className="grid animate-rise gap-[0.85rem] pt-6 motion-reduce:animate-none">
        <p className="m-0 text-[0.75rem] font-bold uppercase tracking-[0.14em] text-accent-ink">
          No active challenge
        </p>
        <h1 className="m-0 font-display text-[clamp(2rem,9vw,2.6rem)] uppercase leading-[0.95] tracking-[0.02em]">
          Start your 75 days.
        </h1>
        <p className={cx(mutedText, 'max-w-[36ch] leading-normal')}>
          Active days: 2 workouts (1 outdoor), diet, 1 gallon of water, 10 pages
          of reading, and a progress photo. At least 5 days each week — more
          than 2 rest days and you start over.
        </p>
        {last && (
          <p className={cx(mutedText, 'max-w-[36ch] text-[0.9rem] leading-normal')}>
            Last attempt: {last.status}
            {last.startedAt ? ` · started ${formatDisplayDate(last.startedAt)}` : ''}
          </p>
        )}
        {syncError && (
          <p className={cx(mutedText, 'max-w-[36ch] text-[0.9rem] leading-normal')}>
            Could not load cloud data.
          </p>
        )}
        <button type="button" className={btnPrimary} onClick={() => void startChallenge()}>
          Begin Day 1
        </button>
        <Link className={textLink} to="/rules">
          Read the rules first
        </Link>
      </section>
    )
  }

  if (currentDayIndex !== null && currentDayIndex > 75) {
    return (
      <section className="grid animate-rise gap-[0.85rem] pt-6 motion-reduce:animate-none">
        <p className="m-0 text-[0.75rem] font-bold uppercase tracking-[0.14em] text-accent-ink">
          Past day 75
        </p>
        <h1 className="m-0 font-display text-[clamp(2rem,9vw,2.6rem)] uppercase leading-[0.95] tracking-[0.02em]">
          Finish any remaining logs on Progress, or start fresh.
        </h1>
        <button type="button" className={btnPrimary} onClick={() => void startChallenge()}>
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
    <section className="grid w-full gap-4 lg:gap-6">
      <header className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.85fr)] lg:items-stretch">
        <div className="min-w-0">
          <StreakHeader
            dayIndex={dayIndex}
            completedDays={completed}
            challenge={challenge}
            logs={state.dayLogs}
            today={today}
            fillHeight
          />
        </div>
        <div className="grid gap-[0.45rem] lg:content-start lg:gap-[0.65rem] lg:rounded-2xl lg:border lg:border-line lg:bg-panel lg:p-4">
          <DayOverview
            log={todayLog ?? undefined}
            taskSettings={state.taskSettings}
            className="mb-0 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none"
          />
          <p
            className={cx(
              'm-0 text-[0.92rem] leading-snug text-muted',
              dayDone && 'font-bold text-done-ink',
            )}
          >
            {dayDone
              ? 'All daily tasks complete. You can still edit anything below.'
              : missing.length > 0
                ? `Still needed: ${missing.map((id) => dayTaskLabelFromSettings(id, state.taskSettings)).join(', ')}.`
                : 'Keep going.'}
          </p>
          <p className="m-0 text-[0.82rem] leading-snug text-muted">
            Skip logging before midnight and that day uses a weekly rest slot
            (2 per week). A third incomplete day in the same week resets you.
          </p>
        </div>
      </header>

      <div className="min-w-0">
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
