---
name: missing-controls
description: Security controls that are absent from the codebase as of initial audit
metadata:
  type: project
---

As of 2026-06-22 audit:

- No Helmet.js (no security headers: X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security, etc.)
- No rate limiting on any endpoint (auth or otherwise)
- No Content Security Policy header
- No request body size limit (express.json() has no limit option set)
- CORS allows localhost:5174 and localhost:5175 in addition to :5173 — these appear to be dev artifacts and should be removed for production
- Login form uses `type="text"` for the email field instead of `type="email"` (minor — browser autocomplete/autofill concern, not a security issue)
- No brute-force protection on the login endpoint beyond what Better Auth may provide internally

**How to apply:** Before any production deployment, add Helmet, rate limiting (express-rate-limit), and body size limits. Clean up CORS origins.
