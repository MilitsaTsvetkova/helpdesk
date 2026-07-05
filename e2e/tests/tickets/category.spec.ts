/**
 * Ticket category feature — E2E tests.
 *
 * Covers three integration surfaces added by the category field:
 *
 * 1. Category filter on /tickets:
 *    - Dropdown opens and exposes all 5 category options
 *    - Single-category filter shows only matching tickets
 *    - Multi-category filter shows tickets from all selected categories
 *    - Reset button clears the filter and restores the unfiltered view
 *
 * 2. Category column in the tickets table:
 *    - Correct human-readable label ("Software", "Hardware", etc.) for a
 *      categorized ticket
 *    - Em dash "—" for a ticket whose category is null (uncategorized)
 *
 * 3. Category select on /tickets/:id:
 *    - Correct label shown when navigating to a ticket with a category
 *    - "Uncategorized" shown for tickets with null category
 *    - Picking a new option PATCHes the server and updates the trigger label
 *    - Picking "Uncategorized" sends null and updates the trigger label
 *
 * The following are covered by component/unit tests and excluded here:
 *   - Category cell rendering in isolation (TicketsTable.test.tsx)
 *   - "Failed to save" error on PATCH failure (TicketDetailPage.test.tsx)
 *
 * Approach: integration tests against the real test backend (:3001) and the
 * helpdesk_test database. All test data is created programmatically — no
 * reliance on seeded data that may not be present after multiple test runs.
 *
 * Ticket creation uses a two-step approach:
 *   1. POST /api/tickets/inbound-email (public) — creates the ticket with null category
 *   2. PATCH /api/tickets/:id (requireAuth) — sets the desired category
 *
 * The page.request object shares the admin session cookies from storageState, so
 * authenticated PATCH calls work without a separate auth step.
 *
 * Auth: all tests run as the admin user (e2e/.auth/admin.json).
 *
 * Prerequisites:
 *   - auth.setup.ts must have completed (writes e2e/.auth/admin.json)
 *   - TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD set in .env.test
 */

import { test, expect, type Page } from '@playwright/test';
import { TicketsPage } from '../../pages/TicketsPage';
import { TicketDetailPage } from '../../pages/TicketDetailPage';

// All tests in this file run as the admin user.
test.use({ storageState: 'e2e/.auth/admin.json' });

/** Short random suffix to produce unique ticket subjects across test runs. */
const uid = () => Math.random().toString(36).slice(2, 8);

/** Webhook secret expected by the test server (set in playwright.config.ts). */
const WEBHOOK_SECRET = 'test-inbound-webhook-secret-e2e';

/**
 * Creates a ticket with the given category in two API calls:
 *   1. POST /api/tickets/inbound-email — public; returns ticket id.
 *   2. PATCH /api/tickets/:id — authenticated; sets the category.
 *
 * The `page` argument must belong to a test that uses the admin storageState so
 * that page.request carries the session cookie needed for the PATCH.
 *
 * @param category  TicketCategory enum value, e.g. "HARDWARE", "NETWORK".
 * @returns         The new ticket's numeric id.
 */
async function seedCategorizedTicket(
  page: Page,
  subject: string,
  category: string,
): Promise<number> {
  const createRes = await page.request.post('/api/tickets/inbound-email', {
    data: {
      from: 'seed@example.com',
      fromName: 'Seed User',
      subject,
      text: 'E2E test ticket body.',
    },
    headers: { 'X-Webhook-Secret': WEBHOOK_SECRET },
  });
  if (!createRes.ok()) {
    throw new Error(
      `seedCategorizedTicket: POST failed (${createRes.status()}) — ${await createRes.text()}`,
    );
  }
  const { id } = (await createRes.json()) as { id: number };

  const patchRes = await page.request.patch(`/api/tickets/${id}`, {
    data: { category },
  });
  if (!patchRes.ok()) {
    throw new Error(
      `seedCategorizedTicket: PATCH failed (${patchRes.status()}) — ${await patchRes.text()}`,
    );
  }

  return id;
}

// =============================================================================
// Category filter dropdown on /tickets
// =============================================================================

