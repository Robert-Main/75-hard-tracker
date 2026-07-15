import { CHALLENGE_DAYS } from './challenge'
import type { Challenge, DayLog } from '../types'
import { findDayLog, getCurrentDayIndex, isDayComplete } from './challenge'

export const HARD75_RULES = [
  {
    title: 'Two 45-minute workouts',
    detail: 'Every day. At least one must be outdoors.',
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
    detail: 'One photo every day.',
  },
  {
    title: 'Zero missed days',
    detail:
      'If any day ends incomplete, you fail and restart at Day 1. Not logging counts as incomplete.',
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
  let streak = 0
  for (let day = current; day >= 1; day -= 1) {
    const log = findDayLog(logs, challenge.id, day)
    if (!isDayComplete(log)) break
    streak += 1
  }
  return streak
}

export function getFailMessage(dayIndex: number): string {
  return `Day ${dayIndex} was incomplete. Any missed day — including days you could not log in — counts as a fail. Start again at Day 1.`
}
