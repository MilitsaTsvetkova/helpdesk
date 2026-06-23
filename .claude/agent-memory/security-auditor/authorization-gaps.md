---
name: authorization-gaps
description: Authorization enforcement gaps — server-side admin check missing
metadata:
  type: project
---

Critical gap found (2026-06-22 audit):

- `requireAuth` middleware exists at server/src/middleware/requireAuth.ts and correctly validates the Better Auth session
- There is NO `requireAdmin` middleware or any server-side role check anywhere in the codebase
- The /users admin page is protected ONLY by the client-side `AdminRoute` component (client/src/components/AdminRoute.tsx)
- Any authenticated user (AGENT role) who directly calls API endpoints that will back the /users page will NOT be blocked server-side
- The `requireAuth` middleware attaches `req.user` including the `role` field — so building requireAdmin is trivial

**How to apply:** Every future admin-only API route MUST use a server-side requireAdmin middleware, not rely on client-side guards alone.
