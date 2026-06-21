# Implementation Plan

## Phase 1 — Project Setup & Infrastructure

- [ ] Initialize monorepo structure (`/client`, `/server`)
- [ ] Set up Express + TypeScript server (tsconfig, eslint, nodemon)
- [ ] Set up React + React Router + Tailwind + shadcn/ui client
- [ ] Set up PostgreSQL with Prisma (initial schema, migrations)
- [ ] Write `docker-compose.yml` for local dev (frontend, backend, postgres)
- [ ] Add `.env` handling for both client and server

---

## Phase 2 — Authentication

- [ ] Design `users` and `sessions` DB tables in Prisma schema
- [ ] Configure `express-session` + `connect-pg-simple`
- [ ] `POST /auth/login` — validate credentials, create session
- [ ] `POST /auth/logout` — destroy session
- [ ] `GET /auth/me` — return current user from session
- [ ] Auth middleware to protect routes (role check: admin vs. agent)
- [ ] Login page (React) with form and error handling
- [ ] Redirect unauthenticated users to login
- [ ] Seed script: create default admin user

---

## Phase 3 — User Management (Admin)

- [ ] Prisma schema: `users` table with role field
- [ ] `GET /users` — list all agents (admin only)
- [ ] `POST /users` — create agent (admin only)
- [ ] `PATCH /users/:id` — update agent (admin only)
- [ ] `DELETE /users/:id` — delete agent (admin only)
- [ ] User management UI page (list, create, edit, delete)

---

## Phase 4 — Ticket Core (CRUD)

- [ ] Prisma schema: `tickets` table (status, category, subject, body, assignee, timestamps)
- [ ] `GET /tickets` — list tickets with filtering (status, category) and sorting
- [ ] `GET /tickets/:id` — ticket detail
- [ ] `POST /tickets` — create ticket manually
- [ ] `PATCH /tickets/:id` — update ticket (status, assignee, category)
- [ ] Ticket list page with filters and sort controls
- [ ] Ticket detail page (read-only view with status/assignee controls)

---

## Phase 5 — Email Ingestion

- [ ] Set up Postmark or SendGrid inbound webhook
- [ ] `POST /webhooks/inbound-email` — parse payload, create ticket
- [ ] Validate webhook authenticity (signature or token)
- [ ] Map email fields to ticket fields (subject, body, sender)
- [ ] Handle duplicate/spam emails gracefully

---

## Phase 6 — AI Features

- [ ] Integrate Claude API (`claude-sonnet-4-6`) in backend service
- [ ] AI classification: on ticket create, classify into category (General, Technical, Refund)
- [ ] AI summary: generate short summary for ticket detail view
- [ ] AI suggested reply: generate draft response using knowledge base context
- [ ] `POST /tickets/:id/ai-reply` — endpoint to trigger/regenerate suggested reply
- [ ] Display AI summary and suggested reply in ticket detail UI
- [ ] Allow agent to edit and send suggested reply

---

## Phase 7 — Dashboard

- [ ] `GET /dashboard/stats` — counts by status and category
- [ ] Dashboard page: open/resolved/closed counts, tickets by category
- [ ] Recent tickets widget on dashboard
- [ ] Basic charts or stat cards (shadcn/ui components)

---

## Phase 8 — Deployment

- [ ] Write production `Dockerfile` for backend
- [ ] Write production `Dockerfile` for frontend (static build served via nginx)
- [ ] Set up cloud provider (AWS / Railway / Fly.io)
- [ ] Configure environment variables in production
- [ ] Set up managed Postgres in production
- [ ] Configure inbound email webhook URL to point to production
- [ ] Smoke test all features in production environment
