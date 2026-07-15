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
import './Layout.css'

const NAV_ITEMS: Array<{ to: string; label: string; end?: boolean }> = [
  { to: '/', end: true, label: 'Today' },
  { to: '/progress', label: 'Progress' },
  { to: '/photos', label: 'Photos' },
  { to: '/profile', label: 'Profile' },
  { to: '/settings', label: 'Settings' },
]

function PrimaryNav({ className }: { className: string }) {
  return (
    <nav className={className} aria-label="Primary">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => (isActive ? 'tab active' : 'tab')}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

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
    <div className="app-shell">
      <aside className="desktop-sidebar" aria-label="App navigation">
        <div className="desktop-sidebar__hero">
          <p className="brand">75 Hard</p>
          <p className="brand-sub">Daily discipline</p>
        </div>

        <div className="desktop-sidebar__body">
          <PrimaryNav className="desktop-nav" />

          <div className="desktop-status">
            <p className="desktop-status__date">{formatDisplayDate(today)}</p>
            {challenge && dayIndex !== null ? (
              <>
                <p className="desktop-status__day">Day {dayIndex} / 75</p>
                <p className="desktop-status__streak">
                  <span aria-hidden="true">🔥</span>
                  {streak} day streak
                </p>
              </>
            ) : (
              <p className="desktop-status__streak">No active challenge</p>
            )}
          </div>

          <Link to="/profile" className="desktop-user">
            <span className="desktop-user__avatar" aria-hidden="true">
              {avatarUrl ? <img src={avatarUrl} alt="" /> : initials}
            </span>
            <span className="desktop-user__meta">
              <strong>{displayName}</strong>
              <span>{user?.email}</span>
            </span>
          </Link>
        </div>

        <button
          type="button"
          className="btn-logout desktop-logout"
          onClick={() => void signOut()}
        >
          Log out
        </button>
      </aside>

      <div className="shell">
        <header className="topbar">
          <div>
            <p className="brand">75 Hard</p>
            <p className="brand-sub">{formatDisplayDate(today)}</p>
          </div>
          <div className="topbar-actions">
            {challenge && (
              <div className="streak-pill" aria-label={`${streak} day streak`}>
                <span className="streak-pill__flame" aria-hidden="true">
                  🔥
                </span>
                <span>{streak}</span>
              </div>
            )}
            <Link to="/profile" className="topbar-avatar" title="Profile">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" />
              ) : (
                <span>{initials}</span>
              )}
            </Link>
            <button
              type="button"
              className="btn-logout"
              onClick={() => void signOut()}
            >
              Log out
            </button>
          </div>
        </header>

        <main className="main">
          <Outlet />
        </main>

        <PrimaryNav className="tabbar" />
      </div>
    </div>
  )
}
