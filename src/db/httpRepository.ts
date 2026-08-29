/**
 * HTTP-based adapter for the DataStore — talks to the authenticated
 * /api/sessions, /api/profile, /api/favorites endpoints.
 *
 * Used when the user is authenticated. Falls back to the Dexie adapter
 * (in repository.ts) when not authenticated.
 *
 * All methods use the `authedFetch` wrapper which auto-refreshes the
 * access token on 401.
 */
import { authedFetch, loadStoredSession, storeSession } from '../lib/auth/api'
import type { WorkoutSession } from '../lib/types'
import type { FavoriteRecord, ProfileRecord } from './db'
import type { DataStore, FavoritesRepository, ProfileRepository, SessionsRepository } from './repository'

const API = '/api'

async function authedJson<T>(path: string, init?: RequestInit): Promise<T> {
  const session = loadStoredSession()
  if (!session) throw new Error('Not authenticated')

  const res = await authedFetch(`${API}${path}`, init, session, (newSession) => {
    storeSession(newSession)
  })

  if (res.status === 204) return undefined as T
  const text = await res.text()
  if (!text) return undefined as T
  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error(`Failed to parse API response: ${text.slice(0, 100)}`)
  }
}

// ─── Sessions ──────────────────────────────────────────────────────
const httpSessions: SessionsRepository = {
  async list() {
    return authedJson<WorkoutSession[]>('/sessions')
  },
  async add(session) {
    const { id } = await authedJson<{ id: number }>('/sessions', {
      method: 'POST',
      body: JSON.stringify(session),
    })
    return id
  },
  async delete(id) {
    await authedJson<void>(`/sessions/${id}`, { method: 'DELETE' })
  },
}

// ─── Profile ──────────────────────────────────────────────────────
const httpProfile: ProfileRepository = {
  async get() {
    // API returns null when no profile exists yet — normalize to undefined
    const result = await authedJson<ProfileRecord | null>('/profile')
    return result ?? undefined
  },
  async put(profile) {
    await authedJson<ProfileRecord>('/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    })
  },
}

// ─── Favorites ─────────────────────────────────────────────────────
const httpFavorites: FavoritesRepository = {
  async listByType(type) {
    return authedJson<FavoriteRecord[]>(`/favorites?type=${encodeURIComponent(type)}`)
  },
  async find(type, refId) {
    // No dedicated endpoint — fetch the list and filter. Acceptable for
    // the small N we have (max a few hundred favorites per user).
    const all = await this.listByType(type)
    return all.find((f) => f.refId === refId)
  },
  async add(record) {
    await authedJson<FavoriteRecord>('/favorites', {
      method: 'POST',
      body: JSON.stringify(record),
    })
  },
  async delete(id) {
    await authedJson<void>(`/favorites/${id}`, { method: 'DELETE' })
  },
}

export const httpDataStore: DataStore = {
  sessions: httpSessions,
  profile: httpProfile,
  favorites: httpFavorites,
}
