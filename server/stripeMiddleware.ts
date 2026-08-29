/**
 * Stripe subscription endpoints.
 *
 * Routes:
 *   POST /api/subscriptions/checkout   → create a Checkout Session
 *   GET  /api/subscriptions             → fetch the user's current subscription
 *   POST /api/stripe/webhook            → Stripe webhook (no auth, signature verified)
 *
 * The Stripe SDK is imported lazily so the dev server doesn't fail to
 * boot if STRIPE_SECRET_KEY is not set. Only the production deployment
 * needs Stripe credentials.
 */
import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'http'
import Stripe from 'stripe'
import { verifyAccessToken } from './jwt'
import { isPostgresEnabled } from './pgUsers'
import { neon } from '@neondatabase/serverless'

const JSON_HEADER = { 'Content-Type': 'application/json' }

// Lazy singletons — only created when first used
let _stripe: Stripe | null = null
function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  }
  return _stripe
}

let _sql: ReturnType<typeof neon> | null = null
function sql() {
  if (!_sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set — Stripe endpoints require Postgres')
    }
    _sql = neon(process.env.DATABASE_URL)
  }
  return _sql
}

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
  send(res, status, { error: 'stripe_error', message })
}

async function getBearerUserId(req: IncomingMessage): Promise<string | null> {
  const h = req.headers.authorization
  if (!h || !h.startsWith('Bearer ')) return null
  try {
    const payload = await verifyAccessToken(h.slice(7).trim())
    return payload.sub
  } catch {
    return null
  }
}

async function handleStripe(req: IncomingMessage, res: ServerResponse, url: string): Promise<boolean> {
  if (!url.startsWith('/api/stripe/') && !url.startsWith('/api/subscriptions')) {
    return false
  }

  const method = req.method ?? 'GET'
  const path = url.split('?')[0]

  // ─── GET /api/subscriptions — fetch the user's subscription status ───
  if (path === '/api/subscriptions' && method === 'GET') {
    const userId = await getBearerUserId(req)
    if (!userId) {
      sendError(res, 401, 'Authentication required')
      return true
    }
    if (!isPostgresEnabled()) {
      // In dev mode without DB, return a free plan
      send(res, 200, { status: 'active', plan: 'free' })
      return true
    }
    const rows = await sql()`
      SELECT status, plan, current_period_end
      FROM subscriptions
      WHERE user_id = ${userId}
    ` as unknown as Array<{
      status: string; plan: string; current_period_end: string | null
    }>
    if (rows.length === 0) {
      send(res, 200, { status: 'active', plan: 'free' })
      return true
    }
    const row = rows[0]
    send(res, 200, {
      status: row.status,
      plan: row.plan,
      currentPeriodEnd: row.current_period_end,
    })
    return true
  }

  // ─── POST /api/subscriptions/checkout — create a Checkout Session ─
  if (path === '/api/subscriptions/checkout' && method === 'POST') {
    const userId = await getBearerUserId(req)
    if (!userId) {
      sendError(res, 401, 'Authentication required')
      return true
    }
    const stripe = getStripe()
    if (!stripe) {
      sendError(res, 503, 'Stripe not configured (set STRIPE_SECRET_KEY)')
      return true
    }
    const priceId = process.env.STRIPE_PRICE_ID_PRO
    if (!priceId) {
      sendError(res, 500, 'STRIPE_PRICE_ID_PRO is not set')
      return true
    }

    try {
      const body = JSON.parse(await readBody(req) || '{}') as { successUrl?: string; cancelUrl?: string }
      const origin = req.headers.origin ?? 'http://localhost:4399'
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: body.successUrl ?? `${origin}/?checkout=success`,
        cancel_url: body.cancelUrl ?? `${origin}/?checkout=cancel`,
        client_reference_id: userId,
      })
      send(res, 200, { url: session.url })
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create checkout session'
      sendError(res, 500, msg)
      return true
    }
  }

  // ─── POST /api/stripe/webhook — Stripe webhook (signature verified) ─
  if (path === '/api/stripe/webhook' && method === 'POST') {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      sendError(res, 500, 'STRIPE_WEBHOOK_SECRET is not set')
      return true
    }
    const stripe = getStripe()
    if (!stripe) {
      sendError(res, 503, 'Stripe not configured')
      return true
    }

    const sig = req.headers['stripe-signature']
    if (!sig || typeof sig !== 'string') {
      sendError(res, 400, 'Missing stripe-signature header')
      return true
    }
    const rawBody = await readBody(req)
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid signature'
      sendError(res, 400, `Webhook signature verification failed: ${msg}`)
      return true
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session
          const userId = session.client_reference_id
          if (!userId) break
          const customerId = session.customer as string
          const subscriptionId = session.subscription as string
          // Fetch the subscription to get current_period_end
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          await sql()`
            INSERT INTO subscriptions (
              user_id, stripe_customer_id, stripe_subscription_id,
              status, plan, current_period_end
            )
            VALUES (
              ${userId},
              ${customerId},
              ${subscriptionId},
              ${subscription.status},
              'pro',
              ${new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000).toISOString()}
            )
            ON CONFLICT (user_id) DO UPDATE SET
              stripe_customer_id = EXCLUDED.stripe_customer_id,
              stripe_subscription_id = EXCLUDED.stripe_subscription_id,
              status = EXCLUDED.status,
              plan = EXCLUDED.plan,
              current_period_end = EXCLUDED.current_period_end,
              updated_at = now()
          `
          break
        }
        case 'customer.subscription.updated': {
          const sub = event.data.object as Stripe.Subscription & { current_period_end: number }
          await sql()`
            UPDATE subscriptions SET
              status = ${sub.status},
              current_period_end = ${new Date(sub.current_period_end * 1000).toISOString()},
              updated_at = now()
            WHERE stripe_subscription_id = ${sub.id}
          `
          break
        }
        case 'customer.subscription.deleted': {
          const sub = event.data.object as Stripe.Subscription
          await sql()`
            UPDATE subscriptions SET
              status = 'canceled',
              updated_at = now()
            WHERE stripe_subscription_id = ${sub.id}
          `
          break
        }
        default:
          // Unhandled event type — log but don't fail
          console.log(`[stripe] Unhandled event type: ${event.type}`)
      }
      res.writeHead(200)
      res.end(JSON.stringify({ received: true }))
      return true
    } catch (err) {
      console.error('[stripe] webhook handler error:', err)
      sendError(res, 500, 'Webhook handler failed')
      return true
    }
  }

  return false
}

export const stripeMiddlewarePlugin: Plugin = {
  name: 'calisthenies-stripe-middleware',
  configureServer(server) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    server.middlewares.use(async (req: any, res: any, next: any) => {
      const url = req.url ?? ''
      try {
        const handled = await handleStripe(req, res, url)
        if (!handled) next()
      } catch (err) {
        console.error('[stripe] unhandled error:', err)
        next(err)
      }
    })
  },
  configurePreviewServer(server) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    server.middlewares.use(async (req: any, res: any, next: any) => {
      const url = req.url ?? ''
      try {
        const handled = await handleStripe(req, res, url)
        if (!handled) next()
      } catch (err) {
        console.error('[stripe] unhandled error:', err)
        next(err)
      }
    })
  },
}
