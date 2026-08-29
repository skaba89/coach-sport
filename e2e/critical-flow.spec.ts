import { test, expect } from '@playwright/test'
import { registerAndOnboard, wipeStorage } from './helpers'

/**
 * Critical-flow e2e test: onboarding → workout → history.
 *
 * Verifies that the major user journeys still work end-to-end after
 * refactors. Now requires authentication — every test boots via
 * registerAndOnboard() so we have a valid session.
 */

test.beforeEach(async ({ context }) => {
  await context.clearCookies()
  await context.clearPermissions()
})

test.describe('Critical user flow', () => {
  test('complete onboarding → home journey', async ({ page }) => {
    await wipeStorage(page)
    await registerAndOnboard(page)

    await expect(page.getByRole('heading', { name: /Calisthenics Tracker/i })).toBeVisible()
    // Recommended workout should be visible (proves the profile was saved)
    await expect(page.getByText(/Séance recommandée/i)).toBeVisible()
  })

  test('home page renders onboarding CTA when profile is empty', async ({ page }) => {
    await wipeStorage(page)
    // Register but skip onboarding — go straight to /
    await page.goto('/calisthenies/#/register')
    await page.getByLabel('Email').fill(`no-onboard+${Date.now()}@e2e.test`)
    await page.getByLabel('Mot de passe').first().fill('password123')
    await page.getByLabel('Confirme le mot de passe').fill('password123')
    await page.getByRole('button', { name: /Créer mon compte/i }).click()
    await page.waitForURL('**/#/onboarding', { timeout: 10000 })

    // Skip onboarding by going directly to home
    await page.goto('/calisthenies/#/')
    await expect(page.getByText(/Personnalise ton entraînement/i)).toBeVisible()
  })

  test('exercise detail page with video renders and has poster', async ({ page }) => {
    await wipeStorage(page)
    await registerAndOnboard(page)

    await page.goto('/calisthenies/#/exercises/push-up')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const video = page.locator('video').first()
    await expect(video).toBeVisible()
    const poster = await video.getAttribute('poster')
    expect(poster).toContain('.webp')
  })

  test('exercise detail page with SVG fallback renders', async ({ page }) => {
    await wipeStorage(page)
    await registerAndOnboard(page)

    await page.goto('/calisthenies/#/exercises/superman')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByText(/Démonstration|Animation/i)).toBeVisible()
  })

  test('invalid exercise id shows friendly error, no crash', async ({ page }) => {
    await wipeStorage(page)
    await registerAndOnboard(page)

    await page.goto('/calisthenies/#/exercises/nonexistent-id')
    await expect(page.getByText(/Exercice introuvable/i)).toBeVisible()
  })

  test('programs list shows all 4 predefined programs', async ({ page }) => {
    await wipeStorage(page)
    await registerAndOnboard(page)

    await page.goto('/calisthenies/#/programs')
    const programLinks = page.locator('a[href^="#/programs/"]')
    await expect(programLinks).toHaveCount(4)
  })

  test('navigation bar switches routes correctly', async ({ page }) => {
    await wipeStorage(page)
    await registerAndOnboard(page)
    await page.goto('/calisthenies/#/')

    await page.getByRole('link', { name: /Programmes/i }).first().click()
    await page.waitForURL('**/#/programs')

    await page.getByRole('link', { name: /Exercices/i }).first().click()
    await page.waitForURL('**/#/exercises')

    await page.getByRole('link', { name: /Progression/i }).first().click()
    await page.waitForURL('**/#/history')
  })

  test('timer page renders', async ({ page }) => {
    await wipeStorage(page)
    await registerAndOnboard(page)

    await page.goto('/calisthenies/#/timer')
    await expect(page.getByText(/\d:\d{2}/)).toBeVisible()
    await expect(page.getByRole('button', { name: /Démarrer/i })).toBeVisible()
  })

  test('no uncaught errors on home page', async ({ page }) => {
    await wipeStorage(page)
    await registerAndOnboard(page)
    await page.goto('/calisthenies/#/')

    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))
    await page.waitForTimeout(1000)
    expect(errors).toEqual([])
  })
})
