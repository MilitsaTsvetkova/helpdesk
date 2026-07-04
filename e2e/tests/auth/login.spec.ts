/**
 * Login flow — E2E tests against the real test backend + test DB.
 *
 * Covers critical paths only:
 *   - Happy path: valid credentials → redirect to /, navbar shows user
 *   - Server-side errors: wrong password, non-existent email, retry after failure
 *   - Keyboard: Enter key submits the form
 *   - Already-authenticated redirect: visiting /login when logged in → /
 *
 * Client-side validation (email format, password length, empty-field errors,
 * "Signing in…" loading state, autofocus, tab order) are covered in
 * client/src/pages/LoginPage.test.tsx.
 *
 * Approach: integration (real backend on :3001, real test DB helpdesk_test).
 * No API mocking — tests verify the full request/response cycle.
 *
 * Prerequisites:
 *   - .env.test must contain TEST_USER_EMAIL and TEST_USER_PASSWORD
 *   - auth.setup.ts must have run (seeds test users into helpdesk_test)
 *   - Run: bun test:e2e
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

const USER_EMAIL = process.env.TEST_USER_EMAIL ?? 'testuser@example.com';
const USER_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'testpassword123';

test.describe('Login page', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  test('logs in successfully with valid credentials and redirects to /', async ({ page }) => {
    await loginPage.login(USER_EMAIL, USER_PASSWORD);

    await page.waitForURL('/');
    await expect(page.getByRole('heading', { name: 'Welcome to Helpdesk' })).toBeVisible();
  });

  test('shows the user name or email in the navbar after login', async ({ page }) => {
    await loginPage.login(USER_EMAIL, USER_PASSWORD);
    await page.waitForURL('/');

    const navbar = page.getByRole('navigation');
    await expect(navbar).toBeVisible();
    // Match either the seeded name or the email — both are valid depending on seed data
    await expect(navbar.getByText(/Test User|testuser@example/)).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Server-side errors (wrong credentials, unknown email)
  // ---------------------------------------------------------------------------

  test('shows an error message for an incorrect password', async ({ page }) => {
    await loginPage.login(USER_EMAIL, 'wrongpassword123');

    await expect(loginPage.rootError).toBeVisible();
    await expect(loginPage.rootError).toContainText(/login failed|invalid|incorrect/i);
  });

  test('shows an error message for a non-existent email', async ({ page }) => {
    await loginPage.login('nobody@example.com', 'somepassword123');

    await expect(loginPage.rootError).toBeVisible();
    await expect(loginPage.rootError).toContainText(/login failed|invalid|incorrect/i);
  });

  test('does not navigate away after a failed login attempt', async ({ page }) => {
    await loginPage.login(USER_EMAIL, 'wrongpassword123');

    await expect(loginPage.rootError).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('clears root error and allows a retry after a failed login', async ({ page }) => {
    // First attempt fails
    await loginPage.login(USER_EMAIL, 'wrongpassword123');
    await expect(loginPage.rootError).toBeVisible();

    // Second attempt with correct credentials should succeed
    await loginPage.emailInput.fill(USER_EMAIL);
    await loginPage.passwordInput.fill(USER_PASSWORD);
    await loginPage.submitButton.click();

    await page.waitForURL('/');
    await expect(page.getByRole('heading', { name: 'Welcome to Helpdesk' })).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Keyboard accessibility
  // ---------------------------------------------------------------------------

  test('submits the form when Enter is pressed in the password field', async ({ page }) => {
    await loginPage.emailInput.fill(USER_EMAIL);
    await loginPage.passwordInput.fill(USER_PASSWORD);
    await loginPage.passwordInput.press('Enter');

    await page.waitForURL('/');
    await expect(page.getByRole('heading', { name: 'Welcome to Helpdesk' })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Already-authenticated redirect
// ---------------------------------------------------------------------------

test.describe('Login page — already authenticated', () => {
  test.use({ storageState: 'e2e/.auth/user.json' });

  test('redirects an authenticated user away from /login to /', async ({ page }) => {
    await page.goto('/login');
    await page.waitForURL('/');
    await expect(page.getByRole('heading', { name: 'Welcome to Helpdesk' })).toBeVisible();
  });
});
