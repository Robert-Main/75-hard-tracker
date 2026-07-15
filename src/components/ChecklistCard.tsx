import { cx, doneToggle, doneToggleOn, mutedText, panelCard } from '../lib/ui'

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
    <article className={cx(panelCard, 'items-start')}>
      <div>
        <h2 className="m-0 text-base font-bold">{title}</h2>
        <p className={cx(mutedText, 'mt-1 text-[0.9rem]')}>{description}</p>
      </div>
      <label className={cx(doneToggle, done && doneToggleOn)}>
        <input
          type="checkbox"
          className="h-[0.9rem] w-[0.9rem] shrink-0 accent-done disabled:cursor-not-allowed disabled:opacity-55"
          checked={done}
          disabled={disabled}
          onChange={(e) => onToggle(e.target.checked)}
        />
        <span>{done ? 'Done' : 'Mark done'}</span>
      </label>
    </article>
  )
}
