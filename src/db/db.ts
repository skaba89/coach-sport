import Dexie, { type Table } from 'dexie'
import type { UserProfile, WorkoutSession } from '../lib/types'

export interface FavoriteRecord {
  id?: number
  type: 'exercise' | 'program'
  refId: string
  ownerId?: string  // Lot 0.2: set by repository on write, filtered on read
}

export interface ProfileRecord extends UserProfile {
  id: string  // Lot 0.2: now uses ownerId as key (was hardcoded 'me')
  ownerId?: string
}

export class CalisthenicsDB extends Dexie {
  sessions!: Table<WorkoutSession & { ownerId: string }, number>
  profile!: Table<ProfileRecord, string>
  favorites!: Table<FavoriteRecord, number>

  constructor() {
    super('calisthenies-tracker')
    // v1: original schema (legacy)
    this.version(1).stores({
      sessions: '++id, startedAt, programId',
    })
    // v2: added profile + favorites
    this.version(2).stores({
      sessions: '++id, startedAt, programId',
      profile: 'id',
      favorites: '++id, type, refId',
    })
    // v3 (Lot 0.2): add ownerId index for multi-account isolation.
    // Existing data gets ownerId='anonymous' — won't be visible to
    // logged-in users (who have ownerId='user:<uuid>').
    // A migration prompt ("Importer mes données locales") can be
    // shown to claim anonymous data into a real account.
    this.version(3).stores({
      sessions: '++id, ownerId, startedAt, programId',
      profile: 'id, ownerId',
      favorites: '++id, ownerId, type, refId',
    })
    // Tag existing data as 'anonymous' on first upgrade to v3
    this.version(3).upgrade(async (tx) => {
      await tx.table('sessions').toCollection().modify((s) => {
        if (!s.ownerId) s.ownerId = 'anonymous'
      })
      await tx.table('profile').toCollection().modify((p) => {
        if (!p.ownerId) p.ownerId = 'anonymous'
      })
      await tx.table('favorites').toCollection().modify((f) => {
        if (!f.ownerId) f.ownerId = 'anonymous'
      })
    })
  }
}

export const db = new CalisthenicsDB()

/**
 * Returns the current ownerId for data isolation.
 * - When authenticated: 'user:<uuid>' (the user's ID from the JWT)
 * - When not authenticated: 'anonymous'
 *
 * All IndexedDB queries MUST filter by this ownerId to prevent
 * cross-account data leakage (Lot 0.2).
 */
export function getOwnerId(): string {
  try {
    const raw = localStorage.getItem('calisthenies.auth')
    if (!raw) return 'anonymous'
    const session = JSON.parse(raw)
    return session?.user?.id ? `user:${session.user.id}` : 'anonymous'
  } catch {
    return 'anonymous'
  }
}

/**
 * Wipe ALL local data for a specific owner.
 * Called at logout to prevent the next user from seeing the previous
 * user's data (Lot 0.2 — P0 security fix).
 */
export async function wipeLocalData(ownerId: string): Promise<void> {
  // Delete sessions belonging to this owner
  const sessions = await db.sessions.where('ownerId').equals(ownerId).toArray()
  await db.sessions.bulkDelete(sessions.map((s) => s.id!))

  // Delete profile belonging to this owner
  const profiles = await db.profile.where('ownerId').equals(ownerId).toArray()
  await db.profile.bulkDelete(profiles.map((p) => p.id))

  // Delete favorites belonging to this owner
  const favorites = await db.favorites.where('ownerId').equals(ownerId).toArray()
  await db.favorites.bulkDelete(favorites.map((f) => f.id!))

  // Clear active workout from localStorage
  localStorage.removeItem('calisthenies.active-workout')
}
