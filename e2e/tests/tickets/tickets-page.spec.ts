/**
 * Tickets list page — E2E tests for /tickets.
 *
 * Covers critical integration paths:
 *   - Clicking the Tickets nav link navigates to /tickets
 *   - Seeded ticket data (subject, fromName, fromEmail, status badge) appears
 *     in the table — verifies the full inbound-email → DB → API → UI flow
 *   - Tickets are ordered newest first
 *   - Unauthenticated visitors are redirected to /login
 *   - An agent (non-admin) user can access /tickets without being redirected
 *
 * The following are covered by component tests and excluded here:
 *   - "Tickets" heading renders (TicketsPage.test.tsx)
 *   - Tickets nav link is visible in navbar (TicketsPage.test.tsx)
 *   - "No tickets found." empty state (TicketsTable.test.tsx)
 *
 * Approach: integration tests against the real test backend (:3001) and
 * helpdesk_test database. Ticket seeding uses POST /api/tickets/inbound-email
 * with the webhook secret — no auth session required.
 *
 * NOTE: redirect tests for admin-only routes are covered in
 * e2e/tests/auth/protected-routes.spec.ts and are not duplicated here.
 *
 * Auth:
 *   - Most tests use the agent user storageState (e2e/.auth/user.json)
 *   - The unauthenticated redirect test uses the default browser context
 *
 * Prerequisites:
 *   - auth.setup.ts must have completed (writes e2e/.auth/user.json and
 *     e2e/.auth/admin.json)
 *   - TEST_USER_EMAIL / TEST_USER_PASSWORD set in .env.test
 */

import { test, expect, type Page } from '@playwright/test';
import { TicketsPage } from '../../pages/TicketsPage';

/** Short random suffix — ensures unique subjects across parallel test runs. */
const uid = () => Math.random().toString(36).slice(2, 8);

/** Webhook secret that the test server is started with (set in playwright.config.ts). */
const WEBHOOK_SECRET = 'test-inbound-webhook-secret-e2e';

/**
 * Seed a ticket via the inbound-email webhook endpoint.
 * This endpoint is public — no auth session is needed.
 */
async function seedTicket(
  page: Page,
  subject: string,
  options: { from?: string; fromName?: string } = {},
): Promise<{ id: number; subject: string; fromEmail: string; status: string }> {
  const response = await page.request.post('/api/tickets/inbound-email', {
    data: {
      from: options.from ?? 'alice@example.com',
      fromName: options.fromName ?? 'Alice Smith',
      subject,
      text: 'Help!',
    },
    headers: { 'X-Webhook-Secret': WEBHOOK_SECRET },
  });
  if (!response.ok()) {
    throw new Error(`seedTicket failed — status ${response.status()}: ${await response.text()}`);
  }
  return response.json();
}

// =============================================================================
// Navbar navigation
// =============================================================================

test.describe('Tickets nav link', () => {
  test.use({ storageState: 'e2e/.auth/user.json' });

  test('clicking the Tickets nav link navigates to /tickets', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation').getByRole('link', { name: 'Tickets' }).click();
    await page.waitForURL('/tickets');
    await expect(page.getByRole('heading', { name: 'Tickets' })).toBeVisible();
  });
});

// =============================================================================
// Table content — seeded data (full stack integration)
// =============================================================================

test.describe('Tickets page — table content', () => {
  test.use({ storageState: 'e2e/.auth/user.json' });

  test('shows the subject of a seeded ticket', async ({ page }) => {
    const subject = `Keyboard broken ${uid()}`;
    await seedTicket(page, subject);

    const ticketsPage = new TicketsPage(page);
    await ticketsPage.goto();

    await expect(page.getByRole('cell', { name: subject })).toBeVisible();
  });

  test('shows the sender name and email for a seeded ticket', async ({ page }) => {
    const subject = `Sender info test ${uid()}`;
    const fromName = `Bob Jones ${uid()}`;
    const from = `bob.${uid()}@example.com`;

    await seedTicket(page, subject, { fromName, from });

    const ticketsPage = new TicketsPage(page);
    await ticketsPage.goto();

    const row = ticketsPage.getRow(subject);
    await expect(row.getByText(fromName)).toBeVisible();
    await expect(row.getByText(from)).toBeVisible();
  });

  test('shows an "Open" status badge for a newly created ticket', async ({ page }) => {
    const subject = `Status badge test ${uid()}`;
    await seedTicket(page, subject);

    const ticketsPage = new TicketsPage(page);
    await ticketsPage.goto();

    // Newly seeded tickets always have status OPEN → rendered as "Open"
    const row = ticketsPage.getRow(subject);
    await expect(row.getByText('Open')).toBeVisible();
  });
});

// =============================================================================
// Ordering — newest first
// =============================================================================

test.describe('Tickets page — ordering', () => {
  test.use({ storageState: 'e2e/.auth/user.json' });

  test('newer ticket appears above the older one in the table', async ({ page }) => {
    const subjectOlder = `Older ticket ${uid()}`;
    const subjectNewer = `Newer ticket ${uid()}`;

    // Seed in sequence — the second one gets a later createdAt timestamp
    await seedTicket(page, subjectOlder);
    await seedTicket(page, subjectNewer);

    const ticketsPage = new TicketsPage(page);
    await ticketsPage.goto();

    // allTextContents() returns row text in DOM order (top to bottom)
    const rowTexts = await page.getByRole('row').allTextContents();
    const indexOlder = rowTexts.findIndex((t) => t.includes(subjectOlder));
    const indexNewer = rowTexts.findIndex((t) => t.includes(subjectNewer));

    expect(indexOlder).toBeGreaterThan(-1);
    expect(indexNewer).toBeGreaterThan(-1);
    // The newer ticket (higher createdAt) must be earlier in the list
    expect(indexNewer).toBeLessThan(indexOlder);
  });
});

// =============================================================================
// Unauthenticated redirect
// =============================================================================

test.describe('Tickets page — unauthenticated redirect', () => {
  // No storageState — default browser context has no session cookies.

  test('redirects to /login when not authenticated', async ({ page }) => {
    await page.goto('/tickets');
    await page.waitForURL('/login');
    await expect(page.getByLabel('Email')).toBeVisible();
  });
});

// =============================================================================
// Role access — agent user can reach /tickets
// =============================================================================

test.describe('Tickets page — agent role access', () => {
  // user.json holds a session for the AGENT-role test user (not admin).
  test.use({ storageState: 'e2e/.auth/user.json' });

  test('an agent (non-admin) user can access /tickets without being redirected', async ({ page }) => {
    const ticketsPage = new TicketsPage(page);
    await ticketsPage.goto();

    // If the agent were redirected, goto() would never resolve because
    // heading.waitFor() would time out on a different page.
    await expect(ticketsPage.heading).toBeVisible();
    await expect(page).toHaveURL('/tickets');
  });
});
