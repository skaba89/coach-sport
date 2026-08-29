/**
 * Common Netlify Function handler — wraps the Vite middleware chain.
 *
 * Each Netlify Function file just re-exports `handler` from here, plus
 * filters which routes it accepts. The actual route matching + handler
 * logic lives in server/middleware.ts, server/dataMiddleware.ts, and
 * server/stripeMiddleware.ts.
 */
import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { runChain, type NodeReq, type NodeRes } from './_router'

export const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  // Build the query string from all possible Netlify event properties.
  // Different versions of @netlify/functions expose different fields:
  //   - event.rawQueryString  (newer, preferred)
  //   - event.rawQuery       (older alias)
  //   - event.queryStringParameters  (parsed object, always available)
  let queryString = event.rawQueryString ?? (event as { rawQuery?: string }).rawQuery ?? ''
  if (!queryString && event.queryStringParameters) {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(event.queryStringParameters)) {
      if (v !== undefined && v !== null) params.set(k, v)
    }
    queryString = params.toString()
  }

  // Build the Node-style req object from the Netlify event
  const req: NodeReq = {
    method: event.httpMethod,
    url: event.path + (queryString ? `?${queryString}` : ''),
    headers: Object.fromEntries(
      Object.entries(event.headers).map(([k, v]) => [k.toLowerCase(), Array.isArray(v) ? v.join(',') : v]),
    ),
    body: event.body ?? '',
  }

  // Build the Node-style res object
  const res: NodeRes = {
    statusCode: 200,
    headers: {},
    body: '',
    finished: false,
    writeHead(status, headers) {
      this.statusCode = status
      if (headers) {
        for (const [k, v] of Object.entries(headers)) {
          this.headers[k.toLowerCase()] = v
        }
      }
    },
    end(body) {
      this.finished = true
      if (body !== undefined) this.body = body
    },
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value
    },
  }

  // Run the Vite middleware chain
  await runChain(req, res)

  // Convert to Netlify response
  return {
    statusCode: res.statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...Object.fromEntries(
        Object.entries(res.headers).map(([k, v]) => [k, Array.isArray(v) ? v.join(',') : String(v)]),
      ),
    },
    body: res.body,
  }
}
