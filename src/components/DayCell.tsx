import type { DayStatus } from '../types'
import './DayCell.css'

interface DayCellProps {
  dayIndex: number
  status: DayStatus
}

const labels: Record<DayStatus, string> = {
  upcoming: 'Upcoming',
  today: 'Today',
  complete: 'Complete',
  incomplete: 'Incomplete',
  missed: 'Missed',
}

export function DayCell({ dayIndex, status }: DayCellProps) {
  return (
    <div
      className={`day-cell day-cell--${status}`}
      title={`Day ${dayIndex}: ${labels[status]}`}
      aria-label={`Day ${dayIndex}, ${labels[status]}`}
    >
      <span>{dayIndex}</span>
    </div>
  )
}
