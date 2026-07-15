import { HARD75_RULES } from '../lib/rules'
import './RulesPage.css'

export function RulesPage() {
  return (
    <section className="rules-page">
      <h1>75 Hard Rules</h1>
      <p className="rules-lead">
        Complete every task, every day, for 75 days straight. Miss one task on
        one day and you restart at Day 1.
      </p>

      <ol className="rules-list">
        {HARD75_RULES.map((rule) => (
          <li key={rule.title}>
            <strong>{rule.title}</strong>
            <span>{rule.detail}</span>
          </li>
        ))}
      </ol>

      <article className="rules-fail-card">
        <h2>Fail conditions</h2>
        <ul>
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
        <p>
          There are no partial days. Finish everything today, or the challenge
          resets.
        </p>
      </article>
    </section>
  )
}