test.describe('Tickets list — category filter dropdown', () => {
  test('opens and shows all 5 category options', async ({ page }) => {
    const ticketsPage = new TicketsPage(page);
    await ticketsPage.goto();

    await ticketsPage.categoryFilterButton.click();

    await expect(page.getByRole('menuitemcheckbox', { name: 'Hardware' })).toBeVisible();
    await expect(page.getByRole('menuitemcheckbox', { name: 'Software' })).toBeVisible();
    await expect(page.getByRole('menuitemcheckbox', { name: 'Network' })).toBeVisible();
    await expect(page.getByRole('menuitemcheckbox', { name: 'Access' })).toBeVisible();
    await expect(page.getByRole('menuitemcheckbox', { name: 'Other' })).toBeVisible();
  });

  test('selecting a single category filters the list to matching tickets only', async ({ page }) => {
    const networkSubject = `VPN drops ${uid()}`;
    const hardwareSubject = `Monitor broken ${uid()}`;

    await seedCategorizedTicket(page, networkSubject, 'NETWORK');
    await seedCategorizedTicket(page, hardwareSubject, 'HARDWARE');

    const ticketsPage = new TicketsPage(page);
    await ticketsPage.goto();

    // Apply the Network-only filter
    await ticketsPage.categoryFilterButton.click();
    await page.getByRole('menuitemcheckbox', { name: 'Network' }).click();
    await page.keyboard.press('Escape');

    // The Network ticket should be visible; the Hardware ticket should not
    await expect(ticketsPage.getRow(networkSubject)).toBeVisible();
    await expect(ticketsPage.getRow(hardwareSubject)).not.toBeVisible();
  });

  test('selecting multiple categories shows tickets from all selected categories', async ({ page }) => {
    const networkSubject = `Network ticket ${uid()}`;
    const softwareSubject = `Software ticket ${uid()}`;
    const hardwareSubject = `Hardware ticket ${uid()}`;

    await seedCategorizedTicket(page, networkSubject, 'NETWORK');
    await seedCategorizedTicket(page, softwareSubject, 'SOFTWARE');
    await seedCategorizedTicket(page, hardwareSubject, 'HARDWARE');

    const ticketsPage = new TicketsPage(page);
    await ticketsPage.goto();

    // Select Network then Software — dropdown stays open between clicks
    await ticketsPage.categoryFilterButton.click();
    await page.getByRole('menuitemcheckbox', { name: 'Network' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Software' }).click();
    await page.keyboard.press('Escape');

    // Both Network and Software tickets appear in the filtered results
    await expect(ticketsPage.getRow(networkSubject)).toBeVisible();
    await expect(ticketsPage.getRow(softwareSubject)).toBeVisible();
    // Hardware ticket is excluded by the filter
    await expect(ticketsPage.getRow(hardwareSubject)).not.toBeVisible();
  });

  test('Reset button clears the category filter and restores the unfiltered view', async ({ page }) => {
    const accessSubject = `Access request ${uid()}`;
    const networkSubject = `Network problem ${uid()}`;

    await seedCategorizedTicket(page, accessSubject, 'ACCESS');
    await seedCategorizedTicket(page, networkSubject, 'NETWORK');

    const ticketsPage = new TicketsPage(page);
    await ticketsPage.goto();

    // Apply Access filter — the Network ticket should be excluded
    await ticketsPage.categoryFilterButton.click();
    await page.getByRole('menuitemcheckbox', { name: 'Access' }).click();
    await page.keyboard.press('Escape');

    // Confirm the filter is active by checking the Reset button appears
    await expect(ticketsPage.resetButton).toBeVisible();

    // The Access ticket must be visible; Network ticket must be hidden
    await expect(ticketsPage.getRow(accessSubject)).toBeVisible();
    await expect(ticketsPage.getRow(networkSubject)).not.toBeVisible();

    // Click Reset to clear all filters
    await ticketsPage.resetButton.click();

    // Reset button disappears now that no filters are active
    await expect(ticketsPage.resetButton).not.toBeVisible();

    // Category trigger label reverts to the default "Category"
    await expect(ticketsPage.categoryFilterButton).toBeVisible();

    // Both tickets are visible again in the unfiltered view
    await expect(ticketsPage.getRow(accessSubject)).toBeVisible();
    await expect(ticketsPage.getRow(networkSubject)).toBeVisible();
  });
});

// =============================================================================
// Category column in the tickets table
// =============================================================================

test.describe('Tickets list — category column', () => {
  test('shows the correct human-readable label for a categorized ticket', async ({ page }) => {
    const subject = `Software install ${uid()}`;
    await seedCategorizedTicket(page, subject, 'SOFTWARE');

    const ticketsPage = new TicketsPage(page);
    await ticketsPage.goto();

    // The row for this ticket should display "Software" in the Category column.
    // Use exact: true to avoid matching "Software" within the subject text itself.
    await expect(ticketsPage.getRow(subject).getByText('Software', { exact: true })).toBeVisible();
  });

  test('shows an em dash for a ticket with null category', async ({ page }) => {
    const subject = `Uncategorized ticket ${uid()}`;

    // Tickets created via inbound-email always have category = null
    const createRes = await page.request.post('/api/tickets/inbound-email', {
      data: {
        from: 'seed@example.com',
        fromName: 'Seed User',
        subject,
        text: 'E2E test ticket body.',
      },
      headers: { 'X-Webhook-Secret': WEBHOOK_SECRET },
    });
    expect(createRes.ok()).toBe(true);

    const ticketsPage = new TicketsPage(page);
    await ticketsPage.goto();

    // Null category renders the em dash character "—"
    await expect(ticketsPage.getRow(subject).getByText('—')).toBeVisible();
  });
});

// =============================================================================
// Category select on the ticket detail page (/tickets/:id)
// =============================================================================

test.describe('Ticket detail page — category select', () => {
  test('shows the correct category label for a categorized ticket', async ({ page }) => {
    const subject = `Detail hardware ${uid()}`;
    const id = await seedCategorizedTicket(page, subject, 'HARDWARE');

    const detailPage = new TicketDetailPage(page);
    await detailPage.goto(id);

    // The Category combobox trigger should display "Hardware"
    await expect(detailPage.getCategoryTrigger('Hardware')).toBeVisible();
  });

  test('shows Uncategorized for a ticket with null category', async ({ page }) => {
    const subject = `Detail no category ${uid()}`;
    const createRes = await page.request.post('/api/tickets/inbound-email', {
      data: {
        from: 'seed@example.com',
        fromName: 'Seed User',
        subject,
        text: 'E2E test ticket body.',
      },
      headers: { 'X-Webhook-Secret': WEBHOOK_SECRET },
    });
    const { id } = (await createRes.json()) as { id: number };

    const detailPage = new TicketDetailPage(page);
    await detailPage.goto(id);

    // Null category maps to the "Uncategorized" Select item
    await expect(detailPage.getCategoryTrigger('Uncategorized')).toBeVisible();
  });

  test('changing the category updates the trigger label after the PATCH succeeds', async ({ page }) => {
    const subject = `Change category ${uid()}`;
    const id = await seedCategorizedTicket(page, subject, 'HARDWARE');

    const detailPage = new TicketDetailPage(page);
    await detailPage.goto(id);

    // Confirm the current value is "Hardware"
    await expect(detailPage.getCategoryTrigger('Hardware')).toBeVisible();

    // Open the Category Select and pick "Network"
    await detailPage.getCategoryTrigger('Hardware').click();
    await page.getByRole('option', { name: 'Network' }).click();

    // Trigger should update to "Network" once the PATCH response arrives
    await expect(detailPage.getCategoryTrigger('Network')).toBeVisible();
    // No error message should appear
    await expect(detailPage.failedToSaveMessage).not.toBeVisible();
  });

  test('selecting Uncategorized sends null to the server and updates the trigger', async ({ page }) => {
    const subject = `Clear category ${uid()}`;
    const id = await seedCategorizedTicket(page, subject, 'ACCESS');

    const detailPage = new TicketDetailPage(page);
    await detailPage.goto(id);

    // Confirm the current value is "Access"
    await expect(detailPage.getCategoryTrigger('Access')).toBeVisible();

    // Open and select "Uncategorized" (sends { category: null } to the API)
    await detailPage.getCategoryTrigger('Access').click();
    await page.getByRole('option', { name: 'Uncategorized' }).click();

    // Trigger should update to "Uncategorized" once the PATCH response arrives
    await expect(detailPage.getCategoryTrigger('Uncategorized')).toBeVisible();
    await expect(detailPage.failedToSaveMessage).not.toBeVisible();
  });
});
