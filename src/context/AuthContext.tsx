import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  fetchMe,
  login as loginRequest,
  logout as logoutRequest,
  refreshSession,
  type User,
} from '@/api/auth'
import { setAccessToken } from '@/api/tokenStore'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthContextValue {
  user: User | null
  status: AuthStatus
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      const token = await refreshSession().catch(() => null)
      if (cancelled) return
      if (!token) {
        setStatus('unauthenticated')
        return
      }
      setAccessToken(token)
      try {
        const me = await fetchMe()
        if (cancelled) return
        setUser(me)
        setStatus('authenticated')
      } catch {
        if (!cancelled) setStatus('unauthenticated')
      }
    }

    bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  async function login(email: string, password: string) {
    const result = await loginRequest(email, password)
    setAccessToken(result.accessToken)
    setUser(result.user)
    setStatus('authenticated')
  }

  async function logout() {
    await logoutRequest().catch(() => {})
    setAccessToken(null)
    setUser(null)
    setStatus('unauthenticated')
  }

  return (
    <AuthContext.Provider value={{ user, status, login, logout }}>{children}</AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
