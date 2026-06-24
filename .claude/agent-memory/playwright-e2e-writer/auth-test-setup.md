---
name: auth-test-setup
description: How test users are seeded, where storageState lives, and the project structure for authenticated E2E tests
metadata:
  type: project
---

## Test user seeding

Sign-up is **disabled** in the app (`disableSignUp: true` in `server/src/lib/auth.ts`). Test users are seeded via `e2e/scripts/seed-test-users.ts`, which:
- Runs from `server/` directory so `better-auth` and Prisma resolve from `server/node_modules`
- Imports `hashPassword` from `better-auth/crypto` to produce hashes compatible with Better Auth's login verification
- Uses `PrismaPg` adapter from `@prisma/adapter-pg` (same as the server)
- Upserts both users (idempotent): AGENT user + ADMIN user

## Credentials (from .env.test)

- `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` — regular AGENT user (name: "Test User")
- `TEST_ADMIN_EMAIL` / `TEST_ADMIN_PASSWORD` — ADMIN user (name: "Test Admin")
- `BETTER_AUTH_SECRET` — must match the secret the test server uses

## storageState

- Saved to: `e2e/.auth/user.json` (gitignored, produced by `e2e/auth.setup.ts`)
- Contains the regular AGENT user's session cookies
- Tests that need auth use `test.use({ storageState: 'e2e/.auth/user.json' })` at the describe block level

## Playwright project structure

```
setup project  → runs auth.setup.ts (seeds users + saves storageState)
chromium       → runs all other tests, depends on setup
```

Tests that need auth use `test.use({ storageState })` inline — there is no separate authenticated project.

## .env.test additions needed

Beyond the original `TEST_DATABASE_URL`, these vars must be set:
- `BETTER_AUTH_SECRET`
- `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`
- `TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD`
