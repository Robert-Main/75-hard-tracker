import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextValue {
  session: Session | null
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string) => Promise<string | null>
  signInWithGoogle: () => Promise<string | null>
  signOut: () => Promise<void>
  updateProfile: (patch: {
    displayName?: string
  }) => Promise<string | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    void supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session)
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error?.message ?? null
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    return error?.message ?? null
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    })
    return error?.message ?? null
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const updateProfile = useCallback(
    async (patch: { displayName?: string }) => {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          full_name: patch.displayName?.trim() || undefined,
          display_name: patch.displayName?.trim() || undefined,
        },
      })
      if (error) return error.message
      if (data.user) {
        setSession((prev) =>
          prev ? { ...prev, user: data.user } : prev,
        )
      }
      return null
    },
    [],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      updateProfile,
    }),
    [session, loading, updateProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}

export function getUserDisplayName(user: User | null): string {
  if (!user) return 'Athlete'
  const meta = user.user_metadata ?? {}
  return (
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (typeof meta.display_name === 'string' && meta.display_name) ||
    (typeof meta.name === 'string' && meta.name) ||
    user.email?.split('@')[0] ||
    'Athlete'
  )
}

export function getUserAvatarUrl(user: User | null): string | null {
  if (!user) return null
  const meta = user.user_metadata ?? {}
  const url = meta.avatar_url ?? meta.picture
  return typeof url === 'string' && url.length > 0 ? url : null
}
