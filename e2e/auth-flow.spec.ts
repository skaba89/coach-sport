import { test, expect } from '@playwright/test'
import { registerAndLogin, wipeStorage } from './helpers'

/**
 * Authentication flow e2e tests.
 */

test.beforeEach(async ({ context }) => {
  await context.clearCookies()
  await context.clearPermissions()
})

test.describe('Authentication flow', () => {
  test('unauthenticated user is redirected to /login', async ({ page }) => {
    await wipeStorage(page)
    await page.goto('/calisthenies/#/')

    await page.waitForURL('**/#/login', { timeout: 10000 })
    await expect(page.getByRole('heading', { name: /Bon retour/i })).toBeVisible()
  })

  test('register → onboarding redirect', async ({ page }) => {
    await wipeStorage(page)
    await registerAndLogin(page)

    // Should be on /onboarding now
    await expect(page).toHaveURL(/#\/onboarding$/)
    await expect(page.getByRole('heading', { name: /Personnalise ton entraînement/i })).toBeVisible()
  })

  test('register with mismatched passwords shows error', async ({ page }) => {
    await wipeStorage(page)
    await page.goto('/calisthenies/#/register')

    await page.getByLabel('Email').fill('mismatch@test.com')
    await page.getByLabel('Mot de passe').first().fill('password123')
    await page.getByLabel('Confirme le mot de passe').fill('different123')

    await page.getByRole('button', { name: /Créer mon compte/i }).click()

    await expect(page.getByText(/Les mots de passe ne correspondent pas/i)).toBeVisible()
  })

  test('login → profile → logout cycle', async ({ page }) => {
    await wipeStorage(page)
    const email = await registerAndLogin(page)

    // Go to profile via URL — should work since we're authenticated
    await page.goto('/calisthenies/#/profile')
    await expect(page.getByRole('heading', { name: /Mon profil/i })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(email).first()).toBeVisible()

    // Logout
    await page.getByRole('button', { name: /Se déconnecter/i }).click()
    await page.waitForURL('**/#/login', { timeout: 10000 })
    await expect(page.getByRole('heading', { name: /Bon retour/i })).toBeVisible()
  })

  test('authenticated user accessing /login is redirected to /', async ({ page }) => {
    await wipeStorage(page)
    await registerAndLogin(page)

    // Now try to access /login — should redirect to /
    await page.goto('/calisthenies/#/login')
    await page.waitForURL('**/#/', { timeout: 10000 })
  })

  test('delete account flow requires confirmation', async ({ page }) => {
    await wipeStorage(page)
    await registerAndLogin(page)

    await page.goto('/calisthenies/#/profile')
    await expect(page.getByRole('heading', { name: /Mon profil/i })).toBeVisible({ timeout: 10000 })

    await page.getByRole('button', { name: /Supprimer mon compte/i }).click()
    await expect(page.getByText(/Cette action est définitive/i)).toBeVisible()

    // Cancel
    await page.getByRole('button', { name: /Annuler/i }).click()
    await expect(page.getByText(/Cette action est définitive/i)).toBeHidden()

    // User should still be logged in
    await expect(page.getByRole('button', { name: /Se déconnecter/i })).toBeVisible()
  })

  test('navigation bar has a Profile link', async ({ page }) => {
    await wipeStorage(page)
    await registerAndLogin(page)

    // Skip onboarding by going to home
    await page.goto('/calisthenies/#/')

    const profileLink = page.getByRole('link', { name: /^Profil$/i })
    await expect(profileLink).toBeVisible({ timeout: 10000 })
    await profileLink.click()
    await page.waitForURL('**/#/profile', { timeout: 10000 })
    await expect(page).toHaveURL(/#\/profile$/)
  })

  test('login with wrong password shows error', async ({ page }) => {
    await wipeStorage(page)
    await page.goto('/calisthenies/#/login')

    await page.getByLabel('Email').fill('nonexistent@test.com')
    await page.getByLabel('Mot de passe').first().fill('whatever123')
    await page.getByRole('button', { name: /Se connecter/i }).click()

    await expect(page.getByText(/Invalid credentials/i)).toBeVisible()
    await expect(page).toHaveURL(/#\/login$/)
  })

  test('logging out then accessing protected route redirects to /login', async ({ page }) => {
    await wipeStorage(page)
    await registerAndLogin(page)

    // Logout via the profile page
    await page.goto('/calisthenies/#/profile')
    await expect(page.getByRole('heading', { name: /Mon profil/i })).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: /Se déconnecter/i }).click()
    await page.waitForURL('**/#/login', { timeout: 10000 })

    // Try to access a protected route — should stay on /login
    await page.goto('/calisthenies/#/programs')
    await page.waitForURL('**/#/login', { timeout: 10000 })
  })
})
