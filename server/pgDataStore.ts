/**
 * Postgres-backed data store for user-scoped data: sessions, profile,
 * favorites.
 *
 * Used when DATABASE_URL is set. Mirrors the API of server/dataStore.ts
 * (in-memory) — callers don't change.
 *
 * All queries are scoped by userId — no cross-user leak possible.
 * The Postgres schema (db/schema.sql) also has CASCADE on user_id
 * FKs so deleting a user cleans up all their data automatically.
 */
import { neon } from '@neondatabase/serverless'
import { randomUUID } from 'crypto'
import type { WorkoutSession } from '../src/lib/types'
import type { FavoriteRecord, ProfileRecord } from '../src/db/db'

let _sql: ReturnType<typeof neon> | null = null
function sql() {
  if (!_sql) {
    const url = process.env.DATABASE_URL
    if (!url) {
      throw new Error('DATABASE_URL is not set — cannot use Postgres adapter')
    }
    _sql = neon(url)
  }
  return _sql
}

// Cast helper: neon's return type is a complex union that TypeScript
// can't index. All our queries return an array of row objects.
// Using `as unknown as T[]` to force the cast through.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function asRows<T>(rows: any): T[] {
  return rows as T[]
}

// ─── Sessions ──────────────────────────────────────────────────────
export async function pgListSessions(userId: string): Promise<WorkoutSession[]> {
  const rows = asRows<{
    id: string; program_id: string | null; day_name: string;
    started_at: string; finished_at: string | null; rpe: string | null; notes: string | null;
  }>(await sql()`
    SELECT id, program_id, day_name, started_at, finished_at, rpe, notes
    FROM workout_sessions
    WHERE user_id = ${userId}
    ORDER BY started_at DESC
  `)
  // For each session, fetch its set_logs
  const sessions: WorkoutSession[] = []
  for (const row of rows) {
    const logs = asRows<{
      exercise_id: string; set_index: number; reps: number;
      weight_kg: string | null; completed: boolean;
    }>(await sql()`
      SELECT exercise_id, set_index, reps, weight_kg, completed
      FROM set_logs
      WHERE session_id = ${row.id}
      ORDER BY set_index ASC
    `)
    sessions.push({
      id: hashToNumber(row.id),
      programId: row.program_id ?? undefined,
      dayName: row.day_name,
      startedAt: row.started_at,
      finishedAt: row.finished_at ?? undefined,
      rpe: (row.rpe as WorkoutSession['rpe']) ?? undefined,
      notes: row.notes ?? undefined,
      logs: logs.map((l) => ({
        exerciseId: l.exercise_id,
        setIndex: l.set_index,
        reps: l.reps,
        weightKg: l.weight_kg ? Number(l.weight_kg) : undefined,
        completed: l.completed,
      })),
    })
  }
  return sessions
}

export async function pgAddSession(
  userId: string,
  session: Omit<WorkoutSession, 'id'>,
): Promise<number> {
  const id = randomUUID()
  // Insert the session
  await sql()`
    INSERT INTO workout_sessions (id, user_id, program_id, day_name, started_at, finished_at, rpe, notes)
    VALUES (
      ${id},
      ${userId},
      ${session.programId ?? null},
      ${session.dayName},
      ${session.startedAt},
      ${session.finishedAt ?? null},
      ${session.rpe ?? null},
      ${session.notes ?? null}
    )
  `
  // Insert the set_logs
  for (const log of session.logs) {
    await sql()`
      INSERT INTO set_logs (session_id, exercise_id, set_index, reps, weight_kg, completed)
      VALUES (
        ${id},
        ${log.exerciseId},
        ${log.setIndex},
        ${log.reps},
        ${log.weightKg ?? null},
        ${log.completed}
      )
    `
  }
  return hashToNumber(id)
}

export async function pgDeleteSession(userId: string, sessionId: number): Promise<boolean> {
  // Check ownership before delete (the WHERE clause scopes by user_id)
  const realId = reverseHash(sessionId)
  if (!realId) return false
  const rows = asRows<{ id: string }>(await sql()`
    DELETE FROM workout_sessions
    WHERE id = ${realId} AND user_id = ${userId}
    RETURNING id
  `)
  return rows.length > 0
}

