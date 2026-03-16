import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test('loads and shows key elements', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('nav').getByText('QGO Relocation')).toBeVisible()
    await expect(page.locator('text=Relocation surveys')).toBeVisible()
    await expect(page.locator('a[href="/request"]').first()).toBeVisible()
    await expect(page.locator('a[href="/track"]').first()).toBeVisible()
  })

  test('navigate to request form', async ({ page }) => {
    await page.goto('/')
    await page.click('a[href="/request"]:first-of-type')
    await expect(page).toHaveURL('/request')
    await expect(page.locator('h2:has-text("Personal Information")')).toBeVisible()
  })
})

test.describe('Survey Request Form', () => {
  test('renders step 1 correctly', async ({ page }) => {
    await page.goto('/request')
    await expect(page.locator('h2:has-text("Personal Information")')).toBeVisible()
    await expect(page.locator('input[type="text"]').first()).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('step 1 validation - cannot continue without name+email', async ({ page }) => {
    await page.goto('/request')
    const continueBtn = page.locator('button:has-text("Continue")')
    await expect(continueBtn).toBeDisabled()

    await page.fill('input[type="text"]', 'Test User')
    await expect(continueBtn).toBeDisabled()

    await page.fill('input[type="email"]', 'test@example.com')
    await expect(continueBtn).toBeEnabled()
  })

  test('step 1 to step 2 navigation', async ({ page }) => {
    await page.goto('/request')
    await page.fill('input[type="text"]', 'Ahmed Ali')
    await page.fill('input[type="email"]', 'ahmed@test.com')
    await page.click('button:has-text("Continue")')
    await expect(page.locator('h2:has-text("Move Details")')).toBeVisible()
  })

  test('step 2 validation - cannot continue without address+destination', async ({ page }) => {
    await page.goto('/request')
    // Step 1
    await page.fill('input[type="text"]', 'Ahmed Ali')
    await page.fill('input[type="email"]', 'ahmed@test.com')
    await page.click('button:has-text("Continue")')

    // Step 2 - continue should be disabled
    const continueBtn = page.locator('button:has-text("Continue")')
    await expect(continueBtn).toBeDisabled()

    await page.fill('textarea', 'Building 5, Marina Walk')
    await expect(continueBtn).toBeDisabled() // still no destination

    await page.selectOption('select >> nth=1', 'United Kingdom')
    await expect(continueBtn).toBeEnabled()
  })

  test('back navigation works', async ({ page }) => {
    await page.goto('/request')
    await page.fill('input[type="text"]', 'Ahmed Ali')
    await page.fill('input[type="email"]', 'ahmed@test.com')
    await page.click('button:has-text("Continue")')
    await expect(page.locator('h2:has-text("Move Details")')).toBeVisible()
    await page.click('button:has-text("Back")')
    await expect(page.locator('h2:has-text("Personal Information")')).toBeVisible()
    // Data should be preserved
    await expect(page.locator('input[type="text"]')).toHaveValue('Ahmed Ali')
  })

  test('full form submission flow', async ({ page }) => {
    await page.goto('/request')

    // Step 1
    await page.fill('input[placeholder="John Smith"]', 'Test Customer')
    await page.fill('input[type="email"]', `playwright${Date.now()}@example.com`)
    await page.click('button:has-text("Continue")')

    // Step 2
    await expect(page.locator('h2:has-text("Move Details")')).toBeVisible()
    await page.click('button:has-text("Apartment")')
    await page.fill('textarea', 'Marina Residences, Dubai Marina')
    await page.selectOption('select >> nth=1', 'United Kingdom')
    await page.click('button:has-text("Continue")')

    // Step 3 - review
    await expect(page.locator('h2:has-text("Review")')).toBeVisible()
    await expect(page.locator('text=Test Customer')).toBeVisible()
    await expect(page.locator('text=United Kingdom')).toBeVisible()

    // Submit
    await page.click('button:has-text("Submit Request")')

    // Wait for success screen
    await expect(page.locator('h1:has-text("Survey Requested")')).toBeVisible({ timeout: 20000 })
    await expect(page.locator('text=Your Tracking Code')).toBeVisible()

    // Track button should be visible
    await expect(page.locator('a:has-text("Track My Survey")')).toBeVisible()
  })
})

test.describe('Track Page', () => {
  test('renders search form', async ({ page }) => {
    await page.goto('/track')
    await expect(page.locator('h1:has-text("Track")')).toBeVisible()
    await expect(page.locator('input[placeholder*="Tracking"]')).toBeVisible()
    await expect(page.locator('button:has-text("Track")')).toBeVisible()
  })

  test('shows error for invalid code', async ({ page }) => {
    await page.goto('/track')
    await page.fill('input', 'INVALID1')
    await page.click('button:has-text("Track")')
    await expect(page.locator('text=No survey found')).toBeVisible({ timeout: 15000 })
  })

  test('accepts query param ?q=', async ({ page }) => {
    await page.goto('/track?q=TESTBAD1')
    await expect(page.locator('text=No survey found').or(page.locator('text=Survey Request'))).toBeVisible({ timeout: 15000 })
  })
})

test.describe('Login Page', () => {
  test('renders login form', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('h1:has-text("Staff Portal")')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible()
  })

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'wrong@email.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button:has-text("Sign In")')
    await expect(page.locator('.bg-red-50')).toBeVisible({ timeout: 15000 })
  })

  test('redirects admin to dashboard on success', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@qgorelocation.com')
    await page.fill('input[type="password"]', 'Admin@123456')
    await page.click('button:has-text("Sign In")')
    await expect(page).toHaveURL('/admin', { timeout: 30000 })
  })
})

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@qgorelocation.com')
    await page.fill('input[type="password"]', 'Admin@123456')
    await page.click('button:has-text("Sign In")')
    await page.waitForURL('/admin', { timeout: 30000 })
  })

  test('dashboard loads with stats', async ({ page }) => {
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible()
    await expect(page.locator('text=Total Requests')).toBeVisible()
  })

  test('sidebar navigation - surveys', async ({ page }) => {
    await page.click('a[href="/admin/surveys"]')
    await expect(page).toHaveURL('/admin/surveys')
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('sidebar navigation - surveyors', async ({ page }) => {
    await page.click('a[href="/admin/surveyors"]')
    await expect(page).toHaveURL('/admin/surveyors')
    await expect(page.locator('h1:has-text("Surveyor")')).toBeVisible()
  })

  test('sidebar navigation - analytics', async ({ page }) => {
    await page.click('a[href="/admin/analytics"]')
    await expect(page).toHaveURL('/admin/analytics')
    await expect(page.locator('h1:has-text("Analytics")')).toBeVisible()
  })

  test('sidebar navigation - settings', async ({ page }) => {
    await page.click('a[href="/admin/settings"]')
    await expect(page).toHaveURL('/admin/settings')
    await expect(page.locator('h1:has-text("Settings")')).toBeVisible()
  })

  test('surveys list has filter tabs', async ({ page }) => {
    await page.goto('/admin/surveys')
    await expect(page.locator('text=All').first()).toBeVisible()
    await expect(page.locator('text=Pending').first()).toBeVisible()
  })
})
