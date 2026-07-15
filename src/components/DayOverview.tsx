import { countDayTasksDone, getMissingTasks } from '../lib/challenge'
import type { DayLog, TaskSettings } from '../types'
import './DayOverview.css'

interface DayOverviewProps {
  log: DayLog | undefined
  taskSettings: TaskSettings
}

export function DayOverview({ log, taskSettings }: DayOverviewProps) {
  const { done, total } = countDayTasksDone(log, taskSettings)
  const pct = (done / total) * 100
  const ring = 2 * Math.PI * 26
  const offset = ring - (pct / 100) * ring

  return (
    <section className="tasks-summary" aria-label="Daily checklist overview">
      <div className="tasks-summary__copy">
        <p className="tasks-summary__title">Today&apos;s tasks</p>
        <p className="tasks-summary__count">
          {done} of {total} done
        </p>
      </div>

      <div
        className="tasks-summary__ring"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-label="Tasks completed today"
      >
        <svg viewBox="0 0 60 60" aria-hidden="true">
          <circle className="ring-bg" cx="30" cy="30" r="26" />
          <circle
            className="ring-fg"
            cx="30"
            cy="30"
            r="26"
            strokeDasharray={ring}
            strokeDashoffset={offset}
          />
        </svg>
        <span className="tasks-summary__ring-label">
          {done}/{total}
        </span>
      </div>
    </section>
  )
}

export function isTaskDone(
  id: 'workout1' | 'workout2' | 'diet' | 'water' | 'reading' | 'photo',
  log: DayLog | undefined,
  taskSettings?: TaskSettings,
): boolean {
  return !getMissingTasks(log, taskSettings).includes(id)
}
