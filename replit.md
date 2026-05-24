# CineCircle

A collaborative movie watchlist app where friend groups track, discuss, and share films together.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/watchlist run dev` — run the frontend (port 26208)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `VITE_CLERK_PUBLISHABLE_KEY` — Clerk auth (auto-provisioned)
- Optional env: `OMDB_API_KEY` — OMDB movie data API (defaults to "trilogy" key)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS (dark cinematic theme)
- Auth: Clerk (email login + guest login via `@clerk/react`, `@clerk/express`)
- API: Express 5 + Zod validation
- DB: PostgreSQL + Drizzle ORM
- Movie data: OMDB API
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/watchlist/` — React frontend (all pages, components, theme)
- `artifacts/api-server/` — Express API server
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all routes)
- `lib/api-client-react/` — Generated React Query hooks + Zod schemas
- `lib/db/src/schema/` — Drizzle ORM schema (users, groups, members, invites, movies, reviews)

## Architecture decisions

- Contract-first API: OpenAPI spec drives both server validation (Zod) and client hooks (React Query via Orval)
- Clerk auth proxy middleware sits before all routes; `getAuth(req)` extracts user identity in handlers
- OMDB API used for movie search and detail; IMDB IDs are the stable identifier throughout the system
- Group invites use unique tokens (UUID) that expire after use or 7 days
- Movie statuses (want_to_watch / watched / liked) are per-user per-movie-entry

## Product

- **Groups** — create named film clubs, invite friends via shareable links
- **Movie lists** — search OMDB, add movies to group watchlists
- **Status tracking** — mark movies as Want to Watch, Watched, or Liked
- **Reviews** — post and edit discussion threads per movie per group
- **Stats** — group-level stats (total movies, watched count, top picks)
- **Activity feed** — recent actions across all groups

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- OMDB key "trilogy" is a fallback dev key with strict rate limits; set `OMDB_API_KEY` secret for production
- `pnpm --filter @workspace/db run push` must be run after any schema changes before the API server can start correctly
- Clerk dev keys show a warning in console — normal for development, use production keys when deploying

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- OpenAPI spec: `lib/api-spec/openapi.yaml`
- DB schema: `lib/db/src/schema/index.ts`
