import {
  MAX_REST_PER_WEEK,
  MIN_COMPLETE_PER_WEEK,
} from '../lib/challenge'
import { HARD75_RULES } from '../lib/rules'
import { mutedText, pageTitle } from '../lib/ui'

export function RulesPage() {
  return (
    <section className="min-[900px]:grid min-[900px]:max-w-[1000px] min-[900px]:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] min-[900px]:items-start min-[900px]:gap-6">
      <h1 className={`${pageTitle} mb-2 min-[900px]:col-span-2`}>75 Hard Rules</h1>
      <p className={`${mutedText} mb-5 leading-normal min-[900px]:col-span-2`}>
        Complete every task on active days for 75 days. You get up to{' '}
        {MAX_REST_PER_WEEK} rest days each week — finish at least{' '}
        {MIN_COMPLETE_PER_WEEK} days in every 7-day block, or restart at Day 1.
      </p>

      <ol className="m-0 mb-4 grid list-none gap-[0.65rem] p-0">
        {HARD75_RULES.map((rule) => (
          <li
            key={rule.title}
            className="grid gap-1 rounded-[0.85rem] border border-line bg-panel px-4 py-[0.9rem]"
          >
            <strong className="text-[0.98rem] text-ink">{rule.title}</strong>
            <span className="text-[0.9rem] leading-snug text-muted">
              {rule.detail}
            </span>
          </li>
        ))}
      </ol>

      <article className="grid gap-[0.65rem] rounded-2xl border border-danger/25 bg-[color-mix(in_srgb,var(--danger)_8%,var(--panel))] p-4 min-[900px]:sticky min-[900px]:top-8">
        <h2 className="m-0 text-base text-danger">Fail conditions</h2>
        <ul className="m-0 grid list-disc gap-1.5 pl-[1.1rem] text-[0.92rem] leading-snug text-ink">
          <li>
            A 7-day block ends with fewer than {MIN_COMPLETE_PER_WEEK} fully
            completed days (more than {MAX_REST_PER_WEEK} rest / incomplete days).
          </li>
          <li>
            You already used {MAX_REST_PER_WEEK} rest days in the current week
            and another past day is still incomplete.
          </li>
          <li>
            You could not sign in and log before midnight — when you return,
            that day counts toward your weekly rest allowance.
          </li>
          <li>You manually declare failure from Settings.</li>
        </ul>
        <p className={`${mutedText} text-[0.9rem]`}>
          Rest days need no tasks. On active days, finish everything — or that
          day burns a rest slot.
        </p>
      </article>
    </section>
  )
}
