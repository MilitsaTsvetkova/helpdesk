# Tech Stack

## Frontend
- **React** with **React Router** — SPA with client-side routing for dashboard, ticket list, and detail views
- **Tailwind CSS + shadcn/ui** — UI components

## Backend
- **Express** with **TypeScript** — REST API server
- **express-session** + **connect-pg-simple** — database-backed sessions stored in PostgreSQL

## Database
- **PostgreSQL** — relational DB for tickets, users, roles, and sessions
- **Prisma** — type-safe ORM

## Authentication
- Database sessions via **express-session** with **connect-pg-simple** (sessions stored in a `sessions` table in Postgres)
- Role-based access: Admin and Agent

## AI
- **Claude API (claude-sonnet-4-6)** — ticket classification, summarization, and reply suggestions

## Email Ingestion
- **Postmark** or **SendGrid Inbound** — parse inbound emails via webhook → create tickets

## Infrastructure
- **Docker** — containerized frontend, backend, and database
- Cloud provider: **AWS**, **Railway**, or **Fly.io**
