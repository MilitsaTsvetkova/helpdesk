# Helpdesk Project

AI-powered ticket management system. See `project-scope.md` for full feature list and `implementation-plan.md` for phased task breakdown.

## Tech Stack

- **Frontend**: React 19 + React Router + TypeScript, bundled with Vite (runs on `:5173`)
- **Backend**: Express + TypeScript, runtime Bun (runs on `:3000`)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: Database sessions via `express-session` + `connect-pg-simple`
- **AI**: Claude API (`claude-sonnet-4-6`)
- **Infrastructure**: Docker + cloud provider (AWS / Railway / Fly.io)

## Project Structure

```
helpdesk/
├── client/         React SPA
│   └── src/
├── server/         Express API
│   └── src/
├── docker-compose.yml
└── .env.example
```

## Dev Commands

```bash
bun run dev:server   # Express on :3000
bun run dev:client   # Vite on :5173
```

Vite proxies `/api/*` → `http://localhost:3000`.

## Documentation

Always use **Context7 MCP** to fetch up-to-date documentation before writing code involving any library or framework — do not rely on training data.

```
1. mcp__context7__resolve-library-id  →  find the library ID
2. mcp__context7__query-docs          →  fetch relevant docs
3. Use the fetched docs to write the code
```

Apply this for: Express, React, React Router, Prisma, Bun, shadcn/ui, Tailwind, express-session, connect-pg-simple, and any other dependency.
