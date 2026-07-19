import {
  CHALLENGE_DAYS,
  findDayLog,
  getCurrentDayIndex,
  isAllowedRestDay,
  isDayComplete,
  MAX_REST_PER_WEEK,
  MIN_COMPLETE_PER_WEEK,
} from './challenge'
import type { Challenge, DayLog } from '../types'

export const HARD75_RULES = [
  {
    title: 'Two 45-minute workouts',
    detail: 'On active days. At least one must be outdoors.',
  },
  {
    title: 'Follow your diet',
    detail: 'No cheat meals and no alcohol.',
  },
  {
    title: 'Drink 1 gallon of water',
    detail: '128 oz / 3.8 liters throughout the day.',
  },
  {
    title: 'Read 10 pages',
    detail: 'Non-fiction or personal growth.',
  },
  {
    title: 'Take a progress photo',
    detail: 'One photo every active day.',
  },
  {
    title: `${MIN_COMPLETE_PER_WEEK} days per week`,
    detail: `Complete at least ${MIN_COMPLETE_PER_WEEK} days in each 7-day block (up to ${MAX_REST_PER_WEEK} rest days). Fall below that and you fail and restart at Day 1.`,
  },
] as const

export function countConsecutiveStreak(
  challenge: Challenge,
  logs: DayLog[],
  today: string,
): number {
  const current = Math.min(
    getCurrentDayIndex(challenge.startedAt, today),
    CHALLENGE_DAYS,
  )
  const lastPastDay = Math.min(current - 1, CHALLENGE_DAYS)
  let streak = 0
  for (let day = current; day >= 1; day -= 1) {
    const log = findDayLog(logs, challenge.id, day)
    if (isDayComplete(log)) {
      streak += 1
      continue
    }
    // Today incomplete does not break the streak yet.
    if (day === current) continue
    if (isAllowedRestDay(challenge, logs, day, lastPastDay)) continue
    break
  }
  return streak
}

export function getFailMessage(dayIndex: number): string {
  return `Day ${dayIndex} pushed you over ${MAX_REST_PER_WEEK} rest days in that week. You need at least ${MIN_COMPLETE_PER_WEEK} completed days every 7 days — otherwise you restart at Day 1.`
}
