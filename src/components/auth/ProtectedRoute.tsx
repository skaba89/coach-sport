import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../lib/auth/AuthContext'

/**
 * Wraps a route to require authentication.
 *
 * - While the auth state is loading, shows a tiny spinner so we don't
 *   flash the login page before hydration completes.
 * - If not authenticated, redirects to /login and remembers the
 *   intended destination via `location.state.from` so we can send
 *   the user back after a successful login.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-400" aria-label="Chargement" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <>{children}</>
}
