/**
 * Custom Playwright fixtures for the helpdesk test suite.
 *
 * Extends the base `test` and `expect` with project-specific conveniences:
 *   - `loginPage` — a pre-navigated LoginPage POM instance
 *   - `authenticatedPage` — a page pre-loaded with the test user's session
 *     (uses storageState from e2e/.auth/user.json)
 *
 * Usage:
 *   import { test, expect } from '../../fixtures';
 */

import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

type HelpdeskFixtures = {
  /** A LoginPage POM instance, already navigated to /login */
  loginPage: LoginPage;
};

export const test = base.extend<HelpdeskFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await use(loginPage);
  },
});

export { expect };
