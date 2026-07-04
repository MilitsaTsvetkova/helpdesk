/**
 * Protected routes & session management — integration tests.
 *
 * Covers:
 *   - Unauthenticated access to protected routes redirects to /login
 *   - Authenticated access renders the protected page
 *   - Session persistence across page reloads
 *   - Logout clears the session and redirects to /login
 *   - Admin-only route (AdminRoute) redirects non-admin users to /
 *   - Admin user can access admin-only routes
 *
 * Approach: integration tests. Two contexts are used:
 *   1. Unauthenticated — default browser state (no storageState)
 *   2. Authenticated — storageState from e2e/.auth/user.json (written by auth.setup.ts)
 *
 * Prerequisites:
 *   - auth.setup.ts must have run (setup project dependency)
 *   - TEST_USER_EMAIL / TEST_USER_PASSWORD in .env.test (regular AGENT role user)
 *   - TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD in .env.test (ADMIN role user)
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

const USER_EMAIL = process.env.TEST_USER_EMAIL ?? 'testuser@example.com';
const USER_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'testpassword123';
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL ?? 'testadmin@example.com';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? 'adminpassword123';

// ---------------------------------------------------------------------------
// Unauthenticated access
// ---------------------------------------------------------------------------

test.describe('Unauthenticated access', () => {
  test('redirects / to /login when not logged in', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL('/login');
    await expect(page.getByLabel('Email')).toBeVisible();
  });

  test('redirects /users to /login when not logged in', async ({ page }) => {
    await page.goto('/users');
    await page.waitForURL('/login');
    await expect(page.getByLabel('Email')).toBeVisible();
  });

  test('redirects an unknown protected path to /login when not logged in', async ({ page }) => {
    await page.goto('/some-other-page');
    await page.waitForURL('/login');
    await expect(page.getByLabel('Email')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Authenticated access (regular user — AGENT role)
// ---------------------------------------------------------------------------

test.describe('Authenticated access — regular user', () => {
  // All tests in this block use the saved session from auth.setup.ts
  test.use({ storageState: 'e2e/.auth/user.json' });

  test('can access the home page at /', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Welcome to Helpdesk' })).toBeVisible();
  });

  test('session persists after a full page reload', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Welcome to Helpdesk' })).toBeVisible();

    await page.reload();

    // After reload, ProtectedRoute re-checks the session — should stay on /
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Welcome to Helpdesk' })).toBeVisible();
  });

  test('shows the navbar with a logout button when authenticated', async ({ page }) => {
    await page.goto('/');
    const navbar = page.getByRole('navigation');
    await expect(navbar).toBeVisible();
    await expect(navbar.getByRole('button', { name: 'Logout' })).toBeVisible();
  });

  test('does not show the Users nav link for a non-admin user', async ({ page }) => {
    await page.goto('/');
    const navbar = page.getByRole('navigation');
    await expect(navbar.getByRole('link', { name: 'Users' })).not.toBeVisible();
  });

  test('redirects a non-admin user away from /users to /', async ({ page }) => {
    await page.goto('/users');
    await page.waitForURL('/');
    await expect(page.getByRole('heading', { name: 'Welcome to Helpdesk' })).toBeVisible();
  });

  test('redirects an unknown path inside the app to / (catch-all route)', async ({ page }) => {
    await page.goto('/this-does-not-exist');
    await page.waitForURL('/');
    await expect(page.getByRole('heading', { name: 'Welcome to Helpdesk' })).toBeVisible();
  });

});

// ---------------------------------------------------------------------------
// Logout — uses a fresh login so the shared user.json session is never destroyed.
// These tests MUST NOT use storageState: they create their own session and
// destroy only that session, keeping user.json valid for parallel tests.
// ---------------------------------------------------------------------------

test.describe('Logout behaviour', () => {
  test('logout clears the session and redirects to /login', async ({ page }) => {
    // Log in fresh — do not reuse user.json so we don't invalidate it.
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(USER_EMAIL, USER_PASSWORD);
    await page.waitForURL('/');

    const navbar = page.getByRole('navigation');
    await navbar.getByRole('button', { name: 'Logout' }).click();

    // AuthContext.logout calls signOut then navigate('/login')
    await page.waitForURL('/login');
    await expect(page.getByLabel('Email')).toBeVisible();
  });

  test('cannot access / after logging out', async ({ page }) => {
    // Log in fresh — do not reuse user.json so we don't invalidate it.
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(USER_EMAIL, USER_PASSWORD);
    await page.waitForURL('/');

    // Log out
    await page.getByRole('navigation').getByRole('button', { name: 'Logout' }).click();
    await page.waitForURL('/login');

    // Attempt to navigate to a protected route — should redirect back to /login
    await page.goto('/');
    await page.waitForURL('/login');
    await expect(page.getByLabel('Email')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Admin access
// ---------------------------------------------------------------------------

test.describe('Admin user access', () => {
  test('admin user can log in and access /users', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.waitForURL('/');

    await page.goto('/users');
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
  });

  test('admin user sees the Users link in the navbar', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.waitForURL('/');

    const navbar = page.getByRole('navigation');
    await expect(navbar.getByRole('link', { name: 'Users' })).toBeVisible();
  });
});
