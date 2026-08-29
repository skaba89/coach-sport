/**
 * React hook that adapts to the active data store (Dexie or HTTP).
 *
 * - When the user is NOT authenticated (local mode), uses `useLiveQuery`
 *   from dexie-react-hooks for live reactivity.
 * - When the user IS authenticated (remote mode), uses a simple
 *   fetch + cache pattern that re-fetches when the auth state changes.
 *
 * Why not always use fetch? Because useLiveQuery gives us zero-boilerplate
 * reactivity for the local-only mode, where the app is fully offline.
 * In the remote mode we accept a manual revalidation trigger (the `mutate`
 * function returned by the hook).
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type FavoriteRecord, type ProfileRecord } from '../db/db'
import type { WorkoutSession } from './types'
import { getDataStore } from '../db/repository'
import { loadStoredSession } from './auth/api'
import { useAuth } from './auth/AuthContext'

// ─── Sessions ──────────────────────────────────────────────────────
interface UseSessionsResult {
  sessions: WorkoutSession[]
  isLoading: boolean
  error: Error | null
  /** Re-fetch the sessions list (no-op in local mode — useLiveQuery handles it). */
  refresh(): Promise<void>
}

export function useSessions(): UseSessionsResult {
  const { user } = useAuth()
  const isRemote = !!user

  // Local mode: useLiveQuery
  const localSessions = useLiveQuery(() => db.sessions.orderBy('startedAt').reverse().toArray(), [], undefined)

  // Remote mode: state-based
  const [remoteSessions, setRemoteSessions] = useState<WorkoutSession[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const refreshIdRef = useRef(0)

  const refresh = useCallback(async () => {
    if (!isRemote) return
    refreshIdRef.current++
    const myRefreshId = refreshIdRef.current
    setIsLoading(true)
    setError(null)
    try {
      const sessions = await getDataStore().sessions.list()
      // Defensive: API might return a non-array (error object, null, etc.)
      const safeSessions = Array.isArray(sessions) ? sessions : []
      // Skip the update if a newer refresh was triggered
      if (refreshIdRef.current === myRefreshId) {
        setRemoteSessions(safeSessions)
      }
    } catch (err) {
      if (refreshIdRef.current === myRefreshId) {
        setError(err instanceof Error ? err : new Error(String(err)))
      }
    } finally {
      if (refreshIdRef.current === myRefreshId) {
        setIsLoading(false)
      }
    }
  }, [isRemote])

  useEffect(() => {
    if (isRemote) void refresh()
  }, [isRemote, refresh])

  if (!isRemote) {
    return {
      sessions: localSessions ?? [],
      isLoading: localSessions === undefined,
      error: null,
      refresh: async () => { /* no-op: useLiveQuery handles it */ },
    }
  }

  return { sessions: remoteSessions, isLoading, error, refresh }
}

// ─── Profile ──────────────────────────────────────────────────────
interface UseProfileResult {
  profile: ProfileRecord | undefined
  isLoading: boolean
  error: Error | null
  refresh(): Promise<void>
}

export function useProfile(): UseProfileResult {
  const { user } = useAuth()
  const isRemote = !!user

  const localProfile = useLiveQuery(() => db.profile.get('me'), [], undefined)

  const [remoteProfile, setRemoteProfile] = useState<ProfileRecord | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const refreshIdRef = useRef(0)

  const refresh = useCallback(async () => {
    if (!isRemote) return
    refreshIdRef.current++
    const myRefreshId = refreshIdRef.current
    setIsLoading(true)
    setError(null)
    try {
      const p = await getDataStore().profile.get()
      if (refreshIdRef.current === myRefreshId) {
        setRemoteProfile(p)
      }
    } catch (err) {
      if (refreshIdRef.current === myRefreshId) {
        setError(err instanceof Error ? err : new Error(String(err)))
      }
    } finally {
      if (refreshIdRef.current === myRefreshId) {
        setIsLoading(false)
      }
    }
  }, [isRemote])

  useEffect(() => {
    if (isRemote) void refresh()
  }, [isRemote, refresh])

  if (!isRemote) {
    return {
      profile: localProfile,
      isLoading: localProfile === undefined,
      error: null,
      refresh: async () => {},
    }
  }

  return { profile: remoteProfile, isLoading, error, refresh }
}

// ─── Favorites (by type) ──────────────────────────────────────────
interface UseFavoritesResult {
  favorites: FavoriteRecord[]
  isLoading: boolean
  error: Error | null
  refresh(): Promise<void>
}

export function useFavorites(type: FavoriteRecord['type']): UseFavoritesResult {
  const { user } = useAuth()
  const isRemote = !!user

  const localFavorites = useLiveQuery(
    () => db.favorites.where('type').equals(type).toArray(),
    [type],
    undefined,
  )

  const [remoteFavorites, setRemoteFavorites] = useState<FavoriteRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const refreshIdRef = useRef(0)

  const refresh = useCallback(async () => {
    if (!isRemote) return
    refreshIdRef.current++
    const myRefreshId = refreshIdRef.current
    setIsLoading(true)
    setError(null)
    try {
      const list = await getDataStore().favorites.listByType(type)
      // Defensive: API might return a non-array (error object, null, etc.)
      // if the request fails. Coerce to empty array to prevent .map crashes.
      const safeList = Array.isArray(list) ? list : []
      if (refreshIdRef.current === myRefreshId) {
        setRemoteFavorites(safeList)
      }
    } catch (err) {
      if (refreshIdRef.current === myRefreshId) {
        setError(err instanceof Error ? err : new Error(String(err)))
      }
    } finally {
      if (refreshIdRef.current === myRefreshId) {
        setIsLoading(false)
      }
    }
  }, [isRemote, type])

  useEffect(() => {
    if (isRemote) void refresh()
  }, [isRemote, refresh])

  if (!isRemote) {
    return {
      favorites: localFavorites ?? [],
      isLoading: localFavorites === undefined,
      error: null,
      refresh: async () => {},
    }
  }

  return { favorites: remoteFavorites, isLoading, error, refresh }
}

// ─── Single favorite lookup ───────────────────────────────────────
/**
 * Live query for a single favorite by (type, refId). Reactive in local
 * mode, fetch-once-then-cache in remote mode.
 */
export function useFavorite(type: FavoriteRecord['type'], refId: string | undefined): {
  favorite: FavoriteRecord | undefined
  isLoading: boolean
  refresh(): Promise<void>
} {
  const { user } = useAuth()
  const isRemote = !!user

  const localFavorite = useLiveQuery(
    async () => (refId ? db.favorites.where({ type, refId }).first() : undefined),
    [type, refId],
    undefined,
  )

  const [remoteFavorite, setRemoteFavorite] = useState<FavoriteRecord | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const refreshIdRef = useRef(0)

  const refresh = useCallback(async () => {
    if (!isRemote || !refId) return
    refreshIdRef.current++
    const myRefreshId = refreshIdRef.current
    setIsLoading(true)
    try {
      const found = await getDataStore().favorites.find(type, refId)
      if (refreshIdRef.current === myRefreshId) {
        setRemoteFavorite(found)
      }
    } finally {
      if (refreshIdRef.current === myRefreshId) {
        setIsLoading(false)
      }
    }
  }, [isRemote, type, refId])

  useEffect(() => {
    if (isRemote) void refresh()
  }, [isRemote, refresh])

  if (!isRemote) {
    return { favorite: localFavorite, isLoading: localFavorite === undefined, refresh: async () => {} }
  }

  return { favorite: remoteFavorite, isLoading, refresh }
}

// ─── Re-export for convenience ────────────────────────────────────
// Used by callers that need to write data via the repository.
export { getDataStore, loadStoredSession }
