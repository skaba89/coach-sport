/**
 * Frontend API client for authentication.
 *
 * Wraps fetch() calls to /api/auth/* with:
 * - automatic JSON parsing + error normalization
 * - localStorage persistence of the session (access + refresh tokens)
 * - automatic refresh on 401 (once, then re-rejects)
 *
 * NOTE: storing tokens in localStorage is the pragmatic choice for a
 * dev environment. For the production SaaS, switch the refresh token
 * to an httpOnly cookie (set by the server) to mitigate XSS.
 */
import type { AuthSession, LoginRequest, RegisterRequest, User } from './types'

const STORAGE_KEY = 'calisthenies.auth'
// Vite middleware runs at the server root, NOT under the base URL.
// So /api/auth/* is the correct path even when the app is served at /calisthenies/.
const API_BASE = '/api/auth'

// ─── localStorage helpers ──────────────────────────────────────────
export function loadStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

export function storeSession(session: AuthSession | null) {
  if (session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

// ─── API calls ─────────────────────────────────────────────────────
async function apiCall<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => ({ error: 'parse_error', message: 'Invalid JSON response' }))
  if (!res.ok) {
    const msg = (data as { message?: string })?.message ?? 'Unknown error'
    throw new Error(msg)
  }
  return data as T
}

export async function register(req: RegisterRequest): Promise<AuthSession> {
  return apiCall<AuthSession>('/register', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

export async function login(req: LoginRequest): Promise<AuthSession> {
  return apiCall<AuthSession>('/login', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

export async function refreshSession(refreshToken: string): Promise<AuthSession> {
  return apiCall<AuthSession>('/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  })
}

export async function logout(): Promise<void> {
  // Best-effort — server is stateless, so even if this fails, the client
  // just discards its tokens locally.
  try {
    await apiCall<void>('/logout', { method: 'POST' })
  } catch {
    // ignore
  }
}

export async function fetchMe(accessToken: string): Promise<User> {
  return apiCall<User>('/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export async function deleteAccount(accessToken: string): Promise<void> {
  await apiCall<void>('/me', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

/**
 * Authenticated fetch wrapper with automatic token refresh.
 * Use this for any API call that requires authentication (e.g. future
 * GET /api/sessions).
 *
 * If the access token is expired (401), tries to refresh once with the
 * stored refresh token, then retries the original request. If the
 * refresh also fails, throws and the caller should redirect to /login.
 */
export async function authedFetch(
  path: string,
  options: RequestInit = {},
  session: AuthSession,
  onSessionRefreshed?: (s: AuthSession) => void,
): Promise<Response> {
  const doFetch = (token: string) =>
    fetch(path, {
      ...options,
      headers: {
        ...(options.headers ?? {}),
        Authorization: `Bearer ${token}`,
      },
    })

  let res = await doFetch(session.accessToken)
  if (res.status !== 401) return res

  // Try refresh
  try {
    const newSession = await refreshSession(session.refreshToken)
    storeSession(newSession)
    onSessionRefreshed?.(newSession)
    res = await doFetch(newSession.accessToken)
  } catch (err) {
    // Refresh failed — session is invalid, clear it
    storeSession(null)
    throw new Error('Session expired, please log in again')
  }
  return res
}
