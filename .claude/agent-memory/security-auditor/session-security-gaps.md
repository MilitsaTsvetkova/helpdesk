---
name: session-security-gaps
description: Session and cookie security gaps found in initial auth audit
metadata:
  type: project
---

Key gaps found (2026-06-22 audit):

1. `BETTER_AUTH_SECRET` env var exists in server/.env but is NOT passed into the `betterAuth()` config object in server/src/lib/auth.ts. Better Auth falls back to auto-generating or using a default secret — unverified behavior but a configuration gap.

2. `SESSION_SECRET` env var is set to `change-me-in-production` in both .env and .env.example but is never used anywhere in the codebase. express-session is installed but not wired up.

3. No cookie hardening options (secure, sameSite, httpOnly) are explicitly set in the Better Auth config. These may be handled by Better Auth's defaults — but defaults should be verified and explicitly configured for production.

4. No session expiry override configured in betterAuth().

**How to apply:** When reviewing future auth changes, check whether BETTER_AUTH_SECRET is plumbed through and whether cookie flags are explicitly set.
