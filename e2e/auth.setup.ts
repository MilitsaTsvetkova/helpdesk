/**
 * Auth setup — runs once before all dependent test projects.
 *
 * Responsibilities:
 *   1. Seed a regular test user (AGENT role) and an admin test user (ADMIN role)
 *      directly in the test DB by running e2e/scripts/seed-test-users.ts via
 *      Bun. This bypasses the UI since sign-up is disabled in the app.
 *   2. Sign in as the regular test user via the API (page.request shares the
 *      cookie jar with page, so the session cookie is captured without going
 *      through the React sign-in form, which avoids session-state timing issues).
 *      Save the resulting storage state to e2e/.auth/user.json.
 *   3. Sign in as the admin test user the same way, in a fresh browser context,
 *      and save to e2e/.auth/admin.json.
 *
 * NOTE: The UI login flow (form fill → click Sign in → redirect) is exercised
 * by the tests in e2e/tests/auth/protected-routes.spec.ts. No need to duplicate
 * that coverage here — the setup only needs the cookies, not a UI verification.
 *
 * Prerequisites (set in .env.test):
 *   - TEST_DATABASE_URL   — postgres connection string for helpdesk_test
 *   - BETTER_AUTH_SECRET  — must match the value used by the test server
 *   - TEST_USER_EMAIL / TEST_USER_PASSWORD — regular user credentials
 *   - TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD — admin user credentials
 */

import { test as setup, expect } from '@playwright/test';
import { execSync } from 'node:child_process';
import path from 'node:path';

/** Path where Playwright saves session cookies for the regular (AGENT) user */
const AUTH_FILE = 'e2e/.auth/user.json';

/** Path where Playwright saves session cookies for the admin user */
const ADMIN_AUTH_FILE = 'e2e/.auth/admin.json';

const USER_EMAIL = process.env.TEST_USER_EMAIL ?? 'testuser@example.com';
const USER_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'testpassword123';
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL ?? 'testadmin@example.com';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? 'adminpassword123';
const TEST_DB_URL = process.env.TEST_DATABASE_URL!;
const BASE_URL = 'http://localhost:5174';

async function signInViaApi(
  request: import('@playwright/test').APIRequestContext,
  email: string,
  password: string,
): Promise<void> {
  const response = await request.post('/api/auth/sign-in/email', {
    data: { email, password },
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok()) {
    throw new Error(`Sign-in failed (${response.status()}): ${await response.text()}`);
  }
}

setup('seed test users and authenticate', async ({ page, browser }) => {
  // Step 1: seed test users into helpdesk_test.
  const serverDir = path.resolve(__dirname, '../server');
  const seedScript = path.resolve(serverDir, 'seed-test-users.ts');

  execSync(`bun run ${seedScript}`, {
    cwd: serverDir,
    env: { ...process.env, DATABASE_URL: TEST_DB_URL },
    stdio: 'inherit',
  });

  // Step 2: sign in as the regular user via API.
  // page.request shares the cookie jar with page, so the session cookie is set
  // in the browser context automatically after the API call.
  await signInViaApi(page.request, USER_EMAIL, USER_PASSWORD);

  // Verify the session works by navigating to the protected home page.
  await page.goto('/');
  await page.waitForURL('/');
  await expect(page.getByRole('heading', { name: 'Welcome to Helpdesk' })).toBeVisible();

  // Persist session cookies for dependent test projects.
  await page.context().storageState({ path: AUTH_FILE });

  // Step 3: sign in as the admin user in a fresh browser context.
  const adminContext = await browser.newContext({ baseURL: BASE_URL });
  const adminPage = await adminContext.newPage();

  await signInViaApi(adminContext.request, ADMIN_EMAIL, ADMIN_PASSWORD);

  // Verify and capture admin session.
  await adminPage.goto('/');
  await adminPage.waitForURL('/');
  await expect(adminPage.getByRole('heading', { name: 'Welcome to Helpdesk' })).toBeVisible();

  await adminContext.storageState({ path: ADMIN_AUTH_FILE });
  await adminContext.close();
});
