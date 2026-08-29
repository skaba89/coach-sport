/**
 * Standalone Express server for production deployment on Render / Railway / Fly.io.
 *
 * Vite's middleware is dev-only — for production, we need a long-running
 * Node process that serves the static frontend AND exposes the /api/*
 * endpoints (auth, data, stripe).
 *
 * This file is used by:
 *   - Render's `web` service (render.yaml → coach-sport-api)
 *   - Any other Node host (Railway, Fly.io, a VPS, etc.)
 *
 * For Netlify/Vercel, prefer the serverless functions approach instead
 * (smaller cold-start, scales to zero). See DEPLOY.md.
 */
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { authMiddlewarePlugin } from './server/middleware'
import { dataMiddlewarePlugin } from './server/dataMiddleware'
import { stripeMiddlewarePlugin } from './server/stripeMiddleware'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

// Trust the first proxy (Render puts us behind one) so req.ip and
// X-Forwarded-* headers are honored.
app.set('trust proxy', 1)

// Health check — Render uses this to know the service is alive
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    postgres: !!process.env.DATABASE_URL,
    stripe: !!process.env.STRIPE_SECRET_KEY,
  })
})

// Convert Vite middleware plugins into Express middleware.
// The Vite plugin API's configureServer hook gives us (server) => server.middlewares.use(fn).
// We extract the same middleware functions and apply them to Express directly.
type ViteMiddleware = (req: unknown, res: unknown, next: () => void) => void
function bindMiddleware(plugin: { configureServer?: (server: { middlewares: { use: (fn: ViteMiddleware) => void } }) => void }): ViteMiddleware {
  const middlewares: ViteMiddleware[] = []
  plugin.configureServer?.({
    middlewares: {
      use: (fn: ViteMiddleware) => middlewares.push(fn),
    },
  })
  return (req, res, next) => {
    let i = 0
    const chain = () => {
      if (i >= middlewares.length) return next()
      const m = middlewares[i++]
      m(req, res, chain)
    }
    chain()
  }
}

app.use(bindMiddleware(authMiddlewarePlugin))
app.use(bindMiddleware(dataMiddlewarePlugin))
app.use(bindMiddleware(stripeMiddlewarePlugin))

// CORS — allow the web frontend (different Render subdomain) to call /api/*
app.use('/api', (req, res, next) => {
  const origin = process.env.CORS_ORIGIN
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    if (req.method === 'OPTIONS') {
      res.status(204).end()
      return
    }
  }
  next()
})

// Serve the static frontend (built by Vite into ./dist)
const distPath = path.join(__dirname, 'dist')
app.use(express.static(distPath))

// SPA fallback: serve index.html for any non-API, non-static path.
// Using middleware instead of a wildcard route — Express 5 changed
// the path-to-regexp syntax and `app.get('*', ...)` no longer works
// the same way. Middleware is a more reliable catch-all.
app.use((req, res, next) => {
  // Skip API requests — they were handled by the auth/data/stripe middleware
  if (req.path.startsWith('/api/')) {
    return next()
  }
  // Skip requests for files with extensions (static assets handled above)
  if (req.path.match(/\.[a-zA-Z0-9]+$/)) {
    return next()
  }
  // For everything else, send the SPA index.html so client-side routing works
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`✓ coach-sport server listening on http://localhost:${PORT}`)
  console.log(`  Postgres: ${process.env.DATABASE_URL ? 'enabled' : 'disabled (in-memory)'}`)
  console.log(`  Stripe:   ${process.env.STRIPE_SECRET_KEY ? 'configured' : 'not configured'}`)
})
