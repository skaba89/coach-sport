/**
 * Vite server middleware exposing authentication endpoints.
 *
 * Endpoints:
 *   POST /api/auth/register    { email, password } → AuthSession
 *   POST /api/auth/login       { email, password } → AuthSession
 *   POST /api/auth/refresh     { refreshToken }    → AuthSession
 *   POST /api/auth/logout      (no body)           → 204
 *   GET  /api/auth/me          (Bearer)            → User
 *   DELETE /api/auth/me        (Bearer)            → 204
 *
 * ⚠️ Dev-only middleware. For production, port these handlers to a
 * Vercel/Cloudflare Functions API and switch the refresh token to an
 * httpOnly cookie.
 *
 * Type assertion below is required because Vite's plugin types don't
 * expose the configureServer hook signature publicly. The cast is safe —
 * we only use documented properties.
 */
import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'http'
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken, accessTokenTtlSeconds } from './jwt'
import { usersAdapter } from './adapters'
import { getClientIp, rateLimit } from './rateLimit'
import type { ApiError, AuthSession, LoginRequest, RegisterRequest } from '../src/lib/auth/types'

const JSON_HEADER = { 'Content-Type': 'application/json' }

async function readBody(req: IncomingMessage & { body?: string }): Promise<string> {
  // Netlify Functions / Express provide req.body already parsed as a string.
  // Vite dev middleware gives us a real IncomingMessage stream.
  if (typeof req.body === 'string' && req.body.length > 0) {
    return req.body
  }
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
      // Reject bodies > 1MB to prevent abuse
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
  const payload: ApiError = { error: 'auth_error', message }
  send(res, status, payload)
}

function getBearerToken(req: IncomingMessage): string | null {
  const h = req.headers.authorization
  if (!h || !h.startsWith('Bearer ')) return null
  return h.slice(7).trim()
}

async function buildSession(userId: string, email: string): Promise<AuthSession> {
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken({ id: userId, email }),
    signRefreshToken(userId),
  ])
  return {
    user: { id: userId, email, createdAt: new Date().toISOString() },
    accessToken,
    refreshToken,
    expiresAt: new Date(Date.now() + accessTokenTtlSeconds() * 1000).toISOString(),
  }
}

async function handleAuth(req: IncomingMessage, res: ServerResponse, url: string): Promise<boolean> {
  // All auth routes are under /api/auth/*
  if (!url.startsWith('/api/auth/')) return false

  const method = req.method ?? 'GET'

  try {
    // ─── POST /api/auth/register ────────────────────────────────
    if (url === '/api/auth/register' && method === 'POST') {
      // Rate limit: 5 registrations per IP per minute
      const rl = rateLimit({ key: `register:${getClientIp(req)}`, bucketSize: 5, refillPerMinute: 5 })
      if (!rl.allowed) {
        res.setHeader('Retry-After', String(rl.retryAfter))
        sendError(res, 429, `Too many registrations. Retry in ${rl.retryAfter}s.`)
        return true
      }
      const body = JSON.parse(await readBody(req)) as RegisterRequest
      const user = await usersAdapter.create(body.email, body.password)
      const session = await buildSession(user.id, user.email)
      session.user = user
      send(res, 201, session)
      return true
    }

    // ─── POST /api/auth/login ───────────────────────────────────
    if (url === '/api/auth/login' && method === 'POST') {
      // Rate limit: 10 login attempts per IP per minute (slow brute force)
      const rl = rateLimit({ key: `login:${getClientIp(req)}`, bucketSize: 10, refillPerMinute: 10 })
      if (!rl.allowed) {
        res.setHeader('Retry-After', String(rl.retryAfter))
        sendError(res, 429, `Too many login attempts. Retry in ${rl.retryAfter}s.`)
        return true
      }
      const body = JSON.parse(await readBody(req)) as LoginRequest
      const user = await usersAdapter.verify(body.email, body.password)
      const session = await buildSession(user.id, user.email)
      session.user = user
      send(res, 200, session)
      return true
    }

    // ─── POST /api/auth/refresh ──────────────────────────────────
    if (url === '/api/auth/refresh' && method === 'POST') {
      const body = JSON.parse(await readBody(req) || '{}') as { refreshToken?: string }
      if (!body.refreshToken) {
        sendError(res, 400, 'Missing refreshToken')
        return true
      }
      const payload = await verifyRefreshToken(body.refreshToken)
      const user = await usersAdapter.getById(payload.sub)
      if (!user) {
        sendError(res, 401, 'User no longer exists')
        return true
      }
      const session = await buildSession(user.id, user.email)
      session.user = user
      send(res, 200, session)
      return true
    }

    // ─── POST /api/auth/logout ───────────────────────────────────
    // Stateless JWT — there's no server-side session to invalidate.
    // The client just discards its tokens. Future: implement a jti
    // revocation list (store in KV / Redis) for true logout.
    if (url === '/api/auth/logout' && method === 'POST') {
      res.writeHead(204)
      res.end()
      return true
    }

    // ─── GET /api/auth/me — fetch current user from Bearer token ─
    if (url === '/api/auth/me' && method === 'GET') {
      const token = getBearerToken(req)
      if (!token) {
        sendError(res, 401, 'Missing Bearer token')
        return true
      }
      try {
        const payload = await verifyAccessToken(token)
        const user = await usersAdapter.getById(payload.sub)
        if (!user) {
          sendError(res, 401, 'User no longer exists')
          return true
        }
        send(res, 200, user)
        return true
      } catch {
        sendError(res, 401, 'Invalid or expired token')
        return true
      }
    }

    // ─── DELETE /api/auth/me — delete account ───────────────────
    if (url === '/api/auth/me' && method === 'DELETE') {
      const token = getBearerToken(req)
      if (!token) {
        sendError(res, 401, 'Missing Bearer token')
        return true
      }
      try {
        const payload = await verifyAccessToken(token)
        const deleted = await usersAdapter.delete(payload.sub)
        if (!deleted) {
          sendError(res, 404, 'User not found')
          return true
        }
        res.writeHead(204)
        res.end()
        return true
      } catch {
        sendError(res, 401, 'Invalid or expired token')
        return true
      }
    }

    // Unknown auth route
    sendError(res, 404, `Unknown auth route: ${method} ${url}`)
    return true
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500
    const message = err instanceof Error ? err.message : 'Unknown error'
    sendError(res, status, message)
    return true
  }
}

export const authMiddlewarePlugin: Plugin = {
  name: 'calisthenies-auth-middleware',
  configureServer(server) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    server.middlewares.use(async (req: any, res: any, next: any) => {
      const url = req.url ?? ''
      try {
        const handled = await handleAuth(req, res, url)
        if (!handled) next()
      } catch (err) {
        console.error('[auth] unhandled error:', err)
        next(err)
      }
    })
  },
  configurePreviewServer(server) {
    // Also wire up in `vite preview` (production build local test)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    server.middlewares.use(async (req: any, res: any, next: any) => {
      const url = req.url ?? ''
      try {
        const handled = await handleAuth(req, res, url)
        if (!handled) next()
      } catch (err) {
        console.error('[auth] unhandled error:', err)
        next(err)
      }
    })
  },
}
