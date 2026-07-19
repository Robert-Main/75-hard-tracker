import type { DayStatus } from '../types'
import { cx } from '../lib/ui'

interface DayCellProps {
  dayIndex: number
  status: DayStatus
}

const labels: Record<DayStatus, string> = {
  upcoming: 'Upcoming',
  today: 'Today',
  complete: 'Complete',
  incomplete: 'Incomplete',
  rest: 'Rest',
  missed: 'Missed',
}

export function DayCell({ dayIndex, status }: DayCellProps) {
  return (
    <div
      className={cx(
        'grid aspect-square place-items-center rounded-[0.45rem] border border-transparent text-[0.72rem] font-bold transition-[transform,background] duration-180',
        status === 'upcoming' && 'border-line bg-panel/70 text-muted',
        status === 'today' &&
          'bg-accent text-on-accent shadow-[0_0_0_2px] shadow-accent/35 motion-safe:animate-pulse-today',
        status === 'complete' && 'bg-done text-on-done',
        status === 'rest' &&
          'border-line bg-[color-mix(in_srgb,var(--muted)_22%,var(--panel))] text-muted',
        (status === 'incomplete' || status === 'missed') &&
          'border-danger/35 bg-[color-mix(in_srgb,var(--danger)_18%,var(--panel))] text-danger',
      )}
      title={`Day ${dayIndex}: ${labels[status]}`}
      aria-label={`Day ${dayIndex}, ${labels[status]}`}
    >
      <span>{dayIndex}</span>
    </div>
  )
}
