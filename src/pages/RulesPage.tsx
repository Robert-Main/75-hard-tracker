import { HARD75_RULES } from '../lib/rules'
import { mutedText, pageTitle } from '../lib/ui'

export function RulesPage() {
  return (
    <section className="min-[900px]:grid min-[900px]:max-w-[1000px] min-[900px]:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] min-[900px]:items-start min-[900px]:gap-6">
      <h1 className={`${pageTitle} mb-2 min-[900px]:col-span-2`}>75 Hard Rules</h1>
      <p className={`${mutedText} mb-5 leading-normal min-[900px]:col-span-2`}>
        Complete every task, every day, for 75 days straight. Miss one task on
        one day and you restart at Day 1.
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
            A past day ends without all 6 tasks logged — even if you were sick,
            traveling, or forgot.
          </li>
          <li>
            You could not sign in and log your day before midnight — when you
            return, the missed day is marked as failed.
          </li>
          <li>
            You skip multiple days without logging — every gap is checked when
            you open the app again.
          </li>
          <li>You manually declare failure from Settings.</li>
        </ul>
        <p className={`${mutedText} text-[0.9rem]`}>
          There are no partial days. Finish everything today, or the challenge
          resets.
        </p>
      </article>
    </section>
  )
}
