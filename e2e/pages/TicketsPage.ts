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

  /**
   * The "Category" dropdown trigger button in the filter bar.
   * The button label changes based on the active selection:
   *   - "Category"        → no filter applied
   *   - "Hardware"        → exactly one category selected
   *   - "Category (2)"   → two or more categories selected
   *
   * Use this locator when no filter is active (label is "Category"). Once a
   * category is selected, locate by the updated label directly in the test.
   */
  readonly categoryFilterButton: Locator;

  /**
   * The "Reset" ghost button that appears in the filter bar whenever at least
   * one filter (search, status, category, or assignedTo) is active.
   * Clicking it clears all filters and hides itself.
   */
  readonly resetButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Tickets' });
    this.table = page.getByRole('table');
    this.emptyState = page.getByText('No tickets found.');
    this.errorMessage = page.locator('p.text-red-600');
    this.categoryFilterButton = page.getByRole('button', { name: 'Category' });
    this.resetButton = page.getByRole('button', { name: 'Reset' });
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
