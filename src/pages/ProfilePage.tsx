import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getUserAvatarUrl,
  getUserDisplayName,
  useAuth,
} from '../context/AuthContext'
import { useChallenge } from '../context/ChallengeContext'
import { formatDisplayDate } from '../lib/dates'
import {
  btnPrimary,
  btnSecondary,
  cx,
  fieldInput,
  fieldLabel,
  mutedText,
  pageTitle,
  panelCard,
} from '../lib/ui'

export function ProfilePage() {
  const { user, signOut, updateProfile } = useAuth()
  const { state } = useChallenge()
  const [name, setName] = useState(() => getUserDisplayName(user))
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const avatarUrl = getUserAvatarUrl(user)
  const displayName = getUserDisplayName(user)
  const initials = displayName
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const active = state.activeChallenge
  const pastCount = state.pastChallenges.length

  const onSave = async () => {
    const next = name.trim()
    if (!next) {
      setMessage('Name cannot be empty.')
      return
    }
    setBusy(true)
    setMessage(null)
    const error = await updateProfile({ displayName: next })
    setBusy(false)
    setMessage(error ?? 'Profile updated.')
  }

  return (
    <section className="grid gap-[0.9rem] min-[900px]:max-w-[960px] min-[900px]:grid-cols-2 min-[900px]:gap-4">
      <h1 className={cx(pageTitle, 'min-[900px]:col-span-2')}>Profile</h1>

      <article className="flex items-center gap-4 rounded-2xl bg-hero p-[1.1rem] text-on-accent min-[900px]:col-span-2">
        <div
          className="grid h-[4.25rem] w-[4.25rem] shrink-0 place-items-center overflow-hidden rounded-full border-2 border-white/35 bg-black/22 font-display text-[1.5rem] tracking-[0.04em]"
          aria-hidden="true"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div>
          <h2 className="m-0 text-[1.25rem]">{displayName}</h2>
          <p className="mt-[0.2rem] text-[0.92rem] opacity-90">{user?.email}</p>
          <p className="mt-[0.2rem] text-[0.82rem] opacity-75">
            Joined{' '}
            {user?.created_at
              ? formatDisplayDate(user.created_at.slice(0, 10))
              : '—'}
          </p>
        </div>
      </article>

      <article className={panelCard}>
        <h2 className="m-0 text-base">Challenge snapshot</h2>
        <ul className="m-0 grid list-none grid-cols-3 gap-[0.55rem] p-0">
          <li className="grid gap-[0.15rem] rounded-xl border border-line bg-bg px-[0.65rem] py-[0.7rem]">
            <strong className="text-[1.05rem]">{active ? 'Active' : 'None'}</strong>
            <span className="text-[0.72rem] font-semibold text-muted">
              Current challenge
            </span>
          </li>
          <li className="grid gap-[0.15rem] rounded-xl border border-line bg-bg px-[0.65rem] py-[0.7rem]">
            <strong className="text-[1.05rem]">{pastCount}</strong>
            <span className="text-[0.72rem] font-semibold text-muted">
              Past attempts
            </span>
          </li>
          <li className="grid gap-[0.15rem] rounded-xl border border-line bg-bg px-[0.65rem] py-[0.7rem]">
            <strong className="text-[1.05rem]">
              {state.workoutPreferences.length}
            </strong>
            <span className="text-[0.72rem] font-semibold text-muted">
              Saved workouts
            </span>
          </li>
        </ul>
      </article>

      <article className={panelCard}>
        <h2 className="m-0 text-base">Display name</h2>
        <p className={cx(mutedText, 'text-[0.9rem]')}>
          Shown in your profile. Syncs with your account.
        </p>
        <label className="grid gap-[0.35rem]">
          <span className={fieldLabel}>Name</span>
          <input
            type="text"
            className={cx(fieldInput, 'bg-bg px-[0.8rem] py-[0.7rem]')}
            value={name}
            disabled={busy}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <button
          type="button"
          className={cx(btnPrimary, '!w-fit')}
          disabled={busy}
          onClick={() => void onSave()}
        >
          Save profile
        </button>
        {message && (
          <p className="m-0 text-[0.9rem] font-semibold text-accent-ink">
            {message}
          </p>
        )}
      </article>

      <article className={panelCard}>
        <h2 className="m-0 text-base">My workouts</h2>
        <p className={cx(mutedText, 'text-[0.9rem]')}>
          Manage the chips on Workout #1 / #2 — add, edit, or remove your usual
          workouts.
        </p>
        <Link className={cx(btnSecondary, '!w-fit no-underline')} to="/settings#my-workouts">
          Edit workout list
        </Link>
      </article>

      <article className={panelCard}>
        <h2 className="m-0 text-base">Daily tasks</h2>
        <p className={cx(mutedText, 'text-[0.9rem]')}>
          Choose which tasks show on Today, rename them, or add and delete
          personal tasks.
        </p>
        <Link className={cx(btnSecondary, '!w-fit no-underline')} to="/settings#daily-tasks">
          Customize tasks
        </Link>
      </article>

      <article className={panelCard}>
        <h2 className="m-0 text-base">Account</h2>
        <p className={cx(mutedText, 'text-[0.9rem]')}>
          Signed in with {user?.app_metadata?.provider ?? 'email'}.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link className={cx(btnSecondary, '!w-fit no-underline')} to="/settings">
            Open settings
          </Link>
          <button
            type="button"
            className={cx(btnSecondary, '!w-fit')}
            onClick={() => void signOut()}
          >
            Log out
          </button>
        </div>
      </article>
    </section>
  )
}
