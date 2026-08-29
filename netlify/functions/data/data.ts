/**
 * Netlify Function: /api/sessions, /api/profile, /api/favorites
 *
 * Routes:
 *   GET    /api/sessions
 *   POST   /api/sessions
 *   DELETE /api/sessions/:id
 *   GET    /api/profile
 *   PUT    /api/profile
 *   GET    /api/favorites?type=X
 *   POST   /api/favorites
 *   DELETE /api/favorites/:id
 *
 * Authenticated via Bearer token — see server/dataMiddleware.ts.
 */
export { handler } from '../_common'
