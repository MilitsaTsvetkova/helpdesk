/**
 * Login flow — integration tests against the real test backend + test DB.
 *
 * Covers:
 *   - Happy path: valid credentials → redirect to /
 *   - Client-side validation: invalid email format, password too short, empty fields
 *   - Server-side error: wrong password, non-existent email
 *   - Already-authenticated redirect: visiting /login when logged in → /
 *   - Keyboard accessibility: form is submittable via Enter key
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
  // Page rendering
  // ---------------------------------------------------------------------------

  test('renders the login form with all required elements', async ({ page }) => {
    await expect(page).toHaveTitle(/Helpdesk|Vite/i);
    await expect(page.getByRole('heading', { name: 'Helpdesk' })).toBeVisible();
    await expect(page.getByText('Sign in to your account')).toBeVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
    await expect(loginPage.submitButton).toBeEnabled();
  });

  test('email input has autofocus on page load', async () => {
    await expect(loginPage.emailInput).toBeFocused();
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

    // Navbar displays user.name if set, otherwise user.email.
    // The seed script creates the user with name "Test User", so that appears.
    const navbar = page.getByRole('navigation');
    await expect(navbar).toBeVisible();
    // Match either the seeded name or the email — both are valid depending on seed data
    await expect(navbar.getByText(/Test User|testuser@example/)).toBeVisible();
  });

  test('shows "Signing in…" on the submit button while request is in flight', async ({ page }) => {
    // Slow down the auth API so the loading state is observable
    await page.route('**/api/auth/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      await route.continue();
    });

    await loginPage.emailInput.fill(USER_EMAIL);
    await loginPage.passwordInput.fill(USER_PASSWORD);
    await loginPage.submitButton.click();

    await expect(page.getByRole('button', { name: 'Signing in…' })).toBeVisible();
    // Eventually succeeds
    await page.waitForURL('/');
  });

  // ---------------------------------------------------------------------------
  // Client-side validation (zod — no network request is made)
  // ---------------------------------------------------------------------------

  test('shows email format error for an invalid email address', async () => {
    await loginPage.fillEmail('not-an-email');
    await loginPage.fillPassword(USER_PASSWORD);
    await loginPage.submit();

    await expect(loginPage.emailError).toBeVisible();
    await expect(loginPage.emailError).toHaveText('Invalid email address');
  });

  test('shows password length error when password is fewer than 8 characters', async () => {
    await loginPage.fillEmail(USER_EMAIL);
    await loginPage.fillPassword('short');
    await loginPage.submit();

    await expect(loginPage.passwordError).toBeVisible();
    await expect(loginPage.passwordError).toHaveText('Password must be at least 8 characters');
  });

  test('shows validation errors for both fields when form is submitted empty', async () => {
    await loginPage.submit();

    await expect(loginPage.emailError).toBeVisible();
    await expect(loginPage.passwordError).toBeVisible();
  });

  test('shows email error only when email is invalid and password is valid', async () => {
    await loginPage.fillEmail('bad-email');
    await loginPage.fillPassword(USER_PASSWORD);
    await loginPage.submit();

    await expect(loginPage.emailError).toBeVisible();
    await expect(loginPage.passwordError).not.toBeVisible();
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

  test('can tab through all form controls in order', async ({ page }) => {
    // Start from email (autofocused), tab to password, tab to submit button
    await expect(loginPage.emailInput).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(loginPage.passwordInput).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(loginPage.submitButton).toBeFocused();
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
