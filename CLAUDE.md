# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project purpose

Expense analytics app: ingest a CSV of bank transactions (date, label, merchant, etc.) into a database, let the user categorize transactions and flag recurring ones, then surface insights/analytics over that data. The codebase is currently a freshly scaffolded TanStack Start app (via `create-tanstack-app`) — no CSV import, categorization, or analytics features exist yet. The `todos` table in `src/db/schema.ts` is scaffold placeholder content, not a real domain model.

This project is explicitly **didactic**: the owner is using it to learn TanStack Start (latest version). When implementing features here, explain the relevant TanStack Start/Router/Query concept and why it's the right tool for the job (e.g. server function vs. API route, loader vs. client fetch) — don't just ship working code silently.

## Commands

```bash
npm run dev            # start dev server on port 3000
npm run build           # production build
npm run preview         # preview production build
npm run test             # run vitest (vitest run)
npm run lint              # eslint
npm run format            # prettier --write . && eslint --fix
npm run check              # prettier --check .
npm run generate-routes    # regenerate src/routeTree.gen.ts from src/routes (tsr generate)
```

Run a single test file: `npx vitest run path/to/file.test.ts`. Run tests matching a name: `npx vitest run -t "pattern"`.

Database (Drizzle + better-sqlite3, SQLite dialect):

```bash
npm run db:generate   # generate migration SQL from schema changes in src/db/schema.ts
npm run db:migrate    # apply pending migrations
npm run db:push       # push schema directly to DB without a migration file (dev convenience)
npm run db:pull       # introspect DB into schema
npm run db:studio     # open Drizzle Studio
```

`DATABASE_URL` is read from `.env.local`/`.env` (see `drizzle.config.ts`) and points at the local SQLite file. Migrations are written to `./drizzle`.

Add shadcn/ui components with the latest CLI (do not hand-roll components already offered by shadcn):

```bash
pnpm dlx shadcn@latest add <component>
```

## Architecture

**Stack**: TanStack Start (file-based routing via TanStack Router + SSR), React 19, TanStack Query, TanStack Table, Drizzle ORM over SQLite (`better-sqlite3`), Tailwind CSS v4, shadcn/ui ("new-york" style, zinc base, icons via lucide-react).

**Routing**: File-based — routes live in `src/routes/`, and `src/routeTree.gen.ts` is auto-generated from that directory (regenerate via `npm run generate-routes`; do not hand-edit it). `src/routes/__root.tsx` defines the document shell (`<html>`, global `<head>`, devtools panel, `<Scripts />`) and the shared `QueryClient` router context. `src/router.tsx` wires the router, its context, and the router↔query SSR integration together — this is the file to touch when changing global router/query setup.

**Server functions vs. API routes**: TanStack Start supports both `createServerFn` (RPC-style server logic called directly from components/loaders) and route-level `server.handlers` (REST-style API routes defined in a route file). Favor server functions for data loaded/mutated as part of route loaders; use API routes only when an actual HTTP endpoint is needed (e.g. a CSV upload endpoint).

**Database layer**: `src/db/schema.ts` defines Drizzle table schemas; `src/db/index.ts` exports the singleton `db` client built from `DATABASE_URL`. Schema changes go through `db:generate` (writes SQL to `./drizzle`) then `db:migrate`; `db:push` is a migration-less shortcut for local iteration only.

**Integrations**: `src/integrations/tanstack-query/` holds the TanStack Query provider/context (`root-provider.tsx`) and the devtools panel registration (`devtools.tsx`) that's plugged into `TanStackDevtools` in `__root.tsx`. Follow this pattern (a `root-provider.tsx` + `devtools.tsx` pair) if adding further cross-cutting integrations.

**Import aliases**: `#/*` and `@/*` both resolve to `./src/*` (see `tsconfig.json` paths and the `imports` field in `package.json`). shadcn/ui is configured to generate into `#/components`, `#/components/ui`, `#/lib`, `#/hooks` (see `components.json`).

**Styling**: Tailwind v4 is wired through `@tailwindcss/vite` (no separate Tailwind config file — config lives in `src/styles.css` via `components.json`'s `tailwind.css` pointer).

## Conventions

- No semicolons, single quotes, trailing commas everywhere (Prettier config in `prettier.config.js`) — always run through `npm run format` rather than hand-matching style.
- ESLint extends `@tanstack/eslint-config` with `import/no-cycle`, `import/order`, `sort-imports`, `@typescript-eslint/array-type`, `@typescript-eslint/require-await`, and `pnpm/json-enforce-catalog` turned off.
- TypeScript is `strict`, with `noUnusedLocals`/`noUnusedParameters`/`noFallthroughCasesInSwitch` enabled — dead locals/params and fallthrough switches fail the build, not just lint.
