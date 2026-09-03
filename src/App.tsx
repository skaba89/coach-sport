import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { NavBar } from './components/NavBar'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AuthProvider, useAuth } from './lib/auth/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { Home } from './pages/Home'
import { Explore } from './pages/Explore'
import { Programs } from './pages/Programs'
import { ProgramDetail } from './pages/ProgramDetail'
import { Exercises } from './pages/Exercises'
import { ExerciseDetail } from './pages/ExerciseDetail'
import { Workout } from './pages/Workout'
import { History } from './pages/History'
import { TimerPage } from './pages/TimerPage'
import { Onboarding } from './pages/Onboarding'
import { CoachChat } from './pages/CoachChat'
import { Challenges } from './pages/Challenges'
import { Admin } from './pages/Admin'
import { Pricing } from './pages/Pricing'
import { Skills } from './pages/Skills'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { ProfilePage } from './pages/auth/ProfilePage'

/** Routes that should NOT show the bottom NavBar. */
const HIDDEN_NAV_ROUTES = new Set(['/login', '/register'])

/**
 * Bottom NavBar visibility — uses useLocation so it reacts to route
 * changes (the previous implementation read window.location.hash once,
 * which broke on client-side navigations).
 */
function NavBarManager() {
  const location = useLocation()
  if (HIDDEN_NAV_ROUTES.has(location.pathname)) return null
  return <NavBar />
}

/**
 * Loading spinner shown while the auth state is hydrating from localStorage.
 */
function AuthLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-400"
        aria-label="Chargement"
      />
    </div>
  )
}

/**
 * Wraps /login: if the user is already authenticated, redirect to /.
 * We do NOT wrap /register with this — RegisterPage itself navigates
 * to /onboarding after a successful registration, and wrapping with
 * RedirectIfAuthed would race the redirect.
 */
function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <AuthLoadingScreen />
  if (user) return <Navigate to="/" replace />
  return <>{children}</>
}

function App() {
  return (
    <HashRouter>
      <AuthProvider>
        {/* Skip-link for keyboard navigation (WCAG 2.4.1) */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-emerald-500 focus:px-4 focus:py-2 focus:text-slate-900"
        >
          Aller au contenu principal
        </a>

        <ErrorBoundary>
          <div id="main-content">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<RedirectIfAuthed><LoginPage /></RedirectIfAuthed>} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected routes */}
              <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
              <Route path="/programs" element={<ProtectedRoute><Programs /></ProtectedRoute>} />
              <Route path="/programs/:programId" element={<ProtectedRoute><ProgramDetail /></ProtectedRoute>} />
              <Route path="/exercises" element={<ProtectedRoute><Exercises /></ProtectedRoute>} />
              <Route path="/exercises/:exerciseId" element={<ProtectedRoute><ExerciseDetail /></ProtectedRoute>} />
              <Route path="/workout" element={<ProtectedRoute><Workout /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
              <Route path="/timer" element={<ProtectedRoute><TimerPage /></ProtectedRoute>} />
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              <Route path="/coach" element={<ProtectedRoute><CoachChat /></ProtectedRoute>} />
              <Route path="/challenges" element={<ProtectedRoute><Challenges /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
              <Route path="/pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
              <Route path="/skills" element={<ProtectedRoute><Skills /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </ErrorBoundary>
        <NavBarManager />
      </AuthProvider>
    </HashRouter>
  )
}

export default App
