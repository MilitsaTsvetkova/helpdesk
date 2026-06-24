# Helpdesk Project

AI-powered ticket management system. See `project-scope.md` for full feature list and `implementation-plan.md` for phased task breakdown.

## Tech Stack

- **Frontend**: React 19 + React Router v7 + TypeScript, bundled with Vite (runs on `:5173`)
- **Backend**: Express + TypeScript, runtime Bun (runs on `:3000`)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: Better Auth with database sessions (`express-session` + `connect-pg-simple`)
- **UI**: Tailwind CSS v4 (`@tailwindcss/vite` plugin) + shadcn/ui components
- **AI**: Claude API (`claude-sonnet-4-6`)
- **Infrastructure**: Docker + cloud provider (AWS / Railway / Fly.io)

## Project Structure

```
helpdesk/
├── client/                   React SPA
│   ├── components.json       shadcn/ui config
│   └── src/
│       ├── components/
│       │   └── ui/           shadcn/ui primitives (Button, Input, Label, Form)
│       ├── lib/
│       │   └── utils.ts      cn() helper (clsx + tailwind-merge)
│       ├── pages/
│       └── index.css         Tailwind import + shadcn CSS variables
├── server/                   Express API
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

## E2E Testing (Playwright)

Tests live in `e2e/`. The test stack runs on different ports to avoid conflicting with dev servers:
- Backend on `:3001` — pointed at `helpdesk_test` database
- Frontend on `:5174` — Vite proxy auto-targets `:3001`

```bash
bun test:e2e           # headless
bun test:e2e:ui        # interactive UI mode
bun test:e2e:report    # open last HTML report
```

**Test database setup** (`helpdesk_test`):
- `global-setup.ts` creates the DB if absent and runs `prisma db push` to sync the schema
- The `helpdesk` postgres user needs `CREATEDB` privilege — grant once per machine:
  ```bash
  psql postgres -c "ALTER USER helpdesk CREATEDB;"
  ```
- Copy `.env.test.example` → `.env.test` (values work out of the box for local dev)
- Test data persists between runs for debugging; reset the schema manually with:
  ```bash
  cd server && DATABASE_URL=postgresql://helpdesk:helpdesk@localhost:5432/helpdesk_test bunx prisma db push --force-reset
  ```

## UI Components

shadcn/ui is installed manually for Tailwind v4 compatibility. Components live in `client/src/components/ui/`.

- Use `@/` path alias for all imports (maps to `client/src/`)
- Add new components with `npx shadcn@latest add <component>` from the `client/` directory
- On dark backgrounds, add `bg-transparent` to `variant="outline"` buttons — the default `bg-background` (white) will otherwise bleed through

## Tailwind CSS v4 Notes

- No `tailwind.config.js` — configuration is CSS-native
- CSS entry: `src/index.css` with `@import "tailwindcss"` + `@layer base` for design tokens + `@theme inline` for Tailwind variable mapping
- `components.json` has `tailwind.config: ""` (empty) per v4 convention

## Documentation

Always use **Context7 MCP** to fetch up-to-date documentation before writing code involving any library or framework — do not rely on training data.

```
1. mcp__context7__resolve-library-id  →  find the library ID
2. mcp__context7__query-docs          →  fetch relevant docs
3. Use the fetched docs to write the code
```

Apply this for: Express, React, React Router, Prisma, Bun, shadcn/ui, Tailwind, Better Auth, and any other dependency.
