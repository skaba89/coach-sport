/**
 * In-memory data store for user-scoped data: workout sessions, profile,
 * favorites.
 *
 * ⚠️ DEV-ONLY — same caveat as users.ts: data is lost on server restart.
 * For production, swap each method for a Postgres query against the
 * tables in db/schema.sql. The interfaces are intentionally identical
 * to what's exposed by src/db/repository.ts on the frontend so the
 * swap is a 1:1 port.
 *
 * All data is scoped by userId — no cross-user leaks possible.
 *
 * Concurrency: Node is single-threaded for JS, so the Map operations
 * here are atomic. For Postgres, use transactions with SELECT FOR UPDATE
 * on the profile upsert.
 */
import { randomUUID } from 'crypto'
import type { WorkoutSession } from '../src/lib/types'
import type { FavoriteRecord, ProfileRecord } from '../src/db/db'

// Use string IDs (UUIDs) on the server, even though the local Dexie
// schema uses number IDs. The repository on the frontend adapts.
interface ServerSession extends Omit<WorkoutSession, 'id'> {
  id: string
  userId: string
}
interface ServerFavorite extends Omit<FavoriteRecord, 'id'> {
  id: string
  userId: string
}
interface ServerProfile extends ProfileRecord {
  userId: string
}

// ─── Per-user in-memory storage ────────────────────────────────────
// Map<userId, Map<sessionId, ServerSession>>
const sessionsByUser = new Map<string, Map<string, ServerSession>>()
const profilesByUser = new Map<string, ServerProfile>()
// Map<userId, Map<favoriteId, ServerFavorite>>
const favoritesByUser = new Map<string, Map<string, ServerFavorite>>

function userSessions(userId: string): Map<string, ServerSession> {
  let m = sessionsByUser.get(userId)
  if (!m) {
    m = new Map()
    sessionsByUser.set(userId, m)
  }
  return m
}

function userFavorites(userId: string): Map<string, ServerFavorite> {
  let m = favoritesByUser.get(userId)
  if (!m) {
    m = new Map()
    favoritesByUser.set(userId, m)
  }
  return m
}

// ─── Sessions ──────────────────────────────────────────────────────
export function listSessions(userId: string): WorkoutSession[] {
  const sessions = [...userSessions(userId).values()]
  // Sort by startedAt desc (newest first) — same as the frontend Dexie query
  sessions.sort((a, b) =>
    new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  )
  // Strip userId + convert id to number for client compat
  // (Dexie returns number ids; the frontend treats them as opaque)
  return sessions.map((s) => {
    const { userId: _u, id, ...rest } = s
    return { id: hashToNumber(id), ...rest }
  })
}

export function addSession(
  userId: string,
  session: Omit<WorkoutSession, 'id'>,
): number {
  const id = randomUUID()
  const stored: ServerSession = { ...session, id, userId }
  userSessions(userId).set(id, stored)
  return hashToNumber(id)
}

export function deleteSession(userId: string, sessionId: number): boolean {
  const map = userSessions(userId)
  const realId = reverseHash(sessionId)
  if (!realId || !map.has(realId)) return false
  map.delete(realId)
  return true
}

// ─── Profile ──────────────────────────────────────────────────────
export function getProfile(userId: string): ProfileRecord | undefined {
  const p = profilesByUser.get(userId)
  if (!p) return undefined
  const { userId: _u, ...rest } = p
  return rest
}

export function putProfile(userId: string, profile: ProfileRecord): void {
  profilesByUser.set(userId, { ...profile, userId })
}

export function deleteProfile(userId: string): boolean {
  return profilesByUser.delete(userId)
}

// ─── Favorites ─────────────────────────────────────────────────────
export function listFavorites(
  userId: string,
  type: FavoriteRecord['type'],
): FavoriteRecord[] {
  const all = [...userFavorites(userId).values()]
  return all
    .filter((f) => f.type === type)
    .map((f) => {
      const { userId: _u, id, ...rest } = f
      return { id: hashToNumber(id), ...rest }
    })
}

export function findFavorite(
  userId: string,
  type: FavoriteRecord['type'],
  refId: string,
): FavoriteRecord | undefined {
  const all = [...userFavorites(userId).values()]
  const found = all.find((f) => f.type === type && f.refId === refId)
  if (!found) return undefined
  const { userId: _u, id, ...rest } = found
  return { id: hashToNumber(id), ...rest }
}

export function addFavorite(
  userId: string,
  record: Omit<FavoriteRecord, 'id'>,
): number {
  const id = randomUUID()
  const stored: ServerFavorite = { ...record, id, userId }
  userFavorites(userId).set(id, stored)
  return hashToNumber(id)
}

export function deleteFavorite(userId: string, favoriteId: number): boolean {
  const map = userFavorites(userId)
  const realId = reverseHash(favoriteId)
  if (!realId || !map.has(realId)) return false
  map.delete(realId)
  return true
}

// ─── Cascading delete (when a user account is deleted) ───────────
export function deleteAllUserData(userId: string): void {
  sessionsByUser.delete(userId)
  favoritesByUser.delete(userId)
  profilesByUser.delete(userId)
}

// ─── ID conversion helpers ─────────────────────────────────────────
//
// The frontend uses numeric IDs (legacy Dexie auto-increment). To
// preserve the contract, we hash the server UUID to a number for the
// client, and reverse it on delete. This is NOT cryptographically
// secure — it's only to keep the API contract stable.
//
// Future cleanup: change the frontend WorkoutSession.id and FavoriteRecord.id
// types to string, then drop this.

const hashCache = new Map<number, string>()  // number-hash → string-uuid (for reverseHash)

function hashToNumber(uuid: string): number {
  // Use a stable hash from the UUID string
  let hash = 0
  for (let i = 0; i < uuid.length; i++) {
    hash = (hash * 31 + uuid.charCodeAt(i)) | 0
  }
  // Ensure positive
  hash = Math.abs(hash)
  // Avoid collision: if the hash slot is taken by a different uuid, bump
  while (hashCache.has(hash) && hashCache.get(hash) !== uuid) {
    hash++
  }
  hashCache.set(hash, uuid)
  return hash
}

function reverseHash(n: number): string | undefined {
  return hashCache.get(n)
}
