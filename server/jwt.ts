/**
 * JWT signing + verification using `jose` (Web Crypto, no Node-only deps).
 *
 * Access token: 15 min — sent in Authorization: Bearer
 * Refresh token: 30 days — sent in httpOnly cookie (when in prod)
 *
 * Lot 0.8: JWT_SECRET is now REQUIRED in production — no more hardcoded
 * fallback. The server will throw at boot if it's missing in production,
 * preventing the catastrophic scenario where a public known secret allows
 * token forgery.
 */
import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

/**
 * Lazy-initialized JWT secret.
 *
 * Lot 0.8: the secret is checked at first USE (signAccessToken/verifyAccessToken),
 * not at module load. This prevents the hard-fail from firing during `vite build`
 * (which imports this file transitively but never calls the functions).
 *
 * In production runtime (when the server actually starts handling requests),
 * the first call to getSecret() will throw if JWT_SECRET is missing.
 */
let _secret: Uint8Array | null = null

function getSecret(): Uint8Array {
  if (_secret) return _secret

  const secretString = process.env.JWT_SECRET
  if (!secretString || secretString.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'FATAL: JWT_SECRET must be set to a 32+ char random string in production. ' +
        'Generate one with: openssl rand -hex 32'
      )
    }
    console.warn(
      '⚠️  WARNING: JWT_SECRET not set. Using dev-only fallback. ' +
      'DO NOT use in production — set JWT_SECRET env var.'
    )
    _secret = new TextEncoder().encode('dev-only-secret-change-in-production-32-chars-min')
  } else {
    _secret = new TextEncoder().encode(secretString)
  }
  return _secret
}

export interface AccessTokenPayload extends JWTPayload {
  sub: string
  email: string
  type: 'access'
}

export interface RefreshTokenPayload extends JWTPayload {
  sub: string
  type: 'refresh'
}

const ACCESS_TTL = '15m'
const REFRESH_TTL = '30d'

export async function signAccessToken(user: { id: string; email: string }): Promise<string> {
  return new SignJWT({ email: user.email, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TTL)
    .sign(getSecret())
}

export async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(REFRESH_TTL)
    .sign(getSecret())
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, getSecret(), { algorithms: ['HS256'] })
  if (payload.type !== 'access') {
    throw new Error('Expected access token, got ' + payload.type)
  }
  return payload as AccessTokenPayload
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  const { payload } = await jwtVerify(token, getSecret(), { algorithms: ['HS256'] })
  if (payload.type !== 'refresh') {
    throw new Error('Expected refresh token, got ' + payload.type)
  }
  return payload as RefreshTokenPayload
}

export function accessTokenTtlSeconds(): number {
  return 15 * 60
}
