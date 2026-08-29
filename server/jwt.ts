/**
 * JWT signing + verification using `jose` (Web Crypto, no Node-only deps).
 *
 * Access token: 15 min — sent in Authorization: Bearer
 * Refresh token: 30 days — sent in httpOnly cookie (when in prod)
 *
 * For the dev middleware setup we keep both as Bearer tokens in JSON.
 * The future Vercel API should switch the refresh token to an httpOnly
 * cookie to mitigate XSS exfiltration.
 */
import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-only-secret-change-in-production-32-chars-min',
)

export interface AccessTokenPayload extends JWTPayload {
  sub: string    // user id
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
    .sign(SECRET)
}

export async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(REFRESH_TTL)
    .sign(SECRET)
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, SECRET, {
    algorithms: ['HS256'],
  })
  if (payload.type !== 'access') {
    throw new Error('Expected access token, got ' + payload.type)
  }
  return payload as AccessTokenPayload
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  const { payload } = await jwtVerify(token, SECRET, {
    algorithms: ['HS256'],
  })
  if (payload.type !== 'refresh') {
    throw new Error('Expected refresh token, got ' + payload.type)
  }
  return payload as RefreshTokenPayload
}

/** Returns the number of seconds until the access token expires. */
export function accessTokenTtlSeconds(): number {
  return 15 * 60
}
