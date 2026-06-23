---
name: auth-architecture
description: Better Auth configuration, session model, and auth flow overview
metadata:
  type: project
---

Better Auth v1.6.20 with Prisma adapter (PostgreSQL). Email+password auth only.

Key facts:
- Sign-up is disabled in the production auth instance (`disableSignUp: true` in server/src/lib/auth.ts)
- Sign-up is enabled in a separate `seedAuth` instance used only in prisma/seed.ts
- Sessions stored in the `session` table via Better Auth's built-in DB session management (not express-session despite the package being installed)
- `connect-pg-simple` and `express-session` are installed as dependencies but NOT wired up in server/src/index.ts
- Better Auth handles its own cookie/session logic via `toNodeHandler`
- `trustedOrigins` in auth.ts: localhost:5173 and localhost:3000
- CORS in index.ts: localhost:5173, 5174, 5175

**Why:** Understanding the session layer is critical for evaluating cookie security and session fixation risks.
**How to apply:** When adding new auth features, remember that express-session is present but unused — do not wire it unless intentional.
