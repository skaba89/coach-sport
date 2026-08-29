/**
 * Vite server middleware exposing authenticated data endpoints.
 *
 * All routes are protected (require a valid Bearer access token).
 * The middleware extracts the userId from the JWT and scopes every
 * query to that user.
 *
 * Routes:
 *   GET    /api/sessions            → list user's sessions
 *   POST   /api/sessions            → create a session
 *   DELETE /api/sessions/:id        → delete one session
 *   GET    /api/profile             → get user's profile
 *   PUT    /api/profile             → upsert user's profile
 *   GET    /api/favorites?type=X    → list favorites by type
 *   POST   /api/favorites           → add a favorite
 *   DELETE /api/favorites/:id       → delete a favorite
 *
 * Future: port to Vercel Functions and replace `dataStore` with
 * Neon Postgres queries.
 */
import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'http'
import { verifyAccessToken } from './jwt'
import { isPostgresEnabled } from './pgUsers'
import {
  addFavorite, addSession, deleteFavorite, deleteSession, findFavorite,
  getProfile, listFavorites, listSessions, putProfile,
} from './dataStore'
import {
  pgAddFavorite, pgAddSession, pgDeleteFavorite, pgDeleteSession,
  pgFindFavorite, pgGetProfile, pgListFavorites, pgListSessions, pgPutProfile,
} from './pgDataStore'
import type { FavoriteRecord, ProfileRecord } from '../src/db/db'
import type { WorkoutSession } from '../src/lib/types'

// ─── Adapter: pick the right implementation per call ──────────────
// When DATABASE_URL is set, use Postgres. Otherwise in-memory.
// The functions are aliased so the call sites don't change.
const usePostgres = isPostgresEnabled()

const Sessions = {
  list: usePostgres ? pgListSessions : listSessions,
  add: usePostgres ? pgAddSession : addSession,
  delete: usePostgres ? pgDeleteSession : deleteSession,
}
const Profile = {
  get: usePostgres ? pgGetProfile : getProfile,
  put: usePostgres ? pgPutProfile : putProfile,
}
const Favorites = {
  list: usePostgres ? pgListFavorites : listFavorites,
  find: usePostgres ? pgFindFavorite : findFavorite,
  add: usePostgres ? pgAddFavorite : addFavorite,
  delete: usePostgres ? pgDeleteFavorite : deleteFavorite,
}

const JSON_HEADER = { 'Content-Type': 'application/json' }

async function readBody(req: IncomingMessage & { body?: string }): Promise<string> {
  if (typeof req.body === 'string' && req.body.length > 0) {
    return req.body
  }
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
      if (Buffer.concat(chunks).length > 1024 * 1024) {
        reject(new Error('Body too large'))
        req.destroy()
      }
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
    req.on('error', reject)
  })
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, JSON_HEADER)
  res.end(JSON.stringify(body))
}

function sendError(res: ServerResponse, status: number, message: string) {
  send(res, status, { error: 'data_error', message })
}

/** Extract the Bearer token and verify it. Returns the userId or null. */
async function authenticate(req: IncomingMessage): Promise<string | null> {
  const h = req.headers.authorization
  if (!h || !h.startsWith('Bearer ')) return null
  const token = h.slice(7).trim()
  try {
    const payload = await verifyAccessToken(token)
    return payload.sub
  } catch {
    return null
  }
}

async function handleData(req: IncomingMessage, res: ServerResponse, url: string): Promise<boolean> {
  if (!url.startsWith('/api/')) return false
  // Auth routes are handled by the auth middleware
  if (url.startsWith('/api/auth/')) return false
  // Stripe + subscription routes are handled by the stripe middleware
  if (url.startsWith('/api/stripe/') || url.startsWith('/api/subscriptions')) return false

  const method = req.method ?? 'GET'

  // ─── Authenticate ────────────────────────────────────────────────
  const userId = await authenticate(req)
  if (!userId) {
    sendError(res, 401, 'Authentication required')
    return true
  }

  // Strip query string for routing
  const path = url.split('?')[0]

  try {
    // ─── Sessions ───────────────────────────────────────────────
    if (path === '/api/sessions' && method === 'GET') {
      send(res, 200, await Sessions.list(userId))
      return true
    }
    if (path === '/api/sessions' && method === 'POST') {
      const body = JSON.parse(await readBody(req)) as Omit<WorkoutSession, 'id'>
      const id = await Sessions.add(userId, body)
      send(res, 201, { id })
      return true
    }
    const sessionMatch = path.match(/^\/api\/sessions\/(\d+)$/)
    if (sessionMatch && method === 'DELETE') {
      const sessionId = Number(sessionMatch[1])
      const ok = await Sessions.delete(userId, sessionId)
      if (!ok) {
        sendError(res, 404, 'Session not found')
        return true
      }
      res.writeHead(204)
      res.end()
      return true
    }

    // ─── Profile ────────────────────────────────────────────────
    if (path === '/api/profile' && method === 'GET') {
      const profile = await Profile.get(userId)
      send(res, 200, profile ?? null)
      return true
    }
    if (path === '/api/profile' && method === 'PUT') {
      const body = JSON.parse(await readBody(req)) as ProfileRecord
      await Profile.put(userId, body)
      send(res, 200, body)
      return true
    }

    // ─── Favorites ──────────────────────────────────────────────
    if (path === '/api/favorites' && method === 'GET') {
      const q = url.split('?')[1] ?? ''
      const params = new URLSearchParams(q)
      const type = params.get('type') as FavoriteRecord['type'] | null
      if (!type) {
        sendError(res, 400, 'Missing ?type= query param')
        return true
      }
      send(res, 200, await Favorites.list(userId, type))
      return true
    }
    if (path === '/api/favorites' && method === 'POST') {
      const body = JSON.parse(await readBody(req)) as Omit<FavoriteRecord, 'id'>
      // Check for existing favorite to enforce uniqueness
      const existing = await Favorites.find(userId, body.type, body.refId)
      if (existing) {
        send(res, 200, existing)
        return true
      }
      const id = await Favorites.add(userId, body)
      send(res, 201, { id, ...body })
      return true
    }
    const favMatch = path.match(/^\/api\/favorites\/(\d+)$/)
    if (favMatch && method === 'DELETE') {
      const favId = Number(favMatch[1])
      const ok = await Favorites.delete(userId, favId)
      if (!ok) {
        sendError(res, 404, 'Favorite not found')
        return true
      }
      res.writeHead(204)
      res.end()
      return true
    }

    sendError(res, 404, `Unknown route: ${method} ${path}`)
    return true
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    sendError(res, 500, message)
    return true
  }
}

export const dataMiddlewarePlugin: Plugin = {
  name: 'calisthenies-data-middleware',
  configureServer(server) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    server.middlewares.use(async (req: any, res: any, next: any) => {
      const url = req.url ?? ''
      try {
        const handled = await handleData(req, res, url)
        if (!handled) next()
      } catch (err) {
        console.error('[data] unhandled error:', err)
        next(err)
      }
    })
  },
  configurePreviewServer(server) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    server.middlewares.use(async (req: any, res: any, next: any) => {
      const url = req.url ?? ''
      try {
        const handled = await handleData(req, res, url)
        if (!handled) next()
      } catch (err) {
        console.error('[data] unhandled error:', err)
        next(err)
      }
    })
  },
}
