/**
 * Postgres-backed user store via Neon serverless driver.
 *
 * Used when DATABASE_URL is set in the environment. Falls back to the
 * in-memory store otherwise (dev mode).
 *
 * The Neon serverless driver uses HTTP/WebSockets over the Neon proxy,
 * which means it works in Vercel Edge Functions and Vite middleware
 * without a TCP connection — perfect for serverless deployment.
 *
 * Schema is defined in db/schema.sql. The CHECK constraints there
 * (email format, bcrypt hash length, frequency 2-6, etc.) protect
 * against invalid data even if the API validation is bypassed.
 */
import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import type { User } from '../src/lib/auth/types'
import {
  AuthConflictError,
  AuthUnauthorizedError,
  AuthValidationError,
} from './users'

// Singleton SQL tagged-template executor. Created lazily so the env
// is read at first use (not at module load — important for tests).
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

export function isPostgresEnabled(): boolean {
  const url = process.env.DATABASE_URL
  if (!url) return false
  // Only treat as Postgres if the URL starts with postgresql:// or postgres://
  // — avoids false positives when DATABASE_URL points to a SQLite file.
  return url.startsWith('postgresql://') || url.startsWith('postgres://')
}

// ─── Users ─────────────────────────────────────────────────────────
export async function pgCreateUser(email: string, password: string): Promise<User> {
  const normalized = email.trim().toLowerCase()
  if (password.length < 8) {
    throw new AuthValidationError('Password must be at least 8 characters')
  }
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(normalized)) {
    throw new AuthValidationError('Invalid email format')
  }

  // Check uniqueness BEFORE attempting insert — the unique constraint
  // would also catch it, but we want a clean 409 instead of a 500.
  const existing = await sql()`SELECT id FROM users WHERE email = ${normalized}` as Array<{ id: string }>
  if (existing.length > 0) {
    throw new AuthConflictError('Email already registered')
  }

  const passwordHash = bcrypt.hashSync(password, 10)
  const id = randomUUID()
  const rows = await sql()`
    INSERT INTO users (id, email, password_hash)
    VALUES (${id}, ${normalized}, ${passwordHash})
    RETURNING id, email, created_at
  ` as Array<{ id: string; email: string; created_at: string }>
  const row = rows[0]
  return { id: row.id, email: row.email, createdAt: row.created_at }
}

export async function pgVerifyUser(email: string, password: string): Promise<User> {
  const normalized = email.trim().toLowerCase()
  const rows = await sql()`
    SELECT id, email, password_hash, created_at
    FROM users
    WHERE email = ${normalized}
  ` as Array<{ id: string; email: string; password_hash: string; created_at: string }>
  if (rows.length === 0) {
    throw new AuthUnauthorizedError('Invalid credentials')
  }
  const row = rows[0]
  if (!bcrypt.compareSync(password, row.password_hash)) {
    throw new AuthUnauthorizedError('Invalid credentials')
  }
  return { id: row.id, email: row.email, createdAt: row.created_at }
}

export async function pgGetUserById(id: string): Promise<User | undefined> {
  const rows = await sql()`
    SELECT id, email, created_at
    FROM users
    WHERE id = ${id}
  ` as Array<{ id: string; email: string; created_at: string }>
  if (rows.length === 0) return undefined
  const row = rows[0]
  return { id: row.id, email: row.email, createdAt: row.created_at }
}

export async function pgDeleteUser(id: string): Promise<boolean> {
  // CASCADE on the foreign keys will delete profile, sessions, favorites
  // — see db/schema.sql.
  const rows = await sql()`DELETE FROM users WHERE id = ${id} RETURNING id` as Array<{ id: string }>
  return rows.length > 0
}
