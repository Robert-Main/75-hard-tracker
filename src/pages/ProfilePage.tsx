import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getUserAvatarUrl,
  getUserDisplayName,
  useAuth,
} from '../context/AuthContext'
import { useChallenge } from '../context/ChallengeContext'
import { formatDisplayDate } from '../lib/dates'
import './ProfilePage.css'

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
    <section className="profile-page">
      <h1>Profile</h1>

      <article className="profile-hero">
        <div className="profile-avatar" aria-hidden="true">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div className="profile-hero__copy">
          <h2>{displayName}</h2>
          <p>{user?.email}</p>
          <p className="profile-hero__meta">
            Joined{' '}
            {user?.created_at
              ? formatDisplayDate(user.created_at.slice(0, 10))
              : '—'}
          </p>
        </div>
      </article>

      <article className="profile-card">
        <h2>Challenge snapshot</h2>
        <ul className="profile-stats">
          <li>
            <strong>{active ? 'Active' : 'None'}</strong>
            <span>Current challenge</span>
          </li>
          <li>
            <strong>{pastCount}</strong>
            <span>Past attempts</span>
          </li>
          <li>
            <strong>{state.workoutPreferences.length}</strong>
            <span>Saved workouts</span>
          </li>
        </ul>
      </article>

      <article className="profile-card">
        <h2>Display name</h2>
        <p className="muted">Shown in your profile. Syncs with your account.</p>
        <label className="field">
          <span>Name</span>
          <input
            type="text"
            value={name}
            disabled={busy}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="btn-primary"
          disabled={busy}
          onClick={() => void onSave()}
        >
          Save profile
        </button>
        {message && <p className="profile-message">{message}</p>}
      </article>

      <article className="profile-card">
        <h2>My workouts</h2>
        <p className="muted">
          Manage the chips on Workout #1 / #2 — add, edit, or remove your usual
          workouts.
        </p>
        <Link className="btn-secondary" to="/settings#my-workouts">
          Edit workout list
        </Link>
      </article>

      <article className="profile-card">
        <h2>Daily tasks</h2>
        <p className="muted">
          Choose which tasks show on Today, rename them, or add and delete
          personal tasks.
        </p>
        <Link className="btn-secondary" to="/settings#daily-tasks">
          Customize tasks
        </Link>
      </article>

      <article className="profile-card">
        <h2>Account</h2>
        <p className="muted">Signed in with {user?.app_metadata?.provider ?? 'email'}.</p>
        <div className="profile-actions">
          <Link className="btn-secondary" to="/settings">
            Open settings
          </Link>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => void signOut()}
          >
            Log out
          </button>
        </div>
      </article>
    </section>
  )
}
