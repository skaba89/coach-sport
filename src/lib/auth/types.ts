/**
 * Authentication types shared between frontend and backend.
 */

export interface User {
  id: string
  email: string
  createdAt: string
}

export interface AuthSession {
  user: User
  /** Short-lived JWT (15 min) — used to authenticate API calls. */
  accessToken: string
  /** Long-lived JWT (30 days) — used to mint new access tokens. */
  refreshToken: string
  /** ISO date when the access token expires. */
  expiresAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
}

export interface ApiError {
  error: string
  message: string
}
