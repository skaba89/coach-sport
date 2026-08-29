/**
 * In-memory user store for the dev server.
 *
 * ⚠️ This is a DEV-ONLY store — data is lost on server restart. For
 * production, swap this for the Neon Postgres `users` + `subscriptions`
 * tables defined in db/schema.sql. The interface is intentionally small
 * so the swap is straightforward.
 *
 * Passwords are hashed with bcrypt (10 rounds) — never stored in plain text.
 * The hash is also never returned by any API method.
 */
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import type { User } from '../src/lib/auth/types'

interface StoredUser extends User {
  passwordHash: string
}

const users = new Map<string, StoredUser>() // keyed by email (lowercased)
const byId = new Map<string, StoredUser>()

export function createUser(email: string, password: string): User {
  const normalized = email.trim().toLowerCase()
  if (users.has(normalized)) {
    throw new AuthConflictError('Email already registered')
  }
  if (password.length < 8) {
    throw new AuthValidationError('Password must be at least 8 characters')
  }
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(normalized)) {
    throw new AuthValidationError('Invalid email format')
  }
  const passwordHash = bcrypt.hashSync(password, 10)
  const user: StoredUser = {
    id: randomUUID(),
    email: normalized,
    createdAt: new Date().toISOString(),
    passwordHash,
  }
  users.set(normalized, user)
  byId.set(user.id, user)
  return sanitize(user)
}

export function verifyUser(email: string, password: string): User {
  const normalized = email.trim().toLowerCase()
  const user = users.get(normalized)
  if (!user) {
    throw new AuthUnauthorizedError('Invalid credentials')
  }
  if (!bcrypt.compareSync(password, user.passwordHash)) {
    throw new AuthUnauthorizedError('Invalid credentials')
  }
  return sanitize(user)
}

export function getUserById(id: string): User | undefined {
  const u = byId.get(id)
  return u ? sanitize(u) : undefined
}

export function deleteUser(id: string): boolean {
  const user = byId.get(id)
  if (!user) return false
  byId.delete(id)
  users.delete(user.email)
  return true
}

function sanitize(u: StoredUser): User {
  return { id: u.id, email: u.email, createdAt: u.createdAt }
}

// ─── Error classes ──────────────────────────────────────────────────
export class AuthValidationError extends Error {
  status = 400
  constructor(message: string) { super(message) }
}
export class AuthUnauthorizedError extends Error {
  status = 401
  constructor(message: string) { super(message) }
}
export class AuthConflictError extends Error {
  status = 409
  constructor(message: string) { super(message) }
}
export class AuthNotFoundError extends Error {
  status = 404
  constructor(message: string) { super(message) }
}
