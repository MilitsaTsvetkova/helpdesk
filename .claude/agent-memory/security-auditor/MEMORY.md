# Security Auditor Memory Index

- [Auth Architecture](auth-architecture.md) — Better Auth v1.6.20 with Prisma adapter, email+password only, sign-up disabled in prod auth instance
- [Session Security Gaps](session-security-gaps.md) — BETTER_AUTH_SECRET not passed to betterAuth() config; SESSION_SECRET env var unused; no cookie hardening options set
- [Authorization Gaps](authorization-gaps.md) — No server-side admin middleware; requireAuth exists but no requireAdmin; /users page protected client-side only
- [Role Model](role-model.md) — Role enum: ADMIN | AGENT; role is additionalFields string (not enum) in Better Auth config; schema default is AGENT
- [Infrastructure Issues](infrastructure-issues.md) — Hardcoded DB creds in docker-compose; BETTER_AUTH_SECRET in committed server/.env; no Dockerfile present; no request size limits
- [Missing Controls](missing-controls.md) — No Helmet.js; no rate limiting; no CSP; CORS allows 3 localhost origins including 5174/5175 (dev artifacts); no body size limit
