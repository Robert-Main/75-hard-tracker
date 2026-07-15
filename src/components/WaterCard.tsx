interface WaterCardProps {
  waterOz: number
  goalOz: number
  disabled?: boolean
  onChange: (waterOz: number) => void
}

const STEPS = [8, 16, 32]

const actionBtn =
  'appearance-none cursor-pointer rounded-lg border border-line bg-panel px-[0.45rem] py-1.5 text-[0.82rem] font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-55'

export function WaterCard({
  waterOz,
  goalOz,
  disabled = false,
  onChange,
}: WaterCardProps) {
  const progress = Math.min(waterOz / goalOz, 1)

  return (
    <div className="grid gap-3">
      <div className="flex justify-between gap-2 text-[0.9rem] font-bold">
        <span>
          {waterOz} / {goalOz} oz
        </span>
        <span>{Math.round(progress * 100)}%</span>
      </div>

      <div
        className="h-[0.55rem] overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={goalOz}
        aria-valuenow={waterOz}
        aria-label="Water intake"
      >
        <span
          className="block h-full rounded-full bg-gradient-to-r from-accent-hot to-accent transition-[width] duration-[280ms]"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-4 gap-[0.45rem]">
        {STEPS.map((step) => (
          <button
            key={step}
            type="button"
            className={actionBtn}
            disabled={disabled}
            onClick={() => onChange(Math.min(goalOz + 32, waterOz + step))}
          >
            +{step}
          </button>
        ))}
        <button
          type="button"
          className={actionBtn}
          disabled={disabled || waterOz === 0}
          onClick={() => onChange(0)}
        >
          Reset
        </button>
      </div>
    </div>
  )
}
