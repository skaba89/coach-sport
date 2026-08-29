/**
 * Repository pattern — persistence abstraction layer.
 *
 * Two adapters:
 * - dexie (local, IndexedDB via Dexie) — used when the user is not
 *   authenticated, or when the dev wants to run the app fully offline
 * - http (remote, /api/*) — used when the user is authenticated
 *
 * The choice is made at runtime via the auth session, so the app can
 * seamlessly switch from local-only mode to SaaS mode without recompiling.
 *
 * Why introduce this abstraction now?
 * 1. Forces a clean boundary between UI/storage concerns.
 * 2. Makes the future migration testable: write a "remote" mock that
 *    implements the same interface and verify the app behaves identically.
 * 3. Lets us swap at runtime via a feature flag, so the existing local-only
 *    experience stays intact even after the SaaS API exists.
 */
import { db, type FavoriteRecord, type ProfileRecord } from './db'
import type { WorkoutSession } from '../lib/types'
import { httpDataStore } from './httpRepository'
import { loadStoredSession } from '../lib/auth/api'

export interface SessionsRepository {
  /** All sessions, newest first. */
  list(): Promise<WorkoutSession[]>
  /** Persist a new session (id is assigned by the storage layer). */
  add(session: Omit<WorkoutSession, 'id'>): Promise<number>
  /** Delete one session by id. */
  delete(id: number): Promise<void>
}

export interface ProfileRepository {
  /** The local singleton profile, or undefined if onboarding not done yet. */
  get(): Promise<ProfileRecord | undefined>
  /** Upsert the singleton profile row. */
  put(profile: ProfileRecord): Promise<void>
}

export interface FavoritesRepository {
  /** All favorites of a given type. */
  listByType(type: FavoriteRecord['type']): Promise<FavoriteRecord[]>
  /** Find one favorite by (type, refId). Returns undefined if not present. */
  find(type: FavoriteRecord['type'], refId: string): Promise<FavoriteRecord | undefined>
  /** Add a favorite. */
  add(record: Omit<FavoriteRecord, 'id'>): Promise<void>
  /** Remove a favorite by its storage id. */
  delete(id: number): Promise<void>
}

export interface DataStore {
  sessions: SessionsRepository
  profile: ProfileRepository
  favorites: FavoritesRepository
}

// ─── Dexie adapter (local-only, current behavior) ──────────────────

const dexieSessions: SessionsRepository = {
  async list() {
    return db.sessions.orderBy('startedAt').reverse().toArray()
  },
  async add(session) {
    return db.sessions.add(session as WorkoutSession)
  },
  async delete(id) {
    await db.sessions.delete(id)
  },
}

const dexieProfile: ProfileRepository = {
  async get() {
    return db.profile.get('me')
  },
  async put(profile) {
    await db.profile.put(profile)
  },
}

const dexieFavorites: FavoritesRepository = {
  async listByType(type) {
    return db.favorites.where('type').equals(type).toArray()
  },
  async find(type, refId) {
    return db.favorites.where({ type, refId }).first()
  },
  async add(record) {
    await db.favorites.add(record as FavoriteRecord)
  },
  async delete(id) {
    await db.favorites.delete(id)
  },
}

const dexieDataStore: DataStore = {
  sessions: dexieSessions,
  profile: dexieProfile,
  favorites: dexieFavorites,
}

/**
 * Returns the active data store based on the current auth state.
 *
 * - If the user has an active session (access token in localStorage),
 *   returns the HTTP adapter that talks to /api/*.
 * - Otherwise returns the local Dexie adapter — the app keeps working
 *   fully offline, just without sync.
 *
 * Note: this is read each time it's called, so a login/logout will
 * immediately reflect on the next repository call.
 */
export function getDataStore(): DataStore {
  const session = loadStoredSession()
  if (session) return httpDataStore
  return dexieDataStore
}

// Convenience properties for backward compatibility with existing callers
// that import `dataStore` directly. They proxy through getDataStore()
// so the right adapter is used per call.
export const dataStore: DataStore = {
  sessions: {
    list: () => getDataStore().sessions.list(),
    add: (s) => getDataStore().sessions.add(s),
    delete: (id) => getDataStore().sessions.delete(id),
  },
  profile: {
    get: () => getDataStore().profile.get(),
    put: (p) => getDataStore().profile.put(p),
  },
  favorites: {
    listByType: (t) => getDataStore().favorites.listByType(t),
    find: (t, r) => getDataStore().favorites.find(t, r),
    add: (r) => getDataStore().favorites.add(r),
    delete: (id) => getDataStore().favorites.delete(id),
  },
}
