import { countDayTasksDone, getMissingTasks } from '../lib/challenge'
import type { DayLog, TaskSettings } from '../types'
import { cx } from '../lib/ui'

interface DayOverviewProps {
  log: DayLog | undefined
  taskSettings: TaskSettings
  className?: string
}

export function DayOverview({ log, taskSettings, className }: DayOverviewProps) {
  const { done, total } = countDayTasksDone(log, taskSettings)
  const pct = (done / total) * 100
  const ring = 2 * Math.PI * 26
  const offset = ring - (pct / 100) * ring

  return (
    <section
      className={cx(
        'mb-[0.85rem] flex items-center justify-between gap-4 rounded-2xl border border-line bg-panel px-4 py-[0.95rem] shadow-[0_6px_18px_rgba(0,0,0,0.04)]',
        className,
      )}
      aria-label="Daily checklist overview"
    >
      <div>
        <p className="m-0 text-base font-bold">Today&apos;s tasks</p>
        <p className="mt-[0.2rem] text-[0.88rem] text-muted">
          {done} of {total} done
        </p>
      </div>

      <div
        className="relative h-[3.4rem] w-[3.4rem] shrink-0"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-label="Tasks completed today"
      >
        <svg className="h-full w-full -rotate-90" viewBox="0 0 60 60" aria-hidden="true">
          <circle
            className="fill-none stroke-line"
            cx="30"
            cy="30"
            r="26"
            strokeWidth="5"
          />
          <circle
            className="fill-none stroke-done transition-[stroke-dashoffset] duration-[350ms]"
            cx="30"
            cy="30"
            r="26"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={ring}
            strokeDashoffset={offset}
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center text-[0.82rem] font-bold">
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
