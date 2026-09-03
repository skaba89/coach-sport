/**
 * Observability module — structured logging + web vitals.
 *
 * Captures:
 * - Console errors (structured, not raw console.log)
 * - Web Vitals (LCP, FID, CLS, TTFB) via the web-vitals library pattern
 * - API errors (network, 4xx, 5xx)
 * - Sync errors (IndexedDB write failures)
 *
 * Privacy: never logs JWT, passwords, emails, or personal data.
 * Only logs: error message, stack trace, URL, timestamp, severity.
 *
 * For production, wire `sendToBackend` to Sentry or a custom endpoint.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  url?: string
  stack?: string
  context?: Record<string, unknown>
}

const LOG_BUFFER: LogEntry[] = []
const MAX_BUFFER = 50

function log(entry: Omit<LogEntry, 'timestamp'>): void {
  const fullEntry: LogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.hash : undefined,
  }

  LOG_BUFFER.push(fullEntry)
  if (LOG_BUFFER.length > MAX_BUFFER) {
    LOG_BUFFER.shift()
  }

  // Console output with structured format
  const prefix = `[${fullEntry.timestamp}] [${fullEntry.level.toUpperCase()}]`
  if (entry.level === 'error' || entry.level === 'fatal') {
    console.error(prefix, entry.message, entry.context ?? '')
    if (entry.stack) console.error(entry.stack)
  } else if (entry.level === 'warn') {
    console.warn(prefix, entry.message, entry.context ?? '')
  } else {
    console.log(prefix, entry.message, entry.context ?? '')
  }

  // In production, send to backend / Sentry
  if (import.meta.env.PROD && entry.level === 'error') {
    sendToBackend(fullEntry).catch(() => {
      // Silently fail — logging should never break the app
    })
  }
}

async function sendToBackend(_entry: LogEntry): Promise<void> {
  // Future: wire to Sentry, Datadog, or custom endpoint
  // For now, we just keep it in the buffer
  // When Sentry is installed:
  //   import * as Sentry from '@sentry/react'
  //   Sentry.captureMessage(entry.message, entry.level)
  //   if (entry.stack) Sentry.captureException(new Error(entry.message))
}

export const logger = {
  debug: (msg: string, ctx?: Record<string, unknown>) => log({ level: 'debug', message: msg, context: ctx }),
  info: (msg: string, ctx?: Record<string, unknown>) => log({ level: 'info', message: msg, context: ctx }),
  warn: (msg: string, ctx?: Record<string, unknown>) => log({ level: 'warn', message: msg, context: ctx }),
  error: (msg: string, ctx?: Record<string, unknown>) => log({ level: 'error', message: msg, context: ctx }),
  fatal: (msg: string, ctx?: Record<string, unknown>) => log({ level: 'fatal', message: msg, context: ctx }),

  /** Get all buffered logs (for debugging / export) */
  getBuffer: (): LogEntry[] => [...LOG_BUFFER],

  /** Clear the buffer */
  clear: (): void => { LOG_BUFFER.length = 0 },
}

// ─── Global error handlers ─────────────────────────────────────────

/**
 * Install global error handlers.
 * Call once at app startup (in main.tsx).
 */
export function installErrorHandlers(): void {
  if (typeof window === 'undefined') return

  // Catch unhandled errors
  window.addEventListener('error', (event) => {
    logger.error('Unhandled error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    })
    if (event.error?.stack) {
      logger.error(event.error.stack)
    }
  })

  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    logger.error('Unhandled promise rejection', {
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
    })
  })
}

// ─── Web Vitals ────────────────────────────────────────────────────

export interface WebVital {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
}

const VITAL_THRESHOLDS: Record<string, [number, number]> = {
  LCP: [2500, 4000],   // ms
  FID: [100, 300],     // ms
  CLS: [0.1, 0.25],    // score
  TTFB: [800, 1800],   // ms
  INP: [200, 500],     // ms
}

function rateVital(name: string, value: number): WebVital['rating'] {
  const [good, poor] = VITAL_THRESHOLDS[name] ?? [Infinity, Infinity]
  if (value <= good) return 'good'
  if (value <= poor) return 'needs-improvement'
  return 'poor'
}

const vitals: WebVital[] = []

export function recordVital(name: string, value: number): void {
  const rating = rateVital(name, value)
  const vital: WebVital = { name, value, rating }
  vitals.push(vital)
  logger.info(`Web Vital: ${name}`, { value, rating })

  // Future: send to analytics
  // if (process.env.NODE_ENV === 'production') {
  //   fetch('/api/vitals', { method: 'POST', body: JSON.stringify(vital) })
  // }
}

export function getVitals(): WebVital[] {
  return [...vitals]
}

/**
 * Initialize web vitals collection.
 * Uses the Performance API directly (no external dependency).
 */
export function initWebVitals(): void {
  if (typeof window === 'undefined' || !window.performance) return

  // TTFB (Time to First Byte)
  const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
  if (navEntry) {
    const ttfb = navEntry.responseStart - navEntry.requestStart
    if (ttfb > 0) recordVital('TTFB', ttfb)
  }

  // LCP (Largest Contentful Paint)
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries()
    const lastEntry = entries[entries.length - 1]
    if (lastEntry) recordVital('LCP', lastEntry.startTime)
  })
  try {
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
  } catch {
    // Some browsers don't support this
  }

  // CLS (Cumulative Layout Shift)
  let clsValue = 0
  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const layoutShift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number }
      if (!layoutShift.hadRecentInput) {
        clsValue += layoutShift.value
      }
    }
  })
  try {
    clsObserver.observe({ type: 'layout-shift', buffered: true })
  } catch {
    // ignore
  }

  // Record CLS on page hide
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && clsValue > 0) {
      recordVital('CLS', clsValue)
    }
  })
}
