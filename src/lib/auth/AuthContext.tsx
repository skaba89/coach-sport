/**
 * Authentication store + React context.
 *
 * Holds the current AuthSession (or null) and exposes methods to
 * register, login, logout, and delete the account.
 *
 * On mount, hydrates from localStorage. If a session is found, attempts
 * to validate it by calling /api/auth/me — if it fails, attempts a
 * refresh; if that also fails, clears the session.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AuthSession, LoginRequest, RegisterRequest, User } from './types'
import {
  deleteAccount as apiDeleteAccount,
  fetchMe,
  loadStoredSession,
  login as apiLogin,
  logout as apiLogout,
  refreshSession,
  register as apiRegister,
  storeSession,
} from './api'

interface AuthContextValue {
  /** The current user, or null if not authenticated. */
  user: User | null
  /** The full session (includes tokens) — null if not authenticated. */
  session: AuthSession | null
  /** True until the initial hydration from localStorage completes. */
  isLoading: boolean
  /** Error message from the last failed auth action, or null. */
  error: string | null

  register(req: RegisterRequest): Promise<void>
  login(req: LoginRequest): Promise<void>
  logout(): Promise<void>
  deleteAccount(): Promise<void>
  clearError(): void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => setError(null), [])

  // Hydrate from localStorage on mount
  useEffect(() => {
    let cancelled = false
    async function hydrate() {
      const stored = loadStoredSession()
      if (!stored) {
        if (!cancelled) setIsLoading(false)
        return
      }
      try {
        const me = await fetchMe(stored.accessToken)
        if (cancelled) return
        setSession(stored)
        setUser(me)
      } catch {
        // Access token expired — try refresh
        try {
          const refreshed = await refreshSession(stored.refreshToken)
          if (cancelled) return
          setSession(refreshed)
          setUser(refreshed.user)
          storeSession(refreshed)
        } catch {
          if (cancelled) return
          storeSession(null)
          setSession(null)
          setUser(null)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    void hydrate()
    return () => { cancelled = true }
  }, [])

  const register = useCallback(async (req: RegisterRequest) => {
    setError(null)
    try {
      const s = await apiRegister(req)
      setSession(s)
      setUser(s.user)
      storeSession(s)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed'
      setError(msg)
      throw new Error(msg)
    }
  }, [])

  const login = useCallback(async (req: LoginRequest) => {
    setError(null)
    try {
      const s = await apiLogin(req)
      setSession(s)
      setUser(s.user)
      storeSession(s)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      setError(msg)
      throw new Error(msg)
    }
  }, [])

  const logout = useCallback(async () => {
    if (session) {
      await apiLogout()
    }
    storeSession(null)
    setSession(null)
    setUser(null)
  }, [session])

  const deleteAccount = useCallback(async () => {
    if (!session) throw new Error('Not authenticated')
    await apiDeleteAccount(session.accessToken)
    storeSession(null)
    setSession(null)
    setUser(null)
  }, [session])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    session,
    isLoading,
    error,
    register,
    login,
    logout,
    deleteAccount,
    clearError,
  }), [user, session, isLoading, error, register, login, logout, deleteAccount, clearError])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return ctx
}
