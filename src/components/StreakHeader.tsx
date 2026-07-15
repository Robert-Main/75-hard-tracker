import { CHALLENGE_DAYS } from '../lib/challenge'
import { countConsecutiveStreak } from '../lib/rules'
import type { Challenge, DayLog } from '../types'
import './StreakHeader.css'

interface StreakHeaderProps {
  dayIndex: number
  completedDays: number
  challenge: Challenge
  logs: DayLog[]
  today: string
}

export function StreakHeader({
  dayIndex,
  completedDays,
  challenge,
  logs,
  today,
}: StreakHeaderProps) {
  const day = Math.min(Math.max(dayIndex, 1), CHALLENGE_DAYS)
  const progress = Math.min(completedDays / CHALLENGE_DAYS, 1)
  const streak = countConsecutiveStreak(challenge, logs, today)
  const pct = Math.round(progress * 100)

  return (
    <section className="hero-card">
      <div className="hero-card__top">
        <div>
          <p className="hero-card__label">Day</p>
          <h1 className="hero-card__title">
            {day}/{CHALLENGE_DAYS}
          </h1>
        </div>
        <div className="hero-card__streak">
          <span className="hero-card__flame" aria-hidden="true">
            🔥
          </span>
          <span className="hero-card__streak-num">{streak}</span>
          <span className="hero-card__streak-label">day streak</span>
        </div>
      </div>

      <div
        className="hero-card__bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={CHALLENGE_DAYS}
        aria-valuenow={completedDays}
        aria-label="Challenge progress"
      >
        <span style={{ width: `${progress * 100}%` }} />
      </div>

      <p className="hero-card__meta">
        {pct}% through the challenge — no excuses.
      </p>
    </section>
  )
}
