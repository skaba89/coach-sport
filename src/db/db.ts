import Dexie, { type Table } from 'dexie'
import type { UserProfile, WorkoutSession } from '../lib/types'

export interface FavoriteRecord {
  id?: number
  type: 'exercise' | 'program'
  refId: string
}

export interface ProfileRecord extends UserProfile {
  id: 'me' // singleton row — this app has exactly one local user
}

export class CalisthenicsDB extends Dexie {
  sessions!: Table<WorkoutSession, number>
  profile!: Table<ProfileRecord, string>
  favorites!: Table<FavoriteRecord, number>

  constructor() {
    super('calisthenics-tracker')
    // v1 kept as-is: existing installs upgrade in place, no data loss.
    this.version(1).stores({
      sessions: '++id, startedAt, programId',
    })
    // v2 only adds stores — sessions untouched.
    this.version(2).stores({
      sessions: '++id, startedAt, programId',
      profile: 'id',
      favorites: '++id, type, refId',
    })
  }
}

export const db = new CalisthenicsDB()
