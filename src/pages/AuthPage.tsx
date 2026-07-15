import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  btnGhost,
  btnPrimary,
  btnSecondary,
  cx,
  fieldInput,
} from '../lib/ui'

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
    <section className="grid min-h-dvh place-items-center p-6 min-[900px]:grid-cols-[minmax(0,1.15fr)_minmax(360px,440px)] min-[900px]:place-items-stretch min-[900px]:p-0">
      <div
        className="hidden content-center gap-4 bg-hero p-[clamp(2rem,5vw,4rem)] text-on-accent min-[900px]:grid min-[900px]:min-h-dvh"
        aria-hidden="true"
      >
        <p className="m-0 text-[0.82rem] font-bold uppercase tracking-[0.14em] opacity-90">
          75 Hard
        </p>
        <h2 className="m-0 max-w-[12ch] font-display text-[clamp(2.8rem,5vw,4.5rem)] uppercase leading-[0.95] tracking-[0.03em]">
          75 days. No excuses.
        </h2>
        <p className="m-0 max-w-[38ch] text-[1.02rem] leading-normal opacity-95">
          Two workouts, strict diet, a gallon of water, ten pages, and a daily
          progress photo — synced across your devices.
        </p>
      </div>

      <div className="w-full max-w-[26rem] rounded-2xl border border-line bg-panel p-6 shadow-[0_12px_40px_rgba(0,0,0,0.12)] min-[900px]:m-8 min-[900px]:self-center min-[900px]:justify-self-center min-[900px]:shadow-[0_20px_50px_rgba(0,0,0,0.14)]">
        <p className="mb-2 text-[0.85rem] font-bold uppercase tracking-[0.08em] text-accent">
          75 Hard
        </p>
        <h1 className="mb-2 mt-0">
          {mode === 'sign-in' ? 'Sign in' : 'Create account'}
        </h1>
        <p className="mb-5 mt-0 text-muted">
          Sync your challenge, daily logs, and progress photos across devices.
        </p>

        <form className="grid gap-[0.85rem]" onSubmit={(e) => void onSubmit(e)}>
          <label className="grid gap-[0.35rem] text-[0.9rem] font-semibold">
            Email
            <input
              type="email"
              className={cx(fieldInput, 'px-3 py-[0.65rem]')}
              autoComplete="email"
              required
              value={email}
              disabled={busy}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="grid gap-[0.35rem] text-[0.9rem] font-semibold">
            Password
            <input
              type="password"
              className={cx(fieldInput, 'px-3 py-[0.65rem]')}
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

          <button
            type="submit"
            className={cx(btnPrimary, 'mt-1 w-full')}
            disabled={busy}
          >
            {busy ? 'Submitting…' : 'Submit'}
          </button>
        </form>

        <button
          type="button"
          className={cx(btnSecondary, 'mt-3 w-full')}
          disabled={busy}
          onClick={() => void onGoogle()}
        >
          Continue with Google
        </button>

        <p className="mt-4 text-center text-muted">
          {mode === 'sign-in' ? 'New here?' : 'Already have an account?'}{' '}
          <button
            type="button"
            className={btnGhost}
            disabled={busy}
            onClick={() => {
              setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')
              setMessage(null)
            }}
          >
            {mode === 'sign-in' ? 'Create an account' : 'Sign in'}
          </button>
        </p>

        {message && (
          <p className="mt-4 text-[0.92rem] text-accent">{message}</p>
        )}
      </div>
    </section>
  )
}
