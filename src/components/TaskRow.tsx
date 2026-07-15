import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import './TaskRow.css'

interface TaskRowProps {
  title: string
  subtitle: string
  done: boolean
  children?: ReactNode
  /** Keep the editor open so any task can be edited anytime. */
  alwaysOpen?: boolean
  editHref?: string
}

export function TaskRow({
  title,
  subtitle,
  done,
  children,
  alwaysOpen = true,
  editHref,
}: TaskRowProps) {
  const hasDetails = Boolean(children)

  return (
    <article className={`task-row ${done ? 'is-done' : 'is-pending'}`}>
      <div className="task-row__head">
        <span
          className={`task-row__check ${done ? 'is-done' : ''}`}
          aria-hidden="true"
        >
          {done ? (
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M5 10.5 8.2 13.8 15 6.5"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : null}
        </span>
        <div className="task-row__copy">
          <div className="task-row__title-row">
            <h2>{title}</h2>
            <div className="task-row__actions">
              {editHref && (
                <Link className="task-row__edit" to={editHref}>
                  Edit
                </Link>
              )}
              <span className={`task-row__badge ${done ? 'is-done' : ''}`}>
                {done ? 'Done' : 'To do'}
              </span>
            </div>
          </div>
          <p>{subtitle}</p>
        </div>
      </div>
      {hasDetails && alwaysOpen && (
        <div className="task-row__body task-row__body--open">{children}</div>
      )}
      {hasDetails && !alwaysOpen && (
        <details className="task-row__details" open={!done}>
          <summary>{done ? 'Edit task' : 'Log now'}</summary>
          <div className="task-row__body">{children}</div>
        </details>
      )}
    </article>
  )
}
