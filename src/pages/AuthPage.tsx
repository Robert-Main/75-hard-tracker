import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import './AuthPage.css'

type AuthMode = 'sign-in' | 'sign-up'

export function AuthPage() {
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const [mode, setMode] = useState<AuthMode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setMessage(null)

    const error =
      mode === 'sign-in'
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password)

    setBusy(false)
    if (error) {
      setMessage(error)
      return
    }

    if (mode === 'sign-up') {
      setMessage('Account created. Check your email if confirmation is required.')
    }
  }

  const onGoogle = async () => {
    setBusy(true)
    setMessage(null)
    const error = await signInWithGoogle()
    setBusy(false)
    if (error) setMessage(error)
  }

  return (
    <section className="auth-page">
      <div className="auth-showcase" aria-hidden="true">
        <p className="auth-showcase__kicker">75 Hard</p>
        <h2>75 days. No excuses.</h2>
        <p>
          Two workouts, strict diet, a gallon of water, ten pages, and a daily
          progress photo — synced across your devices.
        </p>
      </div>

      <div className="auth-card">
        <p className="auth-kicker">75 Hard</p>
        <h1>{mode === 'sign-in' ? 'Sign in' : 'Create account'}</h1>
        <p className="auth-lead">
          Sync your challenge, daily logs, and progress photos across devices.
        </p>

        <form className="auth-form" onSubmit={(e) => void onSubmit(e)}>
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              disabled={busy}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete={
                mode === 'sign-in' ? 'current-password' : 'new-password'
              }
              required
              minLength={6}
              value={password}
              disabled={busy}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <button type="submit" className="btn-primary auth-submit" disabled={busy}>
            {busy ? 'Submitting…' : 'Submit'}
          </button>
        </form>

        <button
          type="button"
          className="btn-secondary auth-google"
          disabled={busy}
          onClick={() => void onGoogle()}
        >
          Continue with Google
        </button>

        <p className="auth-switch">
          {mode === 'sign-in' ? 'New here?' : 'Already have an account?'}{' '}
          <button
            type="button"
            className="text-link"
            disabled={busy}
            onClick={() => {
              setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')
              setMessage(null)
            }}
          >
            {mode === 'sign-in' ? 'Create an account' : 'Sign in'}
          </button>
        </p>

        {message && <p className="auth-message">{message}</p>}
      </div>
    </section>
  )
}
