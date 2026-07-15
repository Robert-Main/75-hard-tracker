import './ChecklistCard.css'

interface WaterCardProps {
  waterOz: number
  goalOz: number
  disabled?: boolean
  onChange: (waterOz: number) => void
}

const STEPS = [8, 16, 32]

export function WaterCard({
  waterOz,
  goalOz,
  disabled = false,
  onChange,
}: WaterCardProps) {
  const progress = Math.min(waterOz / goalOz, 1)

  return (
    <div className="task-editor">
      <div className="water-stats">
        <span>
          {waterOz} / {goalOz} oz
        </span>
        <span>{Math.round(progress * 100)}%</span>
      </div>

      <div
        className="water-meter"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={goalOz}
        aria-valuenow={waterOz}
        aria-label="Water intake"
      >
        <span style={{ width: `${progress * 100}%` }} />
      </div>

      <div className="water-actions">
        {STEPS.map((step) => (
          <button
            key={step}
            type="button"
            disabled={disabled}
            onClick={() => onChange(Math.min(goalOz + 32, waterOz + step))}
          >
            +{step}
          </button>
        ))}
        <button
          type="button"
          disabled={disabled || waterOz === 0}
          onClick={() => onChange(0)}
        >
          Reset
        </button>
      </div>
    </div>
  )
}