// ─── Profile ──────────────────────────────────────────────────────
export async function pgGetProfile(userId: string): Promise<ProfileRecord | undefined> {
  const rows = asRows<{
    goal: string | null; level: string | null; frequency: number | null;
    duration_minutes: number | null; equipment: string | null;
    preferences: string[] | null; back_safety_cleared_at: string | null;
  }>(await sql()`
    SELECT goal, level, frequency, duration_minutes, equipment, preferences,
           back_safety_cleared_at, created_at, updated_at
    FROM profiles
    WHERE user_id = ${userId}
  `)
  if (rows.length === 0) return undefined
  const row = rows[0]
  return {
    id: 'me',
    goal: row.goal as ProfileRecord['goal'],
    level: row.level as ProfileRecord['level'],
    frequency: row.frequency ?? 3,
    durationMinutes: row.duration_minutes ?? 20,
    equipment: row.equipment as ProfileRecord['equipment'],
    preferences: (row.preferences ?? []) as ProfileRecord['preferences'],
    backSafetyClearedAt: row.back_safety_cleared_at ?? undefined,
  }
}

export async function pgPutProfile(userId: string, profile: ProfileRecord): Promise<void> {
  // Upsert — the profiles table has user_id as PK so this works
  await sql()`
    INSERT INTO profiles (
      user_id, goal, level, frequency, duration_minutes, equipment,
      preferences, back_safety_cleared_at
    )
    VALUES (
      ${userId},
      ${profile.goal},
      ${profile.level},
      ${profile.frequency},
      ${profile.durationMinutes},
      ${profile.equipment},
      ${profile.preferences},
      ${profile.backSafetyClearedAt ?? null}
    )
    ON CONFLICT (user_id) DO UPDATE SET
      goal = EXCLUDED.goal,
      level = EXCLUDED.level,
      frequency = EXCLUDED.frequency,
      duration_minutes = EXCLUDED.duration_minutes,
      equipment = EXCLUDED.equipment,
      preferences = EXCLUDED.preferences,
      back_safety_cleared_at = EXCLUDED.back_safety_cleared_at,
      updated_at = now()
  `
}

// ─── Favorites ─────────────────────────────────────────────────────
export async function pgListFavorites(
  userId: string,
  type: FavoriteRecord['type'],
): Promise<FavoriteRecord[]> {
  const rows = asRows<{ id: string; ref_id: string }>(await sql()`
    SELECT id, ref_id
    FROM favorites
    WHERE user_id = ${userId} AND type = ${type}
    ORDER BY created_at DESC
  `)
  return rows.map((row) => ({
    id: hashToNumber(row.id),
    type,
    refId: row.ref_id,
  }))
}

export async function pgFindFavorite(
  userId: string,
  type: FavoriteRecord['type'],
  refId: string,
): Promise<FavoriteRecord | undefined> {
  const rows = asRows<{ id: string }>(await sql()`
    SELECT id
    FROM favorites
    WHERE user_id = ${userId} AND type = ${type} AND ref_id = ${refId}
  `)
  if (rows.length === 0) return undefined
  const row = rows[0]
  return { id: hashToNumber(row.id), type, refId }
}

export async function pgAddFavorite(
  userId: string,
  record: Omit<FavoriteRecord, 'id'>,
): Promise<number> {
  const id = randomUUID()
  await sql()`
    INSERT INTO favorites (id, user_id, type, ref_id)
    VALUES (${id}, ${userId}, ${record.type}, ${record.refId})
    ON CONFLICT (user_id, type, ref_id) DO NOTHING
  `
  return hashToNumber(id)
}

export async function pgDeleteFavorite(userId: string, favoriteId: number): Promise<boolean> {
  const realId = reverseHash(favoriteId)
  if (!realId) return false
  const rows = asRows<{ id: string }>(await sql()`
    DELETE FROM favorites
    WHERE id = ${realId} AND user_id = ${userId}
    RETURNING id
  `)
  return rows.length > 0
}

// ─── Cascade ──────────────────────────────────────────────────────
// No need to implement deleteAllUserData — Postgres CASCADE on the
// user_id FKs handles it automatically when a user is deleted.

// ─── Hash helpers (mirror of server/dataStore.ts) ────────────────
// The frontend uses numeric IDs. We hash the Postgres UUID to a number
// for the client contract, and reverse it on delete.
const hashCache = new Map<number, string>()

function hashToNumber(uuid: string): number {
  let hash = 0
  for (let i = 0; i < uuid.length; i++) {
    hash = (hash * 31 + uuid.charCodeAt(i)) | 0
  }
  hash = Math.abs(hash)
  while (hashCache.has(hash) && hashCache.get(hash) !== uuid) {
    hash++
  }
  hashCache.set(hash, uuid)
  return hash
}

function reverseHash(n: number): string | undefined {
  return hashCache.get(n)
}
