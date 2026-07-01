/**
 * Page Object Model for /users (admin-only user management page).
 *
 * Wraps the main table, the create/edit Dialog, and the delete AlertDialog.
 * All tests using this POM must run with admin storageState
 * (e2e/.auth/admin.json written by auth.setup.ts).
 *
 * Dialog roles (Radix UI defaults):
 *   - Create/Edit form → role="dialog"      → getByRole('dialog')
 *   - Delete confirmation → role="alertdialog" → getByRole('alertdialog')
 */

import { type Page, type Locator } from '@playwright/test';

export class UsersPage {
  readonly page: Page;

  // Page-level elements
  readonly heading: Locator;
  readonly createButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Users' });
    this.createButton = page.getByRole('button', { name: 'Create User' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/users');
    await this.heading.waitFor();
  }

  // ---------------------------------------------------------------------------
  // Table helpers
  // ---------------------------------------------------------------------------

  /**
   * Locator for a table row whose text content includes the given user name.
   * Excludes the header row automatically because the header cells do not
   * contain user names.
   */
  getRow(name: string): Locator {
    return this.page.getByRole('row').filter({ hasText: name });
  }

  /** The Edit button inside the row for the given user name. */
  getEditButton(name: string): Locator {
    return this.getRow(name).getByRole('button', { name: 'Edit' });
  }

  /** The Delete button inside the row for the given user name. */
  getDeleteButton(name: string): Locator {
    return this.getRow(name).getByRole('button', { name: 'Delete' });
  }

  // ---------------------------------------------------------------------------
  // Create / Edit Dialog (role="dialog")
  // ---------------------------------------------------------------------------

  /** The shadcn Dialog element rendered for the create/edit form. */
  get dialog(): Locator {
    return this.page.getByRole('dialog');
  }

  /**
   * Heading inside the dialog.
   * Text is "Create User" in create mode and "Edit User" in edit mode.
   */
  get dialogTitle(): Locator {
    return this.page.getByRole('dialog').getByRole('heading');
  }

  /** Name input — matched by its FormLabel text "Name". */
  get nameInput(): Locator {
    return this.page.getByLabel('Name');
  }

  /** Email input — matched by its FormLabel text "Email". */
  get emailInput(): Locator {
    return this.page.getByLabel('Email');
  }

  /**
   * Password input. The label differs by form mode:
   *   - create → "Password"
   *   - edit   → "New password"
   */
  getPasswordInput(mode: 'create' | 'edit'): Locator {
    return mode === 'edit'
      ? this.page.getByLabel('New password')
      : this.page.getByLabel('Password');
  }

  /**
   * Submit button inside the dialog.
   * Text is "Create" in create mode and "Save" in edit mode.
   * Uses a regex so one locator covers both without knowing the mode.
   */
  get dialogSubmitButton(): Locator {
    return this.page.getByRole('dialog').getByRole('button', { name: /^(Create|Save)$/ });
  }

  /** Cancel button inside the form dialog. */
  get dialogCancelButton(): Locator {
    return this.page.getByRole('dialog').getByRole('button', { name: 'Cancel' });
  }

  /**
   * Root-level form error (server-side) rendered inside the dialog as:
   *   <p class="text-sm text-red-600">...</p>
   *
   * Field-level errors use shadcn FormMessage (data-slot="form-message") with
   * the Tailwind `text-destructive` class — a different class — so this
   * locator is unambiguous.
   */
  get dialogFormError(): Locator {
    return this.page.getByRole('dialog').locator('p.text-red-600');
  }

  /**
   * Field-level validation message for the field identified by `label`.
   * shadcn FormMessage renders a <p data-slot="form-message"> inside the
   * FormItem that wraps the labelled input.
   */
  getFieldError(label: string): Locator {
    return this.page
      .locator('[data-slot="form-item"]')
      .filter({ has: this.page.getByLabel(label) })
      .locator('[data-slot="form-message"]');
  }

  /** Open the Create User dialog and wait for it to be visible. */
  async openCreateDialog(): Promise<void> {
    await this.createButton.click();
    await this.dialog.waitFor({ state: 'visible' });
  }

  /** Fill all three fields in the create form. */
  async fillCreateForm(name: string, email: string, password: string): Promise<void> {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.getPasswordInput('create').fill(password);
  }

  // ---------------------------------------------------------------------------
  // Delete AlertDialog (role="alertdialog")
  // ---------------------------------------------------------------------------

  /** The shadcn AlertDialog element rendered for delete confirmations. */
  get alertDialog(): Locator {
    return this.page.getByRole('alertdialog');
  }

  /**
   * Title heading inside the alert dialog.
   * Text is "Delete {name}?" where {name} is the user being deleted.
   */
  get alertDialogTitle(): Locator {
    return this.page.getByRole('alertdialog').getByRole('heading');
  }

  /** Description text inside the alert dialog. */
  get alertDialogDescription(): Locator {
    return this.page.getByRole('alertdialog').getByText('This action cannot be undone.');
  }

  /** Cancel button inside the alert dialog. */
  get alertDialogCancelButton(): Locator {
    return this.page.getByRole('alertdialog').getByRole('button', { name: 'Cancel' });
  }

  /**
   * Confirm (Delete) button inside the alert dialog.
   * Text alternates: "Delete" (idle) / "Deleting…" (in flight).
   */
  get alertDialogConfirmButton(): Locator {
    return this.page.getByRole('alertdialog').getByRole('button', { name: 'Delete' });
  }
}
