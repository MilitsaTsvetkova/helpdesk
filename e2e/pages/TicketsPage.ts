/**
 * Page Object Model for /tickets (accessible to all authenticated users).
 *
 * Wraps the page heading, navbar link, and tickets table.
 * Tests using this POM must run with a valid storageState (user.json or
 * admin.json) written by auth.setup.ts, except for redirect/unauthenticated
 * tests which use the default browser context.
 */

import { type Page, type Locator } from '@playwright/test';

export class TicketsPage {
  readonly page: Page;

  /** The main "Tickets" h1 heading on the /tickets page. */
  readonly heading: Locator;

  /** The tickets <table> element. */
  readonly table: Locator;

  /**
   * The "No tickets found." cell rendered when the ticket list is empty.
   * Spans all 5 columns via colSpan.
   */
  readonly emptyState: Locator;

  /**
   * The red error paragraph rendered by TicketsTable when the API call fails.
   * Rendered as: <p class="text-sm text-red-600">{error.message}</p>
   */
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Tickets' });
    this.table = page.getByRole('table');
    this.emptyState = page.getByText('No tickets found.');
    this.errorMessage = page.locator('p.text-red-600');
  }

  async goto(): Promise<void> {
    await this.page.goto('/tickets');
    await this.heading.waitFor();
  }

  /**
   * Returns a locator for the "Tickets" link in the top navigation bar.
   * This link is visible to all authenticated users (not admin-only).
   */
  get navLink(): Locator {
    return this.page.getByRole('navigation').getByRole('link', { name: 'Tickets' });
  }

  /**
   * Returns a locator scoped to the table row containing the given ticket
   * subject text. Useful for asserting per-ticket cells (fromName, fromEmail,
   * status badge) without cross-row ambiguity.
   */
  getRow(subject: string): Locator {
    return this.page.getByRole('row').filter({ hasText: subject });
  }
}
