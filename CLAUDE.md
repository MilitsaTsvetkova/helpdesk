# Helpdesk Project

AI-powered ticket management system. See `project-scope.md` for full feature list and `implementation-plan.md` for phased task breakdown.

## Tech Stack

- **Frontend**: React 19 + React Router v7 + TypeScript, bundled with Vite (runs on `:5173`); TanStack Query v5 for server state, Axios for HTTP
- **Backend**: Express + TypeScript, runtime Bun (runs on `:3000`)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: Better Auth with database sessions (`express-session` + `connect-pg-simple`)
- **UI**: Tailwind CSS v4 (`@tailwindcss/vite` plugin) + shadcn/ui components
- **AI**: Claude API (`claude-sonnet-4-6`)
- **Infrastructure**: Docker + cloud provider (AWS / Railway / Fly.io)

## Project Structure

```
helpdesk/
├── core/                     Shared code (Zod schemas, enums, types)
│   └── src/
│       ├── schemas/          Zod schemas + inferred types (user.ts, ticket.ts)
│       ├── roles.ts          Role const object
│       ├── tickets.ts        TicketStatus / TicketSource const objects
│       └── index.ts          re-exports everything
├── client/                   React SPA
│   ├── components.json       shadcn/ui config
│   └── src/
│       ├── components/
│       │   ├── ui/           shadcn/ui primitives (Button, Input, Label, …)
│       │   ├── Navbar.tsx
│       │   ├── TicketsTable.tsx
│       │   └── UsersTable.tsx
│       ├── contexts/
│       │   └── AuthContext.tsx
│       ├── lib/
│       │   └── utils.ts      cn() helper (clsx + tailwind-merge)
│       ├── pages/
│       │   ├── LoginPage.tsx
│       │   ├── TicketsPage.tsx
│       │   └── UsersPage.tsx
│       └── index.css         Tailwind import + shadcn CSS variables
├── server/                   Express API
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.ts           creates the ADMIN seed user
│   └── src/
│       ├── lib/
│       │   ├── auth.ts       Better Auth instance
│       │   ├── prisma.ts     PrismaClient singleton
│       │   └── validate.ts   validate() helper for Express routes
│       ├── middleware/
│       │   ├── requireAdmin.ts
│       │   └── requireAuth.ts
│       ├── routes/
│       │   ├── tickets.ts    GET /api/tickets, POST /api/tickets/inbound-email
│       │   └── users.ts      CRUD /api/users
│       └── index.ts          app entry point
├── e2e/                      Playwright E2E tests
├── docker-compose.yml
└── .env.example
```

## Dev Commands

```bash
bun run dev:server          # Express on :3000
bun run dev:client          # Vite on :5173
cd server && bun run seed   # create/restore the ADMIN seed user (run after any DB reset)
```

Vite proxies `/api/*` → `http://localhost:3000`.

The seed reads `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` from `server/.env`. Run it any time the dev DB is reset — without it, no admin user exists and sign-in will fail.

## Data Fetching

- Use **Axios** for all HTTP requests (`withCredentials: true` on every call so cookies are sent)
- Use **TanStack Query** (`useQuery`, `useMutation`) for all server state — no raw `useEffect`/`useState` for fetching
- `QueryClientProvider` is already mounted in `main.tsx`
- Extract query functions as standalone `async function` above the component, not inline

## Access Control

**Server middleware** — two guards in `server/src/middleware/`:
- `requireAuth` — rejects unauthenticated requests with `401`. Use on all private endpoints.
- `requireAdmin` — rejects non-admin sessions with `403`. Apply after `requireAuth` on admin-only endpoints.

**Client route guards** — two wrapper components in `client/src/components/`:
- `<ProtectedRoute>` — redirects to `/login` if no session. Wraps the entire authenticated shell in `App.tsx`.
- `<AdminRoute>` — redirects to `/` if the user is not an `ADMIN`. Wrap admin-only pages (e.g. `/users`).

**Navbar links** — show links conditionally based on `user.role`:
- Links visible to all authenticated users (e.g. Tickets): render unconditionally inside `<ProtectedRoute>`.
- Admin-only links (e.g. Users): gate with `user?.role === Role.ADMIN`.

**Inbound email webhook** (`POST /api/tickets/inbound-email`) is intentionally public — no session required, called by the email provider. Protect it with `INBOUND_EMAIL_WEBHOOK_SECRET` instead (see `.env.example`).

## UI Components

shadcn/ui is installed manually for Tailwind v4 compatibility. Components live in `client/src/components/ui/`.

- Use `@/` path alias for all imports (maps to `client/src/`)
- Add new components with `npx shadcn@latest add <component>` from the `client/` directory
- On dark backgrounds, add `bg-transparent` to `variant="outline"` buttons — the default `bg-background` (white) will otherwise bleed through

## Tailwind CSS v4 Notes

- No `tailwind.config.js` — configuration is CSS-native
- CSS entry: `src/index.css` with `@import "tailwindcss"` + `@layer base` for design tokens + `@theme inline` for Tailwind variable mapping
- `components.json` has `tailwind.config: ""` (empty) per v4 convention

## Shared Code (`core` package)

