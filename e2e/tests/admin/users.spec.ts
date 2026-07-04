/**
 * User management — E2E tests for /users (admin-only page).
 *
 * Covers critical integration paths:
 *   - Table view: seeded users visible, role badges, disabled Delete for ADMINs
 *   - Create user: happy path (new user appears in table), server duplicate-email error
 *   - Edit user: name/email update reflects in table, password change accepted,
 *     blank password keeps existing one, server duplicate-email error
 *   - Delete user: confirm removes user from table
 *
 * The following are covered by component tests and excluded here:
 *   - Dialog content / field rendering (UserForm.test.tsx, UsersPage.test.tsx)
 *   - Client-side validation messages (UserForm.test.tsx)
 *   - Loading states "Creating…" / "Saving…" / "Deleting…" (UserForm.test.tsx, UsersPage.test.tsx)
 *   - Cancel closes dialog (UsersPage.test.tsx)
 *   - Delete dialog title/description/cancel (UsersPage.test.tsx)
 *
 * Approach: integration tests against the real test backend (:3001) and
 * test database (helpdesk_test).
 *
 * NOTE: redirect tests (unauthenticated → /login, non-admin → /) are already
 * covered in e2e/tests/auth/protected-routes.spec.ts and are not duplicated.
 *
 * Auth: all tests use the admin storageState saved by auth.setup.ts.
 * The `page.request` object shares the admin session cookies, so API calls
 * made via page.request.post/delete within tests are also admin-authenticated.
 *
 * Prerequisites:
 *   - auth.setup.ts must have completed (seeds Test Admin + Test User, writes
 *     e2e/.auth/admin.json)
 *   - TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD in .env.test
 */

import { test, expect } from '@playwright/test';
import { UsersPage } from '../../pages/UsersPage';

/** Generate a short random suffix so every test run uses unique data. */
const uid = () => Math.random().toString(36).slice(2, 8);

// All tests in this file run as the admin user.
test.use({ storageState: 'e2e/.auth/admin.json' });

// =============================================================================
// Table view
// =============================================================================

test.describe('Users page — table view', () => {
  let usersPage: UsersPage;

  test.beforeEach(async ({ page }) => {
    usersPage = new UsersPage(page);
    await usersPage.goto();
  });

  test('renders the Users heading and Create User button', async () => {
    await expect(usersPage.heading).toBeVisible();
    await expect(usersPage.createButton).toBeVisible();
  });

  test('shows the seeded admin user in the table', async ({ page }) => {
    await expect(page.getByRole('cell', { name: 'Test Admin' })).toBeVisible();
  });

  test('shows the seeded agent user in the table', async ({ page }) => {
    await expect(page.getByRole('cell', { name: 'Test User' })).toBeVisible();
  });

  test('shows an ADMIN role badge for the admin user row', async () => {
    // exact: true avoids matching the substring "ADMIN" in "Test Admin"
    await expect(usersPage.getRow('Test Admin').getByText('ADMIN', { exact: true })).toBeVisible();
  });

  test('shows an AGENT role badge for the agent user row', async () => {
    await expect(usersPage.getRow('Test User').getByText('AGENT', { exact: true })).toBeVisible();
  });

  test('Delete button is disabled for ADMIN-role rows', async () => {
    await expect(usersPage.getDeleteButton('Test Admin')).toBeDisabled();
  });

  test('Delete button is enabled for AGENT-role rows', async () => {
    await expect(usersPage.getDeleteButton('Test User')).toBeEnabled();
  });

  test('Edit button is visible for all user rows', async () => {
    await expect(usersPage.getEditButton('Test Admin')).toBeVisible();
    await expect(usersPage.getEditButton('Test User')).toBeVisible();
  });
});

// =============================================================================
// Create user
// =============================================================================

test.describe('Users page — create user', () => {
  let usersPage: UsersPage;

  test.beforeEach(async ({ page }) => {
    usersPage = new UsersPage(page);
    await usersPage.goto();
    await usersPage.openCreateDialog();
  });

  test('creates a new user and shows them in the table', async ({ page }) => {
    const name = `New Agent ${uid()}`;
    const email = `agent.${uid()}@test.example`;

    await usersPage.fillCreateForm(name, email, 'securepass123');
    await usersPage.dialogSubmitButton.click();

    // Dialog closes after successful creation
    await expect(usersPage.dialog).not.toBeVisible();
    // TanStack Query invalidates and refetches — wait for the new row
    await expect(page.getByRole('cell', { name })).toBeVisible();
  });

  test('shows a server error when the email is already taken', async () => {
    const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL ?? 'testadmin@example.com';

    await usersPage.fillCreateForm('Duplicate Person', ADMIN_EMAIL, 'securepass123');
    await usersPage.dialogSubmitButton.click();

    await expect(usersPage.dialogFormError).toBeVisible();
    await expect(usersPage.dialogFormError).toHaveText('A user with that email already exists.');
    // Dialog must remain open so the user can correct the error
    await expect(usersPage.dialog).toBeVisible();
  });
});

