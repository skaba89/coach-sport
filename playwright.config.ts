import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright e2e config for the calisthenies PWA.
 *
 * The app is a fully client-side PWA persisted in IndexedDB — e2e tests
 * run against the production `vite preview` build to catch any
 * runtime-only issues that unit tests miss (React Router, Dexie live
 * queries, video autoplay, etc.).
 *
 * Web server is started automatically by Playwright before the suite
 * and stopped at the end — no manual `vite preview` needed.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // shared IndexedDB state — sequential is safer
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: 'http://127.0.0.1:4399',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 390, height: 844 }, // iPhone-class
    deviceScaleFactor: 2,
  },
  projects: [
    {
      name: 'chromium-mobile',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4399 --host 127.0.0.1',
    url: 'http://127.0.0.1:4399/calisthenies/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
