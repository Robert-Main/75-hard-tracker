import { cx } from '../lib/ui'

interface DietCardProps {
  diet: boolean
  disabled?: boolean
  onChange: (diet: boolean) => void
}

export function DietCard({ diet, disabled = false, onChange }: DietCardProps) {
  return (
    <div className="grid gap-3 sm:content-start">
      <p className="m-0 text-[0.9rem] leading-snug text-muted">
        No cheat meals. No alcohol. Stick to your plan for the full day.
      </p>

      <div
        className="grid grid-cols-2 gap-[0.45rem]"
        role="group"
        aria-label="Diet status"
      >
        <button
          type="button"
          disabled={disabled}
          aria-pressed={diet}
          className={cx(
            'appearance-none cursor-pointer rounded-xl border px-3 py-3 text-[0.88rem] font-bold transition disabled:cursor-not-allowed disabled:opacity-55',
            diet
              ? 'border-done bg-done text-on-done shadow-[0_0_0_1px_color-mix(in_srgb,var(--done)_30%,transparent)]'
              : 'border-line bg-panel text-muted hover:border-done/40 hover:text-ink',
          )}
          onClick={() => onChange(true)}
        >
          Followed
        </button>
        <button
          type="button"
          disabled={disabled}
          aria-pressed={!diet}
          className={cx(
            'appearance-none cursor-pointer rounded-xl border px-3 py-3 text-[0.88rem] font-bold transition disabled:cursor-not-allowed disabled:opacity-55',
            !diet
              ? 'border-line bg-bg-deep text-ink'
              : 'border-line bg-panel text-muted hover:border-line hover:text-ink',
          )}
          onClick={() => onChange(false)}
        >
          Not yet
        </button>
      </div>

      <p
        className={cx(
          'm-0 rounded-xl border px-3 py-[0.7rem] text-[0.86rem] leading-snug',
          diet
            ? 'border-done/30 bg-done-soft text-done-ink'
            : 'border-line bg-bg text-muted',
        )}
      >
        {diet
          ? 'Diet locked in for today. Tap “Not yet” if you need to undo.'
          : 'Mark “Followed” once you’ve stuck to your diet for the day.'}
      </p>
    </div>
  )
}
