/**
 * Netlify Function: /api/stripe/webhook, /api/subscriptions/*
 *
 * Routes:
 *   POST /api/stripe/webhook         (no auth — signature verified)
 *   GET  /api/subscriptions          (Bearer auth)
 *   POST /api/subscriptions/checkout  (Bearer auth)
 *
 * ⚠️ Stripe webhook needs the RAW body to verify the signature.
 * Netlify Functions provide event.body as a string when isBase64Encoded=false.
 */
export { handler } from '../_common'
