import './ChecklistCard.css'

interface ChecklistCardProps {
  title: string
  description: string
  done: boolean
  disabled?: boolean
  onToggle: (done: boolean) => void
}

export function ChecklistCard({
  title,
  description,
  done,
  disabled = false,
  onToggle,
}: ChecklistCardProps) {
  return (
    <article className={`checklist-card ${done ? 'is-done' : ''}`}>
      <div className="checklist-card__copy">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <label className="done-toggle">
        <input
          type="checkbox"
          checked={done}
          disabled={disabled}
          onChange={(e) => onToggle(e.target.checked)}
        />
        <span>{done ? 'Done' : 'Mark done'}</span>
      </label>
    </article>
  )
}