The `core` workspace package (`core/src/`) holds code that is used by both `client` and `server`. It is a Bun workspace dependency — no build step needed, both sides import directly from TypeScript source via the package's `exports` field.

**When to add something to `core`:**
- A Zod schema (and its inferred type) that is validated on the server and also used in a client form
- A shared enum or constant that would otherwise be duplicated (e.g. `Role`)
- A shared type that would otherwise be duplicated

**When NOT to use `core`:**
- Anything browser-specific (DOM, React, etc.)
- Anything server-specific (Prisma, Express, etc.)
- One-off types that only exist on one side

**Usage:**

```ts
// core/src/schemas/user.ts
import { z } from "zod";
export const createUserSchema = z.object({ ... });
export type CreateUserData = z.infer<typeof createUserSchema>;

// client or server
import { createUserSchema, type CreateUserData } from "core";
```

To add a new shared module: create a file under `core/src/`, export it from `core/src/index.ts`, then import with `from "core"` on either side.

## Enums and Constants

Never use magic strings for domain values. Define them as a `const` object in `core` and import everywhere:

```ts
// core/src/roles.ts
export const Role = {
  ADMIN: "ADMIN",
  AGENT: "AGENT",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

// usage (client or server)
import { Role } from "core";
if (user.role === Role.ADMIN) { ... }
```

Use a `const` object (not a TypeScript `enum`) — it compiles away cleanly, works with all bundlers, and the values remain readable at runtime.

## Data Validation

**Library**: Zod v4 (`"zod": "^4.4.3"`) — installed on both client and server.

### Client (React forms)

Use `zodResolver` from `@hookform/resolvers/zod` with React Hook Form:

```ts
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
type FormData = z.infer<typeof schema>;

const form = useForm<FormData>({ resolver: zodResolver(schema) });
```

### Server (Express routes)

Use the `validate` helper from `server/src/lib/validate.ts` — never call `safeParse` inline or use `parse` (which throws). It returns typed data on success, or sends a `400` and returns `null`:

```ts
import { validate } from "../lib/validate";

const data = validate(createUserSchema, req.body, res);
if (!data) return;
const { name, email } = data; // fully typed
```

### Zod v4 notes

- Use `.issues` (not `.errors` — removed in v4)
- Use `z.treeifyError(err)` for structured error trees (`.flatten()` is deprecated)
- Use `z.prettifyError(err)` for human-readable multi-line error strings
- Define schemas at module scope (not inside components/handlers)

## Unit & Component Testing

**Stack**: Vitest + React Testing Library + jsdom. Config lives in `client/vite.config.ts` (`test` block). Global test setup: `client/src/test/setup.ts` (imports `@testing-library/jest-dom`).

**Run commands** (from `client/`):

```bash
bun run test          # single run (CI)
bun run test:watch    # watch mode
```

**Conventions**:

- Co-locate test files next to the component: `Foo.tsx` → `Foo.test.tsx`
- Always use `renderWithQuery` from `@/test/render-with-query` instead of bare `render` — it wraps the component in a `QueryClientProvider` with `retry: false`
- Mock `axios` at the module level with `vi.mock("axios")`, then override per-test with `vi.mocked(axios).get = vi.fn().mockResolvedValue(...)` or `.mockRejectedValue(...)`
- Call `vi.clearAllMocks()` in `beforeEach` to prevent cross-test bleed
- Never mock TanStack Query itself — only mock the underlying `axios` calls
- Use `waitFor` (not raw `await`) when asserting on async state changes
- Test what the user sees: headings, table content, badges, error messages — not implementation details

**What to test per component**:

1. Loading state (skeleton / spinner visible, data not yet rendered)
2. Empty state (e.g. "No items found.")
3. Populated state (each row / item renders correctly)
4. Error state (API rejects → error message shown)
5. API called with correct args (`withCredentials: true`, right URL)
6. Visual variants (badge colours, conditional classes)

## E2E Testing

**Use E2E tests only for critical paths that require real browser + real backend integration.** Most scenarios should be covered by Vitest component tests instead.

### When to write an E2E test

Write E2E for things that cannot be adequately tested at the component level:
- **Critical happy paths** — does a real user action (login, create, delete) complete against the real DB and reflect in the UI?
- **Full-stack data flow** — does data created via one API endpoint appear correctly via another (e.g. inbound email → ticket list)?
- **Auth/redirect flows** — unauthenticated redirect to `/login`, role-based redirect to `/`
- **Real server errors** — duplicate-email conflict, wrong password (requires real backend response)
- **Ordering / sorting** — multiple seeded rows, DOM order verified against real DB timestamps

### When to use component tests instead

Use Vitest + React Testing Library for:
- Static rendering (headings, labels, buttons, form fields)
- Client-side validation messages
- Loading / skeleton states
- Empty states
- API called with correct URL and `withCredentials`
- Dialog open/close behavior (cancel, Escape, X button)
- Badge colours and conditional classes

### Writing E2E tests

Use the **`playwright-e2e-writer`** agent — invoke it after completing a significant feature. Never write E2E tests inline; always delegate to the agent.

```
Agent: playwright-e2e-writer
Trigger: after finishing a feature that needs real browser + backend coverage
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
