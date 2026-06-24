---
name: app-facts
description: Critical facts about this helpdesk app that affect how E2E tests must be written
metadata:
  type: project
---

## Auth

- **Sign-up is disabled** in the running app (`disableSignUp: true`). There is no registration page or flow to test.
- Login uses Better Auth's email+password strategy via `/api/auth/sign-in/email`.
- Auth rate-limiter: 10 requests per 15 minutes on `/api/auth/*`. Tests that repeatedly fail login may hit this.
- `BETTER_AUTH_SECRET` is required by the server; must be set in `.env.test` and passed via `playwright.config.ts` webServer env.

## Routing

- `/login` — public, no auth required. Redirects to `/` if already authenticated (useEffect in LoginPage).
- `/` — protected by `ProtectedRoute`. Redirects to `/login` if no session.
- `/users` — protected by both `ProtectedRoute` and `AdminRoute`. Redirects non-admins to `/`.
- Unknown paths inside the app catch-all: redirected to `/` by a `<Route path="*" element={<Navigate to="/" />}>`.
- `ProtectedRoute` and `AdminRoute` render `null` while `isPending` is true — allow time for session resolution before asserting redirects.

## Roles

Two roles: `AGENT` (default) and `ADMIN`. Stored as PostgreSQL enum in the `user` table.
- Admin: sees "Users" link in navbar, can access `/users`.
- Agent: no Users link, redirected from `/users` to `/`.

## UI

- Navbar is a `<nav>` element, present only when authenticated (rendered inside `ProtectedRoute`).
- Home page content: `<h2>Welcome to Helpdesk</h2>` (note: `h2`, not `h1`).
- Users page content: `<h1>Users</h1>`.

## Password validation

Client-side (zod schema in LoginPage.tsx):
- Email: must be valid email format. Error: "Invalid email address"
- Password: minimum 8 characters. Error: "Password must be at least 8 characters"
