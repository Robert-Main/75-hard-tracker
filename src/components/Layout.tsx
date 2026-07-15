import { Link, NavLink, Outlet } from 'react-router-dom'
import {
  getUserAvatarUrl,
  getUserDisplayName,
  useAuth,
} from '../context/AuthContext'
import { useChallenge } from '../context/ChallengeContext'
import { getCurrentDayIndex } from '../lib/challenge'
import { countConsecutiveStreak } from '../lib/rules'
import { formatDisplayDate } from '../lib/dates'
import { cx } from '../lib/ui'

/** Desktop / tablet with sidebar — keep high so phones never get side letterboxing. */
const DESKTOP = 'min-[1024px]'

const NAV_ITEMS: Array<{ to: string; label: string; end?: boolean }> = [
  { to: '/', end: true, label: 'Today' },
  { to: '/progress', label: 'Progress' },
  { to: '/photos', label: 'Photos' },
  { to: '/profile', label: 'Profile' },
  { to: '/settings', label: 'Settings' },
]

function PrimaryNav({
  className,
  variant,
}: {
  className: string
  variant: 'mobile' | 'desktop'
}) {
  return (
    <nav className={className} aria-label="Primary">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cx(
              'rounded-[0.55rem] px-1 py-[0.65rem] text-center text-[0.78rem] font-semibold no-underline transition-[color,background,transform] duration-160',
              variant === 'mobile' &&
                'text-muted hover:text-ink active:motion-safe:scale-[0.97]',
              variant === 'mobile' && isActive && 'bg-accent-soft text-accent',
              variant === 'desktop' &&
                'rounded-[0.7rem] px-[0.95rem] py-3.5 text-left text-[0.95rem] text-white/60 hover:bg-white/[0.06] hover:text-white',
              variant === 'desktop' &&
                isActive &&
                'bg-accent font-bold text-white',
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

const logoutBtn =
  'appearance-none cursor-pointer whitespace-nowrap rounded-full border border-line bg-panel px-3 py-[0.45rem] text-[0.78rem] font-bold text-muted transition hover:border-accent/35 hover:text-ink'

export function Layout() {
  const { user, signOut } = useAuth()
  const { state, today } = useChallenge()
  const challenge = state.activeChallenge
  const streak =
    challenge && challenge.status === 'active'
      ? countConsecutiveStreak(challenge, state.dayLogs, today)
      : 0
  const dayIndex =
    challenge && challenge.status === 'active'
      ? getCurrentDayIndex(challenge.startedAt, today)
      : null

  const displayName = getUserDisplayName(user)
  const avatarUrl = getUserAvatarUrl(user)
  const initials = displayName
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      className={cx(
        'min-h-dvh w-full max-w-[100vw] overflow-x-hidden bg-bg',
        `${DESKTOP}:grid ${DESKTOP}:grid-cols-[250px_minmax(0,1fr)]`,
      )}
    >
      <aside
        className={cx(
          'sticky top-0 hidden h-dvh flex-col overflow-hidden border-r border-ink/12 bg-sidebar text-sidebar-text',
          `${DESKTOP}:flex`,
        )}
        aria-label="App navigation"
      >
        <div className="bg-hero px-5 pb-[1.35rem] pt-[1.6rem]">
          <p className="m-0 font-display text-[2.35rem] uppercase leading-[0.95] tracking-[0.04em] text-white">
            75 Hard
          </p>
          <p className="mt-1.5 text-[0.78rem] font-bold uppercase tracking-[0.08em] text-white/80">
            Daily discipline
          </p>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-5 px-[0.85rem] py-[1.15rem]">
          <PrimaryNav className="grid gap-[0.3rem]" variant="desktop" />

          <div className="mt-auto grid gap-[0.35rem] rounded-[0.85rem] border border-white/8 bg-white/[0.06] px-4 py-[0.95rem]">
            <p className="m-0 text-[0.82rem] font-semibold text-white/55">
              {formatDisplayDate(today)}
            </p>
            {challenge && dayIndex !== null ? (
              <>
                <p className="m-0 font-display text-[1.45rem] uppercase leading-none tracking-[0.03em] text-white">
                  Day {dayIndex} / 75
                </p>
                <p className="m-0 inline-flex items-center gap-[0.35rem] text-[0.88rem] font-bold text-white/90">
                  <span aria-hidden="true">🔥</span>
                  {streak} day streak
                </p>
              </>
            ) : (
              <p className="m-0 inline-flex items-center gap-[0.35rem] text-[0.88rem] font-bold text-white/90">
                No active challenge
              </p>
            )}
          </div>

          <Link
            to="/profile"
            className="flex items-center gap-[0.7rem] rounded-[0.85rem] border border-white/8 bg-white/[0.06] px-3 py-[0.7rem] text-inherit no-underline hover:bg-white/10"
          >
            <span
              className="grid h-[2.35rem] w-[2.35rem] shrink-0 place-items-center overflow-hidden rounded-full bg-accent font-display text-[0.9rem] tracking-[0.04em] text-white"
              aria-hidden="true"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </span>
            <span className="grid min-w-0 gap-0.5">
              <strong className="truncate text-[0.9rem] text-white">
                {displayName}
              </strong>
              <span className="truncate text-[0.72rem] text-white/55">
                {user?.email}
              </span>
            </span>
          </Link>
        </div>

        <button
          type="button"
          className={cx(
            logoutBtn,
            'mx-[0.85rem] mb-4 w-[calc(100%-1.7rem)] rounded-[0.7rem] border-white/16 bg-transparent px-[0.9rem] py-3 text-[0.88rem] text-white/78 hover:border-white/35 hover:bg-white/[0.06] hover:text-white',
          )}
          onClick={() => void signOut()}
        >
          Log out
        </button>
      </aside>

      <div
        className={cx(
          'grid w-full min-w-0 max-w-none grid-rows-[auto_1fr_auto] bg-bg',
          'min-h-dvh',
          `${DESKTOP}:grid-rows-1`,
        )}
      >
        <header
          className={cx(
            'flex w-full items-start justify-between gap-4 px-4 pb-[0.35rem] pt-[1.1rem] sm:px-5',
            `${DESKTOP}:hidden`,
          )}
        >
          <div className="min-w-0">
            <p className="m-0 font-display text-[clamp(1.8rem,8vw,2.2rem)] uppercase leading-[0.95] tracking-[0.04em] text-ink">
              75 Hard
            </p>
            <p className="mt-[0.2rem] text-[0.88rem] text-muted">
              {formatDisplayDate(today)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {challenge && (
              <div
                className="inline-flex items-center gap-[0.35rem] rounded-full border border-line bg-panel px-[0.7rem] py-[0.45rem] text-[0.9rem] font-bold text-ink shadow-[0_4px_14px_rgba(0,0,0,0.04)]"
                aria-label={`${streak} day streak`}
              >
                <span className="text-[0.95rem]" aria-hidden="true">
                  🔥
                </span>
                <span>{streak}</span>
              </div>
            )}
            <Link
              to="/profile"
              className="grid h-[2.15rem] w-[2.15rem] place-items-center overflow-hidden rounded-full border border-ink/12 bg-accent font-display text-[0.85rem] tracking-[0.04em] text-on-accent no-underline"
              title="Profile"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </Link>
            <button
              type="button"
              className={logoutBtn}
              onClick={() => void signOut()}
            >
              Log out
            </button>
          </div>
        </header>

        <main
          className={cx(
            'w-full min-w-0 px-4 pb-24 pt-2 sm:px-5',
            `${DESKTOP}:mx-auto ${DESKTOP}:max-w-[1200px] ${DESKTOP}:px-[clamp(1.5rem,3vw,3rem)] ${DESKTOP}:pb-10 ${DESKTOP}:pt-8`,
            'min-[1280px]:max-w-[1280px] min-[1280px]:px-12',
          )}
        >
          <Outlet />
        </main>

        <PrimaryNav
          className={cx(
            'sticky bottom-0 grid w-full grid-cols-5 gap-1 border-t border-line bg-panel/92 px-[0.6rem] py-[0.65rem] pb-[calc(0.65rem+env(safe-area-inset-bottom))] backdrop-blur-[12px]',
            `${DESKTOP}:hidden`,
          )}
          variant="mobile"
        />
      </div>
    </div>
  )
}
