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

## UI Components

shadcn/ui is installed manually for Tailwind v4 compatibility. Components live in `client/src/components/ui/`.

- Use `@/` path alias for all imports (maps to `client/src/`)
- Add new components with `npx shadcn@latest add <component>` from the `client/` directory
- On dark backgrounds, add `bg-transparent` to `variant="outline"` buttons — the default `bg-background` (white) will otherwise bleed through

## Tailwind CSS v4 Notes

- No `tailwind.config.js` — configuration is CSS-native
- CSS entry: `src/index.css` with `@import "tailwindcss"` + `@layer base` for design tokens + `@theme inline` for Tailwind variable mapping
- `components.json` has `tailwind.config: ""` (empty) per v4 convention

## E2E Testing

Use the **`playwright-e2e-writer`** agent to write Playwright tests — invoke it after completing any significant UI feature, page, form, or auth flow. Never write E2E tests inline; always delegate to the agent.

```
Agent: playwright-e2e-writer
Trigger: after finishing a feature, page, or user flow that needs browser-level coverage
```

The agent has full knowledge of the test infrastructure (ports, DB setup, run commands, POM conventions). See `.claude/agents/playwright-e2e-writer.md` for its configuration.

## Documentation

Always use **Context7 MCP** to fetch up-to-date documentation before writing code involving any library or framework — do not rely on training data.

```
1. mcp__context7__resolve-library-id  →  find the library ID
2. mcp__context7__query-docs          →  fetch relevant docs
3. Use the fetched docs to write the code
```

Apply this for: Express, React, React Router, Prisma, Bun, shadcn/ui, Tailwind, Better Auth, and any other dependency.
