/**
 * Page Object Model for /tickets/:id (ticket detail page).
 *
 * The right panel of the detail page has four Select (combobox) controls in
 * this order: Status, Source, Category, Assigned To. Because every control
 * shows a distinct domain value, each combobox can be reliably located by the
 * text it currently displays. getCategoryTrigger() encapsulates that lookup for
 * the Category select.
 *
 * The category value labels ("Hardware", "Software", "Network", "Access",
 * "Other", "Uncategorized") do not overlap with status labels
 * ("Open", "In Progress", "Resolved", "Closed") or source labels
 * ("Email", "Web"), so disambiguation by displayed name is safe.
 */

import { type Page, type Locator } from '@playwright/test';

export class TicketDetailPage {
  readonly page: Page;

  /** "← Back to tickets" link — used as the page-loaded anchor in goto(). */
  readonly backLink: Locator;

  /**
   * "Failed to save" error message shown in the right panel when a PATCH
   * mutation fails. Rendered as: <p class="text-xs text-red-500">Failed to save</p>
   */
  readonly failedToSaveMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.backLink = page.getByRole('link', { name: 'Back to tickets' });
    this.failedToSaveMessage = page.getByText('Failed to save');
  }

  async goto(id: number): Promise<void> {
    await this.page.goto(`/tickets/${id}`);
    await this.backLink.waitFor();
  }

  /**
   * Returns the Category Select trigger (a combobox button) identified by its
   * currently displayed label, e.g. "Hardware", "Network", "Uncategorized".
   *
   * Pass the human-readable label (not the enum value — "Hardware" not
   * "HARDWARE", "Uncategorized" not "uncategorized").
   */
  getCategoryTrigger(currentLabel: string): Locator {
    return this.page.getByRole('combobox', { name: currentLabel });
  }
}
