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

## Data Fetching

- Use **Axios** for all HTTP requests (`withCredentials: true` on every call so cookies are sent)
- Use **TanStack Query** (`useQuery`, `useMutation`) for all server state — no raw `useEffect`/`useState` for fetching
- `QueryClientProvider` is already mounted in `main.tsx`
- Extract query functions as standalone `async function` above the component, not inline

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

Use `safeParse` — never `parse` (which throws). Return the first issue message on `400`:

```ts
import { z } from "zod";

const createUserSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters."),
  email: z.email("A valid email is required."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

const result = createUserSchema.safeParse(req.body);
if (!result.success) {
  res.status(400).json({ error: result.error.issues[0].message });
  return;
}
const { name, email } = result.data; // fully typed
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
