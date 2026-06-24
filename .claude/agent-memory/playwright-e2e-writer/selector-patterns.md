---
name: selector-patterns
description: Reliable selectors for shadcn/ui components and app-specific elements in this project
metadata:
  type: project
---

## shadcn/ui form components

`FormItem` renders a `<div data-slot="form-item">`.
`FormLabel` renders a `<label data-slot="form-label" htmlFor={formItemId}>` — `getByLabel()` works correctly.
`FormControl` sets `id={formItemId}` on the wrapped input — wires up the label association.
`FormMessage` renders a `<p data-slot="form-message">` when there's a validation error.

### Field-specific validation errors

```ts
// Error message for a specific field
page.locator('[data-slot="form-item"]')
  .filter({ has: page.getByLabel('Email') })
  .locator('[data-slot="form-message"]')
```

### Root-level form error (wrong credentials)

LoginPage renders the root error as `<p className="text-sm text-red-600 ...">`. No `role="alert"`.

```ts
page.locator('p.text-red-600')
```

## Navbar

- `page.getByRole('navigation')` — the `<nav>` element in Navbar.tsx
- Logout button: `navbar.getByRole('button', { name: 'Logout' })`
- Users nav link (admin only): `navbar.getByRole('link', { name: 'Users' })`
- User display name: `navbar.getByText(/Test User|testuser@example/)` — Navbar renders `user.name || user.email`

## Login form

- Email: `page.getByLabel('Email')`
- Password: `page.getByLabel('Password')`
- Submit: `page.getByRole('button', { name: /^Sign in$/ })`
- Loading state: `page.getByRole('button', { name: 'Signing in…' })`
