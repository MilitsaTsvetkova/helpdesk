---
name: infrastructure-issues
description: Infrastructure and secrets management issues found in initial audit
metadata:
  type: project
---

As of 2026-06-22 audit:

1. `server/.env` contains `BETTER_AUTH_SECRET=WK/PJGgzv333seaHyCIt3lQHlcWyNwGGRK2MudbdeEo=` — this is a real secret value that appears to be committed to the repo (file is at root .gitignore but server/.env gitignore status was unclear). CRITICAL if in git history.

2. `docker-compose.yml` hardcodes `POSTGRES_USER: helpdesk`, `POSTGRES_PASSWORD: helpdesk` — weak, predictable credentials. DB also exposes port 5432 to host network.

3. `docker-compose.yml` passes `DATABASE_URL: postgresql://helpdesk:helpdesk@postgres:5432/helpdesk` as a hardcoded environment variable — no secrets management.

4. No Dockerfile found in either client/ or server/ directories — the docker-compose references `build: ./server` and `build: ./client` but no Dockerfiles exist, meaning docker-compose build will fail.

5. SEED_ADMIN_PASSWORD defaults to `password123` in .env.example — weak default for seeding.

**How to apply:** Audit git history for committed secrets. Use docker secrets or environment injection for production. Never use weak default credentials.
