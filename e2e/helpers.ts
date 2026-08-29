import type { Page } from '@playwright/test'

/**
 * Shared e2e test helpers — auth bootstrap.
 *
 * Used by both critical-flow.spec.ts and auth-flow.spec.ts to create a
 * test user and log them in, so the rest of the test can focus on the
 * feature being tested (not on auth ceremony).
 */

let counter = 0
export function uniqueEmail(prefix = 'test'): string {
  counter += 1
  return `${prefix}+${Date.now()}-${counter}@e2e.test`
}

/**
 * Wipe storage ONCE at the start of a test. Does NOT use addInitScript
 * (which would wipe on every navigation and break the auth flow that
 * stores tokens between steps).
 */
export async function wipeStorage(page: Page) {
  await page.goto('/calisthenies/#/login', { waitUntil: 'domcontentloaded' })
  await page.evaluate(async () => {
    localStorage.clear()
    const dbs = await indexedDB.databases?.() ?? []
    for (const db of dbs) {
      if (db.name) indexedDB.deleteDatabase(db.name)
    }
  })
}

/**
 * Register a brand-new user via the UI and land on /onboarding or /.
 * Returns the email used.
 *
 * Useful for tests that need an authenticated session without caring
 * about the register form itself.
 */
export async function registerAndLogin(page: Page, emailPrefix = 'test'): Promise<string> {
  const email = uniqueEmail(emailPrefix)
  await page.goto('/calisthenies/#/register')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Mot de passe').first().fill('password123')
  await page.getByLabel('Confirme le mot de passe').fill('password123')
  await page.getByRole('button', { name: /Créer mon compte/i }).click()
  // RegisterPage navigates to /onboarding
  await page.waitForURL('**/#/onboarding', { timeout: 10000 })
  return email
}

/**
 * Register + complete onboarding minimally so the user lands on home
 * with a profile set up (needed for tests that touch profile-dependent
 * features like Home's recommended workout card).
 */
export async function registerAndOnboard(page: Page, emailPrefix = 'test'): Promise<string> {
  const email = await registerAndLogin(page, emailPrefix)

  // Skip the optional fields, just pick a goal + duration + save
  await page.getByRole('button', { name: /Me renforcer/i }).click()
  await page.getByRole('button', { name: /^20 min$/i }).click()
  await page.getByRole('button', { name: /Enregistrer mon profil/i }).click()
  await page.waitForURL('**/#/', { timeout: 10000 })
  return email
}
