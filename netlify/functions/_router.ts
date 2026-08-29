/**
 * Shared utilities for Netlify Functions.
 *
 * Converts the Vite middleware pattern (req/res/next) to Netlify's
 * signature (event, context) → Response. All handlers are reused from
 * `server/*.ts` — no logic duplication.
 */
import type { Context } from '@netlify/functions'
import { authMiddlewarePlugin } from '../../server/middleware'
import { dataMiddlewarePlugin } from '../../server/dataMiddleware'
import { stripeMiddlewarePlugin } from '../../server/stripeMiddleware'

// ─── Build a fake Node-style server middleware chain ───────────────
type NextFn = () => void
type Middleware = (req: NodeReq, res: NodeRes, next: NextFn) => void | Promise<void>

interface NodeReq {
  method: string
  url: string
  headers: Record<string, string>
  body?: string
}

interface NodeRes {
  statusCode: number
  headers: Record<string, string | number | string[]>
  body: string
  finished: boolean
  writeHead(status: number, headers?: Record<string, string | number | string[]>): void
  end(body?: string): void
  setHeader(name: string, value: string | number | string[]): void
}

function buildChain(): Middleware[] {
  const middlewares: Middleware[] = []
  const fakeServer = {
    middlewares: {
      use: (fn: Middleware) => middlewares.push(fn),
    },
  }
  // Each Vite plugin's configureServer hook registers a middleware
  authMiddlewarePlugin.configureServer?.(fakeServer as never)
  dataMiddlewarePlugin.configureServer?.(fakeServer as never)
  stripeMiddlewarePlugin.configureServer?.(fakeServer as never)
  return middlewares
}

const CHAIN = buildChain()

/**
 * Run the middleware chain against a (req, res) pair.
 * Returns true if a middleware handled the request, false if all called next().
 */
export async function runChain(req: NodeReq, res: NodeRes): Promise<boolean> {
  let i = 0
  let handled = false
  const next = () => {
    if (i < CHAIN.length) {
      const m = CHAIN[i++]
      Promise.resolve(m(req, res, next)).catch((err) => {
        console.error('[netlify] middleware error:', err)
        if (!res.finished) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'internal_error', message: String(err) }))
        }
      })
    } else {
      // No middleware handled the request
      if (!res.finished) {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'not_found', message: 'No handler matched' }))
      }
      handled = false
    }
  }
  // Track whether any middleware ended the response
  const originalEnd = res.end.bind(res)
  res.end = (body?: string) => {
    res.finished = true
    handled = true
    return originalEnd(body)
  }
  // Start the chain
  next()
  // Wait for the chain to settle (middlewares may be async)
  // Netlify Functions need a synchronous-ish response, so we poll briefly
  await new Promise<void>((resolve) => {
    const start = Date.now()
    const check = () => {
      if (res.finished || Date.now() - start > 25000) {
        resolve()
      } else {
        setImmediate(check)
      }
    }
    check()
  })
  return handled
}

export type { Context, NodeReq, NodeRes, Middleware }
