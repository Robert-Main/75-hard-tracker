import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { cx } from '../lib/ui'

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
    <article
      className={cx(
        'overflow-hidden rounded-[0.9rem] border border-line bg-panel transition-[border-color,background,box-shadow] duration-180 sm:flex sm:h-full sm:flex-col',
        done
          ? 'border-done/40 border-l-4 border-l-done shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--done)_12%,transparent)]'
          : 'border-l-4 border-l-line',
      )}
    >
      <div
        className={cx(
          'flex items-start gap-[0.8rem] px-4 pb-[0.85rem] pt-[0.95rem]',
          done && 'bg-[color-mix(in_srgb,var(--done-soft)_70%,var(--panel))]',
        )}
      >
        <span
          className={cx(
            'mt-0.5 grid h-[1.7rem] w-[1.7rem] shrink-0 place-items-center rounded-full border-2 border-line bg-panel text-on-done',
            done && 'border-done bg-done shadow-[0_0_0_3px] shadow-done/22',
          )}
          aria-hidden="true"
        >
          {done ? (
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
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
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-[0.65rem]">
            <h2
              className={cx(
                'm-0 text-base font-bold',
                done && 'text-done-ink',
              )}
            >
              {title}
            </h2>
            <div className="inline-flex shrink-0 items-center gap-[0.45rem]">
              {editHref && (
                <Link
                  className="text-[0.72rem] font-bold uppercase tracking-[0.06em] text-accent no-underline hover:underline"
                  to={editHref}
                >
                  Edit
                </Link>
              )}
              <span
                className={cx(
                  'shrink-0 rounded-full border px-[0.55rem] py-[0.22rem] text-[0.68rem] font-extrabold uppercase tracking-[0.06em]',
                  done
                    ? 'border-done bg-done text-on-done'
                    : 'border-line bg-bg-deep text-muted',
                )}
              >
                {done ? 'Done' : 'To do'}
              </span>
            </div>
          </div>
          <p className="mt-1 text-[0.86rem] leading-snug text-muted">{subtitle}</p>
        </div>
      </div>
      {hasDetails && alwaysOpen && (
        <div
          className={cx(
            'grid gap-3 border-t px-4 pb-4 pt-[0.85rem]',
            done ? 'border-t-done/25' : 'border-t-line',
            'sm:flex-1',
          )}
        >
          {children}
        </div>
      )}
      {hasDetails && !alwaysOpen && (
        <details
          className={cx('border-t', done ? 'border-t-done/25' : 'border-t-line')}
          open={!done}
        >
          <summary className="cursor-pointer list-none px-4 py-[0.55rem] text-[0.8rem] font-bold text-accent-ink [&::-webkit-details-marker]:hidden">
            {done ? 'Edit task' : 'Log now'}
          </summary>
          <div className="grid gap-3 px-4 pb-4">{children}</div>
        </details>
      )}
    </article>
  )
}
