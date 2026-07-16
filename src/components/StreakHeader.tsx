import { CHALLENGE_DAYS } from '../lib/challenge'
import { countConsecutiveStreak } from '../lib/rules'
import { cx } from '../lib/ui'
import type { Challenge, DayLog } from '../types'

interface StreakHeaderProps {
  dayIndex: number
  completedDays: number
  challenge: Challenge
  logs: DayLog[]
  today: string
  fillHeight?: boolean
  className?: string
}

export function StreakHeader({
  dayIndex,
  completedDays,
  challenge,
  logs,
  today,
  fillHeight = false,
  className,
}: StreakHeaderProps) {
  const day = Math.min(Math.max(dayIndex, 1), CHALLENGE_DAYS)
  const progress = Math.min(completedDays / CHALLENGE_DAYS, 1)
  const streak = countConsecutiveStreak(challenge, logs, today)
  const pct = Math.round(progress * 100)

  return (
    <section
      className={
        fillHeight
          ? cx(
              'flex h-full flex-col justify-between rounded-[1.1rem] bg-hero px-[1.1rem] pb-4 pt-[1.15rem] text-on-accent shadow-[0_14px_32px_rgba(15,118,110,0.28)]',
              className,
            )
          : cx(
              'rounded-[1.1rem] bg-hero px-[1.1rem] pb-4 pt-[1.15rem] text-on-accent shadow-[0_14px_32px_rgba(15,118,110,0.28)]',
              className ?? 'mb-4',
            )
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="m-0 text-[0.78rem] font-semibold uppercase tracking-[0.14em] opacity-85">
            Day
          </p>
          <h1 className="mt-0.5 font-display text-[clamp(2.4rem,11vw,3rem)] leading-[0.95] tracking-[0.03em]">
            {day}/{CHALLENGE_DAYS}
          </h1>
        </div>
        <div className="grid min-w-[4.5rem] justify-items-center gap-0.5 rounded-xl bg-black/18 px-[0.65rem] py-[0.55rem]">
          <span className="text-[1.1rem]" aria-hidden="true">
            🔥
          </span>
          <span className="font-display text-[1.6rem] leading-none">{streak}</span>
          <span className="text-[0.62rem] uppercase tracking-[0.08em] opacity-90">
            day streak
          </span>
        </div>
      </div>

      <div
        className="mt-4 h-[0.42rem] overflow-hidden rounded-full bg-white/25"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={CHALLENGE_DAYS}
        aria-valuenow={completedDays}
        aria-label="Challenge progress"
      >
        <span
          className="block h-full rounded-full bg-white/95 transition-[width] duration-[400ms]"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <p className="mt-[0.55rem] text-[0.82rem] opacity-92">
        {pct}% through the challenge — no excuses.
      </p>
    </section>
  )
}
