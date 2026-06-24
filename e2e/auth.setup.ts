/**
 * Auth setup — runs once before all dependent test projects.
 *
 * Responsibilities:
 *   1. Seed a regular test user (AGENT role) and an admin test user (ADMIN role)
 *      directly in the test DB by running e2e/scripts/seed-test-users.ts via
 *      Bun. This bypasses the UI since sign-up is disabled in the app.
 *   2. Log in as the regular test user through the browser and save the
 *      resulting session cookies to e2e/.auth/user.json so authenticated
 *      test projects can reuse that state without repeating the login flow.
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

/** Path where Playwright saves session cookies for authenticated test reuse */
const AUTH_FILE = 'e2e/.auth/user.json';

const USER_EMAIL = process.env.TEST_USER_EMAIL ?? 'testuser@example.com';
const USER_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'testpassword123';
const TEST_DB_URL = process.env.TEST_DATABASE_URL!;

setup('seed test users and authenticate', async ({ page }) => {
  // Step 1: seed test users into helpdesk_test.
  // The script must run from server/ so that Prisma and better-auth resolve
  // from server/node_modules, not from the repo root.
  const serverDir = path.resolve(__dirname, '../server');
  const seedScript = path.resolve(serverDir, 'seed-test-users.ts');

  execSync(`bun run ${seedScript}`, {
    cwd: serverDir,
    env: {
      ...process.env,
      DATABASE_URL: TEST_DB_URL,
    },
    stdio: 'inherit',
  });

  // Step 2: log in as the regular test user through the real UI
  await page.goto('/login');
  await page.getByLabel('Email').fill(USER_EMAIL);
  await page.getByLabel('Password').fill(USER_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Confirm login succeeded — ProtectedRoute redirects to / on success
  await page.waitForURL('/');
  await expect(page.getByRole('heading', { name: 'Welcome to Helpdesk' })).toBeVisible();

  // Step 3: persist session cookies so dependent test projects skip the login flow
  await page.context().storageState({ path: AUTH_FILE });
});
