/**
 * Storage adapters — switches between in-memory (dev) and Postgres (prod)
 * based on the presence of DATABASE_URL.
 *
 * The frontend never knows which adapter is in use — the interfaces
 * are identical (the Postgres versions are just async).
 *
 * For Postgres, all methods are async (network I/O). For in-memory,
 * the methods are sync — we wrap them in Promise.resolve() so the
 * caller code can `await` uniformly.
 *
 * This is the bridge between the dev server (Vite middleware) and the
 * production serverless deployment (Vercel Functions).
 */
import { isPostgresEnabled } from './pgUsers'

import {
  createUser as memCreateUser,
  verifyUser as memVerifyUser,
  getUserById as memGetUserById,
  deleteUser as memDeleteUser,
} from './users'

import {
  pgCreateUser, pgVerifyUser, pgGetUserById, pgDeleteUser,
} from './pgUsers'

import type { User } from '../src/lib/auth/types'

// ─── Users ─────────────────────────────────────────────────────────
export const usersAdapter = {
  async create(email: string, password: string): Promise<User> {
    if (isPostgresEnabled()) return pgCreateUser(email, password)
    return memCreateUser(email, password)
  },
  async verify(email: string, password: string): Promise<User> {
    if (isPostgresEnabled()) return pgVerifyUser(email, password)
    return memVerifyUser(email, password)
  },
  async getById(id: string): Promise<User | undefined> {
    if (isPostgresEnabled()) return pgGetUserById(id)
    return memGetUserById(id)
  },
  async delete(id: string): Promise<boolean> {
    if (isPostgresEnabled()) return pgDeleteUser(id)
    return memDeleteUser(id)
  },
}
