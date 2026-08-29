/**
 * Netlify Function: /api/auth/*
 *
 * Routes:
 *   /api/auth/register   (POST)
 *   /api/auth/login      (POST)
 *   /api/auth/refresh    (POST)
 *   /api/auth/logout     (POST)
 *   /api/auth/me         (GET, DELETE)
 *
 * Netlify config: netlify.toml has redirects from /api/auth/* to
 * /.netlify/functions/auth (without query string), so this function
 * receives ALL auth sub-paths.
 */
export { handler } from '../_common'