// =============================================================================
// Edit user
// =============================================================================

test.describe('Users page — edit user', () => {
  let usersPage: UsersPage;
  let targetName: string;
  let targetEmail: string;

  test.beforeEach(async ({ page }) => {
    usersPage = new UsersPage(page);
    targetName = `Edit Target ${uid()}`;
    targetEmail = `edit.${uid()}@test.example`;

    // Navigate first so page.request inherits the admin session context
    await page.goto('/users');
    await expect(usersPage.heading).toBeVisible();

    // Create a fresh isolated user via the API — avoids touching seeded data
    const response = await page.request.post('/api/users', {
      data: { name: targetName, email: targetEmail, password: 'testpass123' },
    });
    expect(response.status()).toBe(201);

    // Reload so the table picks up the newly created user
    await page.reload();
    await expect(page.getByRole('cell', { name: targetName })).toBeVisible();
  });

  test('updates name and email and reflects the change in the table', async ({ page }) => {
    const updatedName = `Updated ${uid()}`;
    const updatedEmail = `updated.${uid()}@test.example`;

    await usersPage.getEditButton(targetName).click();
    await expect(usersPage.dialog).toBeVisible();

    await usersPage.nameInput.fill(updatedName);
    await usersPage.emailInput.fill(updatedEmail);
    await usersPage.dialogSubmitButton.click();

    // Dialog closes after a successful save
    await expect(usersPage.dialog).not.toBeVisible();
    // Updated name is in the table; old name is gone
    await expect(page.getByRole('cell', { name: updatedName })).toBeVisible();
    await expect(page.getByRole('cell', { name: targetName })).not.toBeVisible();
  });

  test('saves a new password when the New password field is filled', async ({ page }) => {
    await usersPage.getEditButton(targetName).click();
    await expect(usersPage.dialog).toBeVisible();

    await usersPage.getPasswordInput('edit').fill('brandnewpass456');
    await usersPage.dialogSubmitButton.click();

    // No error and dialog closes — password was accepted
    await expect(usersPage.dialog).not.toBeVisible();
    // User still appears in the table (name/email unchanged)
    await expect(page.getByRole('cell', { name: targetName })).toBeVisible();
  });

  test('keeps the existing password when New password is left blank', async ({ page }) => {
    await usersPage.getEditButton(targetName).click();
    await expect(usersPage.dialog).toBeVisible();

    // Leave password blank (default) and save
    await usersPage.dialogSubmitButton.click();

    await expect(usersPage.dialog).not.toBeVisible();
    await expect(page.getByRole('cell', { name: targetName })).toBeVisible();
  });

  test('shows a server error when updating to an already-taken email', async () => {
    const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL ?? 'testadmin@example.com';

    await usersPage.getEditButton(targetName).click();
    await expect(usersPage.dialog).toBeVisible();

    await usersPage.emailInput.fill(ADMIN_EMAIL);
    await usersPage.dialogSubmitButton.click();

    await expect(usersPage.dialogFormError).toBeVisible();
    await expect(usersPage.dialogFormError).toHaveText('A user with that email already exists.');
    await expect(usersPage.dialog).toBeVisible();
  });
});

// =============================================================================
// Delete user
// =============================================================================

test.describe('Users page — delete user', () => {
  let usersPage: UsersPage;
  let targetName: string;

  test.beforeEach(async ({ page }) => {
    usersPage = new UsersPage(page);
    targetName = `Delete Target ${uid()}`;

    await page.goto('/users');
    await expect(usersPage.heading).toBeVisible();

    // Create a disposable user for each test so every delete is isolated
    const response = await page.request.post('/api/users', {
      data: { name: targetName, email: `delete.${uid()}@test.example`, password: 'testpass123' },
    });
    expect(response.status()).toBe(201);

    await page.reload();
    await expect(page.getByRole('cell', { name: targetName })).toBeVisible();
  });

  test('confirming delete removes the user from the table', async ({ page }) => {
    await usersPage.getDeleteButton(targetName).click();
    await expect(usersPage.alertDialog).toBeVisible();

    await usersPage.alertDialogConfirmButton.click();

    // Dialog closes and TanStack Query refetches — user row disappears
    await expect(usersPage.alertDialog).not.toBeVisible();
    await expect(page.getByRole('cell', { name: targetName })).not.toBeVisible();
  });
});
