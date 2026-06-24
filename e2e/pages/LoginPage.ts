/**
 * Page Object Model for /login
 *
 * Mirrors the LoginPage React component which uses:
 *   - shadcn/ui Form + FormLabel (renders a <label> wrapping the input)
 *   - react-hook-form + zod for client-side validation
 *   - Root-level error as a plain <p> (not role="alert")
 *   - Submit button text alternates: "Sign in" / "Signing in…"
 */

import { type Page, type Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;

  // Form inputs — matched by the <label> text rendered by FormLabel
  readonly emailInput: Locator;
  readonly passwordInput: Locator;

  // Submit button
  readonly submitButton: Locator;

  // Inline validation messages rendered by FormMessage (one per field)
  readonly emailError: Locator;
  readonly passwordError: Locator;

  // Root-level error (wrong credentials, server error) — rendered as a <p>
  // inside a red box. No semantic role="alert" is used in the component.
  readonly rootError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: /^Sign in$/ });

    // FormMessage renders a <p> with data-slot="form-message"
    this.emailError = page
      .locator('[data-slot="form-item"]')
      .filter({ has: page.getByLabel('Email') })
      .locator('[data-slot="form-message"]');

    this.passwordError = page
      .locator('[data-slot="form-item"]')
      .filter({ has: page.getByLabel('Password') })
      .locator('[data-slot="form-message"]');

    // Root error — the red <p> rendered when form.formState.errors.root is set
    this.rootError = page.locator('p.text-red-600');
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  /** Fill only the email field (leave password empty — useful for validation tests) */
  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  /** Fill only the password field (leave email empty — useful for validation tests) */
  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  /** Click the submit button (regardless of whether fields are filled) */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}
